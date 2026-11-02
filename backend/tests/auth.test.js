import { describe, it, expect, vi } from "vitest";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { app, request, createUser } from "./helpers.js";

/**
 * O model já registrado pelo app, pego do registro do Mongoose.
 *
 * Importar `../src/models/User.js` direto faria o arquivo ser avaliado uma
 * segunda vez — o app o carrega por `require` — e o Mongoose recusa com
 * "Cannot overwrite `User` model once compiled".
 */
const User = mongoose.model("User");

describe("POST /auth/register", () => {
	it("cria o usuário, devolve token e semeia as categorias padrão", async () => {
		const response = await request(app)
			.post("/auth/register")
			.send({ name: "Luan", email: "luan@exemplo.com", password: "senha1234" })
			.expect(201);

		expect(response.body.token).toBeTypeOf("string");
		expect(response.body.user.email).toBe("luan@exemplo.com");

		// O hash da senha jamais pode aparecer na resposta.
		expect(response.body.user.passwordHash).toBeUndefined();

		const categories = await request(app)
			.get("/categories")
			.set("Authorization", `Bearer ${response.body.token}`)
			.expect(200);

		expect(categories.body.length).toBeGreaterThan(0);
	});

	it("rejeita senha fraca", async () => {
		const response = await request(app)
			.post("/auth/register")
			.send({ name: "Luan", email: "a@b.com", password: "123" })
			.expect(400);

		expect(response.body.details).toBeDefined();
	});

	it("rejeita e-mail duplicado", async () => {
		const payload = { name: "Luan", email: "dup@exemplo.com", password: "senha1234" };

		await request(app).post("/auth/register").send(payload).expect(201);
		await request(app).post("/auth/register").send(payload).expect(409);
	});

	it("ignora campos não declarados no schema", async () => {
		await request(app)
			.post("/auth/register")
			.send({
				name: "Luan",
				email: "extra@exemplo.com",
				password: "senha1234",
				isAdmin: true, // campo injetado
			})
			.expect(400);
	});
});

describe("POST /auth/login", () => {
	it("autentica com credenciais corretas", async () => {
		await request(app)
			.post("/auth/register")
			.send({ name: "Luan", email: "login@exemplo.com", password: "senha1234" })
			.expect(201);

		const response = await request(app)
			.post("/auth/login")
			.send({ email: "login@exemplo.com", password: "senha1234" })
			.expect(200);

		expect(response.body.token).toBeTypeOf("string");
	});

	it("usa a mesma mensagem para e-mail inexistente e senha errada", async () => {
		await request(app)
			.post("/auth/register")
			.send({ name: "Luan", email: "existe@exemplo.com", password: "senha1234" })
			.expect(201);

		const senhaErrada = await request(app)
			.post("/auth/login")
			.send({ email: "existe@exemplo.com", password: "outrasenha1" })
			.expect(401);

		const emailInexistente = await request(app)
			.post("/auth/login")
			.send({ email: "naoexiste@exemplo.com", password: "senha1234" })
			.expect(401);

		// Mensagens distintas permitiriam enumerar contas cadastradas.
		expect(senhaErrada.body.message).toBe(emailInexistente.body.message);
	});
});

