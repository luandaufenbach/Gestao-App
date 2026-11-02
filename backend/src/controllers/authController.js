const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Category = require("../models/Category");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const { sendPasswordResetEmail, sendEmailVerification } = require("../utils/mailer");
const { jwtSecret, jwtExpiresIn } = require("../config/env");

/** Categorias criadas automaticamente para um usuário novo. */
const DEFAULT_CATEGORIES = [
	{ name: "Mercado", color: "#22c55e", icon: "shopping-cart" },
	{ name: "Combustível", color: "#f59e0b", icon: "fuel" },
	{ name: "Lazer", color: "#8b5cf6", icon: "smile" },
	{ name: "Saúde", color: "#ef4444", icon: "heart" },
	{ name: "Moradia", color: "#0ea5e9", icon: "home" },
	{ name: "Outros", color: "#94a3b8", icon: "tag" },
];

const signToken = (userId) =>
	jwt.sign({ sub: String(userId) }, jwtSecret, { expiresIn: jwtExpiresIn });

/**
 * Hash descartável, com o mesmo custo (12 rounds) dos hashes reais.
 *
 * Serve para gastar o mesmo tempo de CPU quando o e-mail não existe. Sem isso,
 * um e-mail não cadastrado responderia em ~1ms e um cadastrado em ~100ms — a
 * diferença permitiria enumerar quais contas existem. Corresponde à string
 * "senha-que-nunca-sera-usada".
 */
const DUMMY_HASH = "$2b$12$C6UzMDM.H6dfI/f/IKcEe.aQY1TIhrxKC/OGyKqGpMH0S/RhP0hbW";

const register = asyncHandler(async (req, res) => {
	const { name, email, password } = req.body;

	const existing = await User.findOne({ email });
	if (existing) {
		throw AppError.conflict("Já existe uma conta com esse e-mail");
	}

	const user = new User({ name, email });
	await user.setPassword(password);
	// Gerado antes do save para que o cadastro seja uma única escrita, e não
	// "cria o usuário, depois grava o token".
	const verificationToken = user.createEmailVerificationToken();
	await user.save();

	// Um usuário sem categorias não consegue lançar despesas, já que categoria
	// é obrigatória para débito/crédito. Semear evita esse beco sem saída.
	await Category.insertMany(
		DEFAULT_CATEGORIES.map((category) => ({ ...category, user: user._id }))
	);

	/**
	 * O e-mail de verificação sai aqui, mas o cadastro NÃO depende dele.
	 *
	 * O mailer nunca lança (ver utils/mailer.js) e a resposta continua 201 com o
	 * token de sessão: a conta nasce utilizável e não verificada. Bloquear o uso
	 * até a confirmação é decisão de produto e não está ligada — o estado é
	 * apenas registrado e exposto em GET /auth/me.
	 */
	await sendEmailVerification({ to: user.email, token: verificationToken });

	return res.status(201).json({
		token: signToken(user._id),
		user: user.toPublicJSON(),
	});
});

const login = asyncHandler(async (req, res) => {
	const { email, password } = req.body;

	// O hash tem select:false no schema, então precisa ser pedido explicitamente.
	const user = await User.findOne({ email }).select("+passwordHash");

	// Mensagem idêntica para e-mail inexistente e senha errada: revelar qual
	// dos dois falhou permitiria enumerar contas cadastradas.
	const invalid = AppError.unauthorized("E-mail ou senha inválidos");

	if (!user) {
		// Gasta o mesmo tempo de CPU de uma comparação real para não vazar a
		// existência da conta pelo tempo de resposta.
		await bcrypt.compare(password, DUMMY_HASH);
		throw invalid;
	}

	const passwordMatches = await user.verifyPassword(password);
	if (!passwordMatches) {
		throw invalid;
	}

	return res.json({
		token: signToken(user._id),
		user: user.toPublicJSON(),
	});
});

/** Campos de recuperação, que têm select:false no schema. */
const RESET_FIELDS = "+passwordResetTokenHash +passwordResetExpiresAt";

