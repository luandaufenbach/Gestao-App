const crypto = require("node:crypto");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const SALT_ROUNDS = 12;

/**
 * Validade do token de recuperação de senha.
 *
 * Uma hora é o compromisso usual: tempo suficiente para o e-mail chegar e o
 * usuário agir, curto o bastante para que um link esquecido em caixa de entrada
 * invadida depois não sirva mais para nada.
 */
const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;

/**
 * Validade do token de verificação de e-mail.
 *
 * Bem mais longa que a da recuperação de senha, e de propósito: aqui o token não
 * dá acesso a nada — confirmar um endereço não troca senha nem abre sessão. O
 * risco de um link esquecido na caixa de entrada é baixo, e o custo de expirar
 * rápido é alto: quem cadastra à noite e só abre o e-mail no dia seguinte teria
 * de pedir outro link. 24 horas cobrem esse caso sem deixar o token eterno.
 */
const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * Hash determinístico de um token enviado por e-mail.
 *
 * SHA-256 sem salt, de propósito: a busca precisa encontrar o usuário a partir do
 * token recebido, e isso exige um hash determinístico. É seguro aqui porque o
 * token tem 256 bits aleatórios — não há dicionário para atacar, diferente de uma
 * senha escolhida por pessoa, onde o bcrypt é obrigatório.
 *
 * Os dois fluxos (recuperação de senha e verificação de e-mail) usam esta mesma
 * função. Cada um expõe seu próprio nome nos statics para que o chamador diga
 * qual token está tratando, mas o algoritmo é um só.
 */
function hashEmailedToken(token) {
	return crypto.createHash("sha256").update(token).digest("hex");
}

const UserSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: [true, "Nome é obrigatório"],
			trim: true,
			maxlength: 120,
		},
		email: {
			type: String,
			required: [true, "E-mail é obrigatório"],
			unique: true,
			trim: true,
			lowercase: true,
			maxlength: 254,
		},
		passwordHash: {
			type: String,
			required: true,
			// Nunca retorna o hash em consultas, a menos que pedido explicitamente
			// com .select("+passwordHash"). Protege contra vazamento acidental
			// em qualquer res.json(user).
			select: false,
		},
		/**
		 * SHA-256 do token de recuperação, nunca o token em claro.
		 *
		 * O token só existe no e-mail do usuário. Guardar apenas o hash significa
		 * que um vazamento do banco não permite trocar a senha de ninguém — quem
		 * lesse a coleção teria só o digest, e o digest não serve como token.
		 */
		passwordResetTokenHash: {
			type: String,
			select: false,
		},
		passwordResetExpiresAt: {
			type: Date,
			select: false,
		},
		/**
		 * Instante em que o titular confirmou o endereço de e-mail.
		 *
		 * Data, e não booleano, porque a data responde o que o booleano não
		 * responde: há quanto tempo a conta está verificada. É disso que depende
		 * qualquer regra futura do tipo "conta não verificada não acumula dados
		 * por mais de 7 dias" — com um booleano seria preciso adivinhar a partir
		 * do `createdAt`.
		 *
		 * `null` é o estado inicial e significa "não verificado". Diferente dos
		 * campos de token, este NÃO tem `select: false`: é informação que a
		 * própria interface precisa ler para avisar o usuário.
		 */
		emailVerifiedAt: {
			type: Date,
			default: null,
		},
		/**
		 * SHA-256 do token de verificação, nunca o token em claro — mesma razão
		 * do `passwordResetTokenHash` acima.
		 */
		emailVerificationTokenHash: {
			type: String,
			select: false,
		},
		emailVerificationExpiresAt: {
			type: Date,
			select: false,
		},
	},
	{ timestamps: true }
);

/**
 * Índice para a busca do token na troca de senha, que filtra pelo hash.
 *
 * O filtro parcial existe porque o campo é opcional: sem ele, o índice guardaria
 * uma entrada nula para cada usuário da base, que nunca é consultada.
 */
UserSchema.index(
	{ passwordResetTokenHash: 1 },
	{ partialFilterExpression: { passwordResetTokenHash: { $type: "string" } } }
);

/**
 * Mesmo arranjo para a verificação de e-mail: a consulta de
 * `POST /auth/verify-email` filtra pelo hash, e o filtro parcial mantém fora do
 * índice todo usuário que já verificou (ou que nunca pediu link), que é a
 * maioria da base depois do primeiro dia de vida de cada conta.
 */