describe("recuperação de senha", () => {
	/**
	 * Pede um token e devolve o valor em claro.
	 *
	 * O token só existe no e-mail: no banco fica apenas o hash, então não há como
	 * lê-lo do banco. Sem MAIL_PROVIDER configurado, o mailer escreve o link no
	 * console — o mesmo caminho que o desenvolvedor usa — e é de lá que o teste lê.
	 */
	async function pedirToken(email) {
		const linhas = [];
		const spy = vi.spyOn(console, "log").mockImplementation((...args) => {
			linhas.push(args.join(" "));
		});

		try {
			const response = await request(app)
				.post("/auth/forgot-password")
				.send({ email })
				.expect(200);

			return {
				message: response.body.message,
				token: linhas.join("\n").match(/token=([a-f0-9]{64})/)?.[1] ?? null,
			};
		} finally {
			spy.mockRestore();
		}
	}

	const trocarSenha = (token, password) =>
		request(app).post("/auth/reset-password").send({ token, password });

	it("responde igual para e-mail inexistente e não cria token", async () => {
		await createUser({ email: "existente@exemplo.com" });

		const semConta = await pedirToken("naoexiste@exemplo.com");

		expect(semConta.token).toBeNull();
		expect(await User.countDocuments({ passwordResetTokenHash: { $exists: true } })).toBe(0);

		const comConta = await pedirToken("existente@exemplo.com");

		// Mensagem idêntica nos dois casos: a diferença revelaria quem tem conta.
		expect(comConta.message).toBe(semConta.message);
		expect(comConta.token).toMatch(/^[a-f0-9]{64}$/);
	});

	it("grava só o hash do token, com validade de 1 hora", async () => {
		await createUser({ email: "hash@exemplo.com" });

		const { token } = await pedirToken("hash@exemplo.com");
		const gravado = await User.findOne({ email: "hash@exemplo.com" }).select(
			"+passwordResetTokenHash +passwordResetExpiresAt"
		);

		// Se o banco vazar, o que está lá não serve como token.
		expect(gravado.passwordResetTokenHash).not.toBe(token);
		expect(gravado.passwordResetTokenHash).toBe(User.hashPasswordResetToken(token));

		const restante = gravado.passwordResetExpiresAt.getTime() - Date.now();
		expect(restante).toBeLessThanOrEqual(60 * 60 * 1000);
		expect(restante).toBeGreaterThan(55 * 60 * 1000);
	});

	it("troca a senha e passa a aceitar só a nova", async () => {
		await createUser({ email: "fluxo@exemplo.com", password: "senhaAntiga1" });

		const { token } = await pedirToken("fluxo@exemplo.com");
		const troca = await trocarSenha(token, "senhaNova456").expect(200);

		// Não faz login automático: nenhum token de sessão na resposta.
		expect(troca.body.token).toBeUndefined();

		await request(app)
			.post("/auth/login")
			.send({ email: "fluxo@exemplo.com", password: "senhaNova456" })
			.expect(200);

		await request(app)
			.post("/auth/login")
			.send({ email: "fluxo@exemplo.com", password: "senhaAntiga1" })
			.expect(401);
	});

	it("recusa o mesmo token na segunda vez", async () => {
		await createUser({ email: "unico@exemplo.com" });

		const { token } = await pedirToken("unico@exemplo.com");

		await trocarSenha(token, "primeira123").expect(200);
		await trocarSenha(token, "segunda123").expect(400);

		// O token foi consumido: os dois campos saíram do documento.
		const depois = await User.findOne({ email: "unico@exemplo.com" }).select(
			"+passwordResetTokenHash +passwordResetExpiresAt"
		);
		expect(depois.passwordResetTokenHash).toBeUndefined();
		expect(depois.passwordResetExpiresAt).toBeUndefined();

		// E a segunda tentativa não trocou nada.
		await request(app)
			.post("/auth/login")
			.send({ email: "unico@exemplo.com", password: "primeira123" })
			.expect(200);
	});

	it("recusa token expirado", async () => {
		await createUser({ email: "expirado@exemplo.com" });

		const { token } = await pedirToken("expirado@exemplo.com");

		// Expira o token no banco, relativo a agora — nunca uma data fixa, que
		// envelheceria junto com o teste.
		await User.updateOne(
			{ email: "expirado@exemplo.com" },
			{ $set: { passwordResetExpiresAt: new Date(Date.now() - 1_000) } }
		);

		await trocarSenha(token, "senhaNova456").expect(400);
	});

	it("recusa token adulterado", async () => {
		await createUser({ email: "adulterado@exemplo.com" });

		const { token } = await pedirToken("adulterado@exemplo.com");

		// Último caractere trocado, formato preservado: o que recusa é a
		// comparação do hash, não o formato.
		const adulterado = token.slice(0, -1) + (token.endsWith("a") ? "b" : "a");
		expect(adulterado).not.toBe(token);

		await trocarSenha(adulterado, "senhaNova456").expect(400);
	});

	it("pedir um segundo token invalida o primeiro", async () => {
		await createUser({ email: "dois@exemplo.com" });

		const primeiro = await pedirToken("dois@exemplo.com");
		const segundo = await pedirToken("dois@exemplo.com");

		expect(segundo.token).not.toBe(primeiro.token);

		await trocarSenha(primeiro.token, "senhaNova456").expect(400);
		await trocarSenha(segundo.token, "senhaNova456").expect(200);
	});

	it("recusa senha fraca sem consumir o token", async () => {
		await createUser({ email: "fraca@exemplo.com" });

		const { token } = await pedirToken("fraca@exemplo.com");
		const response = await trocarSenha(token, "123").expect(400);

		expect(response.body.details).toBeDefined();

		// A senha recusada não gasta o link: o usuário tenta de novo.
		await trocarSenha(token, "senhaValida1").expect(200);
	});
});