/**
 * Mensagem única de /auth/forgot-password.
 *
 * Responder "e-mail não cadastrado" transformaria a rota em consulta de contas:
 * qualquer pessoa testaria uma lista de e-mails e descobriria quem tem conta
 * aqui. Por isso a resposta é idêntica exista o e-mail ou não.
 */
const FORGOT_PASSWORD_MESSAGE =
	"Se existir uma conta com esse e-mail, enviamos um link para redefinir a senha.";

const forgotPassword = asyncHandler(async (req, res) => {
	const { email } = req.body;

	const user = await User.findOne({ email }).select(RESET_FIELDS);

	if (user) {
		// Gerar um token novo sobrescreve o hash anterior: pedir outro link
		// invalida o link pedido antes, sem precisar de limpeza separada.
		const token = user.createPasswordResetToken();
		await user.save();

		// O mailer nunca lança (ver utils/mailer.js). Uma falha de envio não pode
		// mudar o status nem o tempo desta resposta.
		await sendPasswordResetEmail({ to: user.email, token });
	}

	return res.json({ message: FORGOT_PASSWORD_MESSAGE });
});

const resetPassword = asyncHandler(async (req, res) => {
	const { token, password } = req.body;

	/**
	 * A busca é pelo HASH do token, não pelo e-mail.
	 *
	 * Duas consequências de propósito: o cliente não precisa (nem pode) informar
	 * de quem é a conta, e o token em claro nunca existiu no banco. O filtro de
	 * validade na própria consulta faz token expirado simplesmente não casar.
	 */
	const user = await User.findOne({
		passwordResetTokenHash: User.hashPasswordResetToken(token),
		passwordResetExpiresAt: { $gt: new Date() },
	}).select(RESET_FIELDS);

	// Mensagem única para inválido, expirado e já usado: distinguir os casos
	// contaria ao atacante se o token existiu algum dia.
	if (!user) {
		throw AppError.badRequest("Link de recuperação inválido ou expirado");
	}

	// Mesmo caminho do cadastro — o hashing da senha mora só no model.
	await user.setPassword(password);
	// Consome o token antes de salvar: o mesmo link não funciona duas vezes.
	user.clearPasswordResetToken();
	await user.save();

	// Sem login automático de propósito: quem abriu o link pode não ser o dono da
	// conta (link encaminhado, navegador compartilhado). A nova senha, aí sim,
	// prova quem é.
	return res.json({ message: "Senha redefinida. Faça login com a nova senha." });
});

/** Campos de verificação de e-mail, que têm select:false no schema. */
const VERIFICATION_FIELDS = "+emailVerificationTokenHash +emailVerificationExpiresAt";

/**
 * Mensagem única de /auth/verify-email.
 *
 * Token inválido, expirado e já consumido recebem exatamente esta mensagem, com
 * status 400. Não é só uniformidade de fachada: depois de consumido, o token
 * SAIU do banco, então o servidor não tem como distinguir "já usei este" de
 * "nunca existiu" sem guardar um histórico de tokens usados — e guardar isso
 * para poder responder diferente seria construir, de propósito, um oráculo que
 * confirma quais tokens já circularam.
 *
 * DECISÃO: a segunda verificação responde 400, não 200 idempotente.
 *
 * A rota recebe um token, não uma identidade: ela é anônima e não sabe de quem é
 * a conta antes de encontrar o token. Um 200 idempotente exigiria responder
 * "tudo certo" a um token desconhecido — ou seja, a qualquer token — o que
 * tornaria a rota inútil como prova de posse do e-mail. O efeito prático é
 * inofensivo: a conta continua verificada (nada é desfeito) e quem precisa saber
 * o estado consulta GET /auth/me, que é autenticado e pode ser específico.
 */
const VERIFY_EMAIL_MESSAGE = "Link de verificação inválido ou expirado";