UserSchema.index(
	{ emailVerificationTokenHash: 1 },
	{ partialFilterExpression: { emailVerificationTokenHash: { $type: "string" } } }
);

/**
 * Define a senha do usuário já aplicando o hash.
 * Concentrar o hashing aqui garante que nenhum controller grave senha em claro.
 */
UserSchema.methods.setPassword = async function setPassword(plainPassword) {
	this.passwordHash = await bcrypt.hash(plainPassword, SALT_ROUNDS);
};

/** Compara uma senha em claro com o hash armazenado. */
UserSchema.methods.verifyPassword = function verifyPassword(plainPassword) {
	if (!this.passwordHash) return Promise.resolve(false);
	return bcrypt.compare(plainPassword, this.passwordHash);
};

/** Calcula o hash de um token de recuperação (ver `hashEmailedToken`). */
UserSchema.statics.hashPasswordResetToken = function hashPasswordResetToken(token) {
	return hashEmailedToken(token);
};

/**
 * Gera um token de recuperação, guarda o hash e devolve o token em claro.
 *
 * O valor retornado é a única cópia utilizável do token e só deve ir para o
 * e-mail do usuário. Sobrescrever o hash invalida qualquer link pedido antes.
 */
UserSchema.methods.createPasswordResetToken = function createPasswordResetToken() {
	const token = crypto.randomBytes(32).toString("hex");

	this.passwordResetTokenHash = this.constructor.hashPasswordResetToken(token);
	this.passwordResetExpiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MS);

	return token;
};

/**
 * Consome o token: limpa os dois campos.
 * Sem isso o mesmo link funcionaria mais de uma vez, até expirar.
 */
UserSchema.methods.clearPasswordResetToken = function clearPasswordResetToken() {
	this.passwordResetTokenHash = undefined;
	this.passwordResetExpiresAt = undefined;
};

/** Calcula o hash de um token de verificação (ver `hashEmailedToken`). */
UserSchema.statics.hashEmailVerificationToken = function hashEmailVerificationToken(token) {
	return hashEmailedToken(token);
};

/**
 * Gera um token de verificação, guarda o hash e devolve o token em claro.
 *
 * Mesmo contrato do `createPasswordResetToken`: o valor retornado é a única cópia
 * utilizável e só deve ir para o e-mail do usuário. Gerar outro sobrescreve o
 * hash anterior, então pedir um reenvio invalida o link pedido antes — é o que
 * impede que uma caixa de entrada acumule vários links válidos ao mesmo tempo.
 */
UserSchema.methods.createEmailVerificationToken = function createEmailVerificationToken() {
	const token = crypto.randomBytes(32).toString("hex");

	this.emailVerificationTokenHash = this.constructor.hashEmailVerificationToken(token);
	this.emailVerificationExpiresAt = new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS);

	return token;
};

/**
 * Consome o token de verificação: limpa os dois campos.
 * Sem isso o mesmo link funcionaria mais de uma vez, até expirar.
 */
UserSchema.methods.clearEmailVerificationToken = function clearEmailVerificationToken() {
	this.emailVerificationTokenHash = undefined;
	this.emailVerificationExpiresAt = undefined;
};

/** `true` quando o titular já confirmou o endereço. */
UserSchema.methods.isEmailVerified = function isEmailVerified() {
	return Boolean(this.emailVerifiedAt);
};

/** Representação segura para enviar ao cliente. */
UserSchema.methods.toPublicJSON = function toPublicJSON() {
	return {
		id: this._id,
		name: this.name,
		email: this.email,
		createdAt: this.createdAt,
		/**
		 * O booleano é o que a interface consome; a data vai junto para que ela
		 * possa dizer desde quando, sem uma segunda rota.
		 *
		 * Usuário criado antes deste campo existir não tem `emailVerifiedAt` no
		 * documento, então aqui ele vira `false`/`null` — e NÃO perde acesso a
		 * nada por isso: nenhuma rota recusa por falta de verificação. Ver a nota
		 * de compatibilidade em controllers/authController.js.
		 */
		emailVerified: this.isEmailVerified(),
		emailVerifiedAt: this.emailVerifiedAt ?? null,
	};
};

module.exports = mongoose.model("User", UserSchema);