describe("verificação de e-mail", () => {
	const VERIFICACAO_FIELDS = "+emailVerificationTokenHash +emailVerificationExpiresAt";

	/**
	 * Executa uma ação e devolve o token de verificação que saiu no e-mail.
	 *
	 * Mesmo caminho do teste de recuperação: o token só existe no e-mail, porque
	 * no banco fica apenas o hash. Sem MAIL_PROVIDER configurado o mailer escreve
	 * o link no console, e é de lá que o teste lê. O recorte exige
	 * `verify-email?token=` para não confundir com o link de redefinição de senha,
	 * que tem o mesmo formato de token.
	 */
	async function comEmailCapturado(acao) {
		const linhas = [];
		const spy = vi.spyOn(console, "log").mockImplementation((...args) => {
			linhas.push(args.join(" "));
		});

		try {
			const response = await acao();
			return {
				response,
				token: linhas.join("\n").match(/verify-email\?token=([a-f0-9]{64})/)?.[1] ?? null,
			};
		} finally {
			spy.mockRestore();
		}
	}

	/** Cadastra um usuário e devolve sessão + token de verificação do e-mail. */
	async function cadastrar(email) {
		const { response, token } = await comEmailCapturado(() =>
			request(app)
				.post("/auth/register")
				.send({ name: "Teste", email, password: "senha1234" })
				.expect(201)
		);

		return {
			token,
			sessao: response.body.token,
			user: response.body.user,
			auth: (req) => req.set("Authorization", `Bearer ${response.body.token}`),
		};
	}

	const verificar = (token) => request(app).post("/auth/verify-email").send({ token });

	it("o cadastro grava só o hash do token e manda o link por e-mail", async () => {
		const { token, user } = await cadastrar("verifica@exemplo.com");

		expect(token).toMatch(/^[a-f0-9]{64}$/);

		// A conta nasce não verificada, e a resposta do cadastro já diz isso.
		expect(user.emailVerified).toBe(false);
		expect(user.emailVerifiedAt).toBeNull();

		const gravado = await User.findOne({ email: "verifica@exemplo.com" }).select(
			VERIFICACAO_FIELDS
		);

		// Se o banco vazar, o que está lá não serve como token.
		expect(gravado.emailVerificationTokenHash).not.toBe(token);
		expect(gravado.emailVerificationTokenHash).toBe(User.hashEmailVerificationToken(token));
		expect(gravado.emailVerifiedAt).toBeNull();

		// Validade de 24 horas, medida contra agora — nunca uma data fixa.
		const restante = gravado.emailVerificationExpiresAt.getTime() - Date.now();
		expect(restante).toBeLessThanOrEqual(24 * 60 * 60 * 1000);
		expect(restante).toBeGreaterThan(23 * 60 * 60 * 1000);
	});

	it("verificar com o token marca a conta e consome o link", async () => {
		const { token, auth } = await cadastrar("fluxo-verifica@exemplo.com");

		const antes = await auth(request(app).get("/auth/me")).expect(200);
		expect(antes.body.emailVerified).toBe(false);
		expect(antes.body.emailVerifiedAt).toBeNull();

		const resposta = await verificar(token).expect(200);
		expect(resposta.body.user.emailVerified).toBe(true);

		// Não faz login automático: nenhum token de sessão na resposta.
		expect(resposta.body.token).toBeUndefined();

		const depois = await auth(request(app).get("/auth/me")).expect(200);
		expect(depois.body.emailVerified).toBe(true);
		expect(Date.parse(depois.body.emailVerifiedAt)).toBeLessThanOrEqual(Date.now());

		// O token foi consumido: os dois campos saíram do documento.
		const gravado = await User.findOne({ email: "fluxo-verifica@exemplo.com" }).select(
			VERIFICACAO_FIELDS
		);
		expect(gravado.emailVerificationTokenHash).toBeUndefined();
		expect(gravado.emailVerificationExpiresAt).toBeUndefined();
	});

	it("token adulterado, expirado e já usado falham com a mesma mensagem", async () => {
		const adulterado = await cadastrar("adulterado-verifica@exemplo.com");
		const expirado = await cadastrar("expirado-verifica@exemplo.com");
		const usado = await cadastrar("usado-verifica@exemplo.com");

		// Último caractere trocado, formato preservado: o que recusa é a
		// comparação do hash, não o formato.
		const tokenAdulterado =
			adulterado.token.slice(0, -1) + (adulterado.token.endsWith("a") ? "b" : "a");
		expect(tokenAdulterado).not.toBe(adulterado.token);

		// Expira no banco, relativo a agora — nunca uma data fixa, que
		// envelheceria junto com o teste.
		await User.updateOne(
			{ email: "expirado-verifica@exemplo.com" },
			{ $set: { emailVerificationExpiresAt: new Date(Date.now() - 1_000) } }
		);

		// Já usado: a primeira verificação consome o token.
		await verificar(usado.token).expect(200);

		const respostas = [
			await verificar(tokenAdulterado).expect(400),
			await verificar(expirado.token).expect(400),
			// Segunda verificação com o mesmo token: 400, e não 200 idempotente.
			// Depois de consumido o token saiu do banco, então este caso é
			// indistinguível de um token que nunca existiu.
			await verificar(usado.token).expect(400),
		];

		const mensagens = new Set(respostas.map((r) => r.body.message));
		expect(mensagens.size).toBe(1);

		// Verificar duas vezes não desfaz nada: a conta segue verificada.
		const conta = await User.findOne({ email: "usado-verifica@exemplo.com" });
		expect(conta.emailVerifiedAt).toBeInstanceOf(Date);

		// E as duas contas que falharam continuam não verificadas.
		for (const email of ["adulterado-verifica@exemplo.com", "expirado-verifica@exemplo.com"]) {
			const naoVerificada = await User.findOne({ email });
			expect(naoVerificada.emailVerifiedAt).toBeNull();
		}
	});

	it("reenvio exige autenticação", async () => {
		await request(app).post("/auth/resend-verification").expect(401);
		await request(app)
			.post("/auth/resend-verification")
			.set("Authorization", "Bearer token.invalido.aqui")
			.expect(401);
	});

	it("reenvio manda um link novo e invalida o anterior", async () => {
		const { token: primeiro, auth } = await cadastrar("reenvio@exemplo.com");

		const { token: segundo } = await comEmailCapturado(() =>
			auth(request(app).post("/auth/resend-verification")).expect(200)
		);

		expect(segundo).toMatch(/^[a-f0-9]{64}$/);
		expect(segundo).not.toBe(primeiro);

		// Só o último link vale: o primeiro foi sobrescrito.
		await verificar(primeiro).expect(400);
		await verificar(segundo).expect(200);
	});

	it("conta já verificada não dispara novo e-mail", async () => {
		const { token, auth } = await cadastrar("ja-verificado@exemplo.com");
		await verificar(token).expect(200);

		const { response, token: novoToken } = await comEmailCapturado(() =>
			auth(request(app).post("/auth/resend-verification")).expect(200)
		);

		// Nenhum link no console: nada foi enviado.
		expect(novoToken).toBeNull();
		expect(response.body.emailVerified).toBe(true);

		// E nenhum token novo foi gravado.
		const gravado = await User.findOne({ email: "ja-verificado@exemplo.com" }).select(
			VERIFICACAO_FIELDS
		);
		expect(gravado.emailVerificationTokenHash).toBeUndefined();
	});

	/**
	 * A verificação REGISTRA o estado; não bloqueia nada.
	 *
	 * Ligar o bloqueio é decisão de produto e quebraria quem já está cadastrado
	 * (nenhuma conta antiga tem `emailVerifiedAt`). Este teste é o que falha se
	 * alguém ligar o bloqueio sem querer.
	 */
	it("usuário não verificado continua usando o app normalmente", async () => {
		const { auth, sessao } = await cadastrar("sem-verificar@exemplo.com");

		const meu = await auth(request(app).get("/auth/me")).expect(200);
		expect(meu.body.emailVerified).toBe(false);

		const categorias = await auth(request(app).get("/categories")).expect(200);
		expect(categorias.body.length).toBeGreaterThan(0);

		await auth(request(app).post("/transactions"))
			.send({
				type: "debit",
				description: "Compra sem verificar o e-mail",
				totalValueInCents: 5000,
				date: new Date().toISOString().slice(0, 10),
				category: categorias.body[0]._id,
			})
			.expect(201);

		await auth(request(app).get("/transactions")).expect(200);
		await auth(request(app).get("/dashboard/monthly-balance")).expect(200);
		await auth(request(app).get("/goals")).expect(200);
		await auth(request(app).get("/bank-cards")).expect(200);
		await auth(request(app).get("/account/export")).expect(200);

		// Login também: a conta não verificada continua autenticando.
		const login = await request(app)
			.post("/auth/login")
			.send({ email: "sem-verificar@exemplo.com", password: "senha1234" })
			.expect(200);
		expect(login.body.user.emailVerified).toBe(false);
		expect(login.body.token).toBeTypeOf("string");
		expect(sessao).toBeTypeOf("string");
	});

	/**
	 * Conta criada antes deste campo existir não tem `emailVerifiedAt` no
	 * documento — e `default: null` só vale para documento novo. O teste simula
	 * isso com `$unset` e prova as duas coisas: ela é lida como não verificada, e
	 * não perde acesso a nada por isso.
	 */
	it("conta antiga, sem o campo no documento, aparece como não verificada e segue funcionando", async () => {
		const { auth } = await cadastrar("conta-antiga@exemplo.com");

		await User.updateOne(
			{ email: "conta-antiga@exemplo.com" },
			{ $unset: { emailVerifiedAt: "" } }
		);

		const semCampo = await User.findOne({ email: "conta-antiga@exemplo.com" }).lean();
		expect(semCampo.emailVerifiedAt).toBeUndefined();

		const meu = await auth(request(app).get("/auth/me")).expect(200);
		expect(meu.body.emailVerified).toBe(false);
		expect(meu.body.emailVerifiedAt).toBeNull();

		await auth(request(app).get("/transactions")).expect(200);
	});
});