const verifyEmail = asyncHandler(async (req, res) => {
	const { token } = req.body;

	/**
	 * A busca é pelo HASH do token, igual à troca de senha: o cliente não precisa
	 * (nem pode) informar de quem é a conta, e o token em claro nunca existiu no
	 * banco. O filtro de validade na própria consulta faz token expirado
	 * simplesmente não casar.
	 */
	const user = await User.findOne({
		emailVerificationTokenHash: User.hashEmailVerificationToken(token),
		emailVerificationExpiresAt: { $gt: new Date() },
	}).select(VERIFICATION_FIELDS);

	if (!user) {
		throw AppError.badRequest(VERIFY_EMAIL_MESSAGE);
	}

	user.emailVerifiedAt = new Date();
	// Consome o token antes de salvar: o mesmo link não funciona duas vezes.
	user.clearEmailVerificationToken();
	await user.save();

	/**
	 * Sem login automático, pelo mesmo motivo do reset de senha: quem abriu o
	 * link pode não ser o dono da sessão (link encaminhado, navegador
	 * compartilhado). O usuário vem na resposta só para a tela poder mostrar o
	 * estado novo sem uma segunda chamada.
	 */
	return res.json({ message: "E-mail verificado.", user: user.toPublicJSON() });
});

const resendVerification = asyncHandler(async (req, res) => {
	// Rota autenticada: o alvo é sempre a conta do próprio token, nunca um e-mail
	// vindo do corpo. Aceitar e-mail aqui transformaria a rota em uma máquina de
	// spam contra endereço de terceiro.
	const user = await User.findById(req.userId).select(VERIFICATION_FIELDS);

	if (!user) {
		throw AppError.unauthorized("Usuário não encontrado");
	}

	/**
	 * Conta já verificada não dispara e-mail nenhum.
	 *
	 * E a resposta diz isso com clareza, diferente de /auth/forgot-password, que
	 * precisa de mensagem única. A diferença é quem pergunta: lá é um anônimo
	 * sobre um e-mail qualquer, e distinguir os casos viraria consulta de contas;
	 * aqui é o titular autenticado sobre a própria conta, informação que ele já
	 * obtém em GET /auth/me.
	 */
	if (user.isEmailVerified()) {
		return res.json({ message: "Seu e-mail já está verificado.", emailVerified: true });
	}

	// Gerar um token novo sobrescreve o hash anterior: pedir outro link invalida
	// o link pedido antes, sem precisar de limpeza separada.
	const token = user.createEmailVerificationToken();
	await user.save();

	// O mailer nunca lança (ver utils/mailer.js).
	await sendEmailVerification({ to: user.email, token });

	return res.json({
		message: "Enviamos um novo link de verificação para o seu e-mail.",
		emailVerified: false,
	});
});

/**
 * NOTA DE COMPATIBILIDADE — contas criadas antes de `emailVerifiedAt` existir.
 *
 * Os documentos antigos não têm o campo. O `default: null` do schema só vale
 * para documento novo, então eles são lidos como não verificados e aparecem
 * assim em GET /auth/me. Isso NÃO lhes custa acesso a nada: nenhuma rota recusa
 * por falta de verificação. O único efeito é a interface avisar sobre
 * verificação para quem usa o app desde antes.
 *
 * Para dispensar a base existente, um backfill marca essas contas como
 * verificadas na data em que foram criadas. Nenhum script roda daqui: o `.env`
 * local aponta para produção (ver CLAUDE.md).
 */

/**
 * Estado da sessão atual, incluindo `emailVerified` e `emailVerifiedAt`.
 *
 * É daqui que a interface descobre se deve mostrar o aviso de verificação. A
 * rota é a única fonte desse estado: nenhuma outra recusa requisição por causa
 * dele.
 */
const me = asyncHandler(async (req, res) => {
	const user = await User.findById(req.userId);
	if (!user) {
		throw AppError.unauthorized("Usuário não encontrado");
	}
	return res.json(user.toPublicJSON());
});

module.exports = {
	register,
	login,
	me,
	forgotPassword,
	resetPassword,
	verifyEmail,
	resendVerification,
	DEFAULT_CATEGORIES,
};