describe("proteção das rotas", () => {
	const rotasProtegidas = [
		["get", "/transactions"],
		["post", "/transactions"],
		["get", "/categories"],
		["get", "/goals"],
		["get", "/bank-cards"],
		["get", "/dashboard/monthly-balance"],
	];

	it.each(rotasProtegidas)("%s %s exige token", async (method, path) => {
		await request(app)[method](path).expect(401);
	});

	it("rejeita token inválido", async () => {
		await request(app)
			.get("/transactions")
			.set("Authorization", "Bearer token.invalido.aqui")
			.expect(401);
	});

	it("/health continua público", async () => {
		await request(app).get("/health").expect(200);
	});
});

describe("isolamento entre usuários", () => {
	it("um usuário nunca enxerga os dados do outro", async () => {
		const ana = await createUser({ email: "ana@exemplo.com" });
		const bob = await createUser({ email: "bob@exemplo.com" });

		const categorias = await ana.auth(request(app).get("/categories")).expect(200);

		await ana
			.auth(request(app).post("/transactions"))
			.send({
				type: "debit",
				description: "Compra da Ana",
				totalValueInCents: 5000,
				date: "2026-03-10",
				category: categorias.body[0]._id,
			})
			.expect(201);

		// Bob não vê a transação da Ana...
		const listaDoBob = await bob.auth(request(app).get("/transactions")).expect(200);
		expect(listaDoBob.body).toHaveLength(0);

		// ...e nem consegue usar a categoria dela.
		await bob
			.auth(request(app).post("/transactions"))
			.send({
				type: "debit",
				description: "Tentativa",
				totalValueInCents: 1000,
				date: "2026-03-10",
				category: categorias.body[0]._id,
			})
			.expect(400);
	});

	it("não permite editar nem apagar transação de outro usuário", async () => {
		const ana = await createUser({ email: "ana2@exemplo.com" });
		const bob = await createUser({ email: "bob2@exemplo.com" });

		const criada = await ana
			.auth(request(app).post("/transactions"))
			.send({
				type: "income",
				description: "Salário da Ana",
				totalValueInCents: 100_000,
				date: "2026-03-10",
			})
			.expect(201);

		await bob
			.auth(request(app).patch(`/transactions/${criada.body._id}`))
			.send({ description: "Sequestrada" })
			.expect(404);

		await bob.auth(request(app).delete(`/transactions/${criada.body._id}`)).expect(404);
	});
});

/**
 * Assinatura válida não é o mesmo que sessão válida.
 *
 * O middleware confirma que o usuário do token ainda existe. Sem isso, um token
 * assinado para um id qualquer — ou para uma conta já excluída — passava, e as
 * rotas de escrita criavam documento com dono inexistente.
 */
describe("o token precisa corresponder a um usuário que existe", () => {
	/**
	 * Assina um token legítimo para um id arbitrário, com o segredo do app.
	 *
	 * É o cenário que a verificação de assinatura, sozinha, não distingue de uma
	 * sessão real: aqui a assinatura confere e o usuário é que não existe.
	 */
	const assinarPara = (userId) =>
		jwt.sign({ sub: String(userId) }, process.env.JWT_SECRET, { expiresIn: "7d" });

	it("recusa token assinado para um id que nunca existiu", async () => {
		const inexistente = new mongoose.Types.ObjectId();
		expect(await User.countDocuments({ _id: inexistente })).toBe(0);

		const comIdFantasma = await request(app)
			.get("/transactions")
			.set("Authorization", `Bearer ${assinarPara(inexistente)}`)
			.expect(401);

		const assinaturaQuebrada = await request(app)
			.get("/transactions")
			.set("Authorization", "Bearer token.invalido.aqui")
			.expect(401);

		// Mesma mensagem nos dois casos: dizer "usuário não encontrado" avisaria
		// ao portador do token se aquela conta existiu algum dia.
		expect(comIdFantasma.body.message).toBe(assinaturaQuebrada.body.message);
	});

	it("recusa escrita com id fantasma, sem deixar documento órfão", async () => {
		const Transaction = mongoose.model("Transaction");
		const token = assinarPara(new mongoose.Types.ObjectId());

		await request(app)
			.post("/transactions")
			.set("Authorization", `Bearer ${token}`)
			.send({
				type: "income",
				description: "Órfã de id fantasma",
				totalValueInCents: 1000,
				date: new Date().toISOString().slice(0, 10),
			})
			.expect(401);

		// Contado na coleção inteira: um documento criado aqui teria um `user`
		// que nenhuma consulta de tela alcança.
		expect(await Transaction.countDocuments({})).toBe(0);
	});

	it("token válido de usuário existente continua passando", async () => {
		const usuario = await createUser({ email: "existe-mesmo@exemplo.com" });

		await usuario.auth(request(app).get("/auth/me")).expect(200);
		await usuario.auth(request(app).get("/transactions")).expect(200);

		// Escrita também: a verificação nova não pode ter custado o caminho feliz.
		await usuario
			.auth(request(app).post("/transactions"))
			.send({
				type: "income",
				description: "Salário",
				totalValueInCents: 100_000,
				date: new Date().toISOString().slice(0, 10),
			})
			.expect(201);

		// E um token assinado fora do login vale igual: o middleware cobra a
		// existência do usuário, não a origem do token.
		await request(app)
			.get("/transactions")
			.set("Authorization", `Bearer ${assinarPara(usuario.user.id)}`)
			.expect(200);
	});

	it("recusa token cujo sub não tem formato de id, sem virar erro de servidor", async () => {
		await createUser({ email: "tem-conta@exemplo.com" });

		/**
		 * `sub` ausente é o caso perigoso: o Mongoose descarta chave `undefined`,
		 * então `findById(undefined)` vira `find({})` e casaria com o primeiro
		 * usuário da coleção. Por isso existe um usuário cadastrado aqui — sem
		 * ele, o teste passaria por a coleção estar vazia.
		 */
		for (const payload of [{}, { sub: "" }, { sub: "nao-e-objectid" }, { sub: 42 }]) {
			const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "7d" });

			const resposta = await request(app)
				.get("/transactions")
				.set("Authorization", `Bearer ${token}`)
				.expect(401);

			expect(resposta.body.message).toBe("Token inválido");
		}
	});
});
