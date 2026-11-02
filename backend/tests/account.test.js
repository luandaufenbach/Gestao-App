import { describe, it, expect, beforeEach } from "vitest";
import mongoose from "mongoose";
import { app, request, createUser, firstCategoryId, createCreditCard } from "./helpers.js";

/**
 * Direitos do titular pela LGPD: exportar e excluir a conta.
 *
 * O que estes testes protegem, em uma frase cada:
 *   - a exportação entrega TUDO do titular e NADA de segredo (hash, token);
 *   - a exportação não enxerga a conta do vizinho;
 *   - a exclusão não deixa documento órfão em nenhuma coleção;
 *   - senha errada não apaga nada, e nenhuma das duas rotas abre sem token.
 *
 * Os modelos vêm do registro do Mongoose, não de um import direto: o app já os
 * carregou por `require`, e avaliar o arquivo de novo faria o Mongoose recusar
 * com "Cannot overwrite model once compiled" (mesma razão de auth.test.js).
 */
const Transaction = mongoose.model("Transaction");
const Category = mongoose.model("Category");
const Goal = mongoose.model("Goal");
const BankCard = mongoose.model("BankCard");
const User = mongoose.model("User");

const SENHA = "senha1234";

/**
 * Data no formato do input HTML, deslocada em dias a partir de hoje.
 *
 * Nenhuma data fixa nestes testes: uma data cravada em 2026 passa hoje e quebra
 * sozinha depois, sem ninguém ter mexido no código (ver CLAUDE.md).
 */
const diaRelativo = (deslocamentoEmDias) => {
	const data = new Date();
	data.setUTCDate(data.getUTCDate() + deslocamentoEmDias);
	return data.toISOString().slice(0, 10);
};

const lancar = (usuario, corpo) => usuario.auth(request(app).post("/transactions")).send(corpo);

/** Conta com as quatro coleções preenchidas, para as asserções terem o que achar. */
async function semearConta(usuario, marca) {
	const categoria = await firstCategoryId(usuario.token);
	const cartao = await createCreditCard(usuario.token, { lastFourDigits: marca.digitos });

	const meta = await usuario
		.auth(request(app).post("/goals"))
		.send({ name: marca.meta, targetAmountInCents: 500_000 })
		.expect(201);

	await lancar(usuario, {
		type: "debit",
		description: marca.despesa,
		totalValueInCents: 12_345,
		date: diaRelativo(-3),
		category: categoria,
	}).expect(201);

	// Em 3x: nasce como 3 transações. Serve para a contagem não ser trivial.
	await lancar(usuario, {
		type: "credit",
		description: marca.compra,
		totalValueInCents: 30_000,
		date: diaRelativo(-10),
		category: categoria,
		bankCard: cartao._id,
		installments: 3,
	}).expect(201);

	await lancar(usuario, {
		type: "savings",
		description: marca.reserva,
		totalValueInCents: 20_000,
		date: diaRelativo(-1),
		goal: meta.body._id,
	}).expect(201);

	return { categoria, cartao, meta: meta.body };
}

const MARCA_A = {
	digitos: "4321",
	meta: "Viagem do titular",
	despesa: "Mercado do titular",
	compra: "Compra do titular",
	reserva: "Reserva do titular",
};

const MARCA_B = {
	digitos: "9876",
	meta: "Meta do vizinho",
	despesa: "Mercado do vizinho",
	compra: "Compra do vizinho",
	reserva: "Reserva do vizinho",
};

const exportar = (usuario) => usuario.auth(request(app).get("/account/export"));

const excluir = (usuario, senha) =>
	usuario.auth(request(app).delete("/account")).send({ password: senha });

/** Quantos documentos cada coleção ainda tem para este usuário. */
async function contarPorUsuario(userId) {
	const [transactions, categories, goals, bankCards, users] = await Promise.all([
		Transaction.countDocuments({ user: userId }),
		Category.countDocuments({ user: userId }),
		Goal.countDocuments({ user: userId }),
		BankCard.countDocuments({ user: userId }),
		User.countDocuments({ _id: userId }),
	]);

	return { transactions, categories, goals, bankCards, users };
}

let titular;

beforeEach(async () => {
	titular = await createUser({ password: SENHA });
});

describe("GET /account/export", () => {
	it("traz as cinco coleções do titular", async () => {
		const semeado = await semearConta(titular, MARCA_A);

		const resposta = await exportar(titular).expect(200);

		expect(resposta.body.account).toMatchObject({
			name: titular.user.name,
			email: titular.user.email,
		});
		expect(resposta.body.account.createdAt).toBeDefined();

		// 1 débito + 3 parcelas + 1 guardado
		expect(resposta.body.transactions).toHaveLength(5);
		expect(resposta.body.categories.length).toBeGreaterThan(0);
		expect(resposta.body.goals).toHaveLength(1);
		expect(resposta.body.bankCards).toHaveLength(1);

		expect(resposta.body.goals[0].name).toBe(MARCA_A.meta);
		expect(resposta.body.bankCards[0]._id).toBe(semeado.cartao._id);
	});

	it("não traz passwordHash nem token de recuperação", async () => {
		// Pede a recuperação primeiro: assim os campos de token EXISTEM no banco
		// no momento da exportação. Sem este passo o teste passaria por ausência
		// de dado, não por filtro.
		await request(app)
			.post("/auth/forgot-password")
			.send({ email: titular.user.email })
			.expect(200);

		const comToken = await User.findById(titular.user.id).select(
			"+passwordHash +passwordResetTokenHash +passwordResetExpiresAt"
		);
		expect(comToken.passwordResetTokenHash).toBeTypeOf("string");

		const resposta = await exportar(titular).expect(200);
		const texto = JSON.stringify(resposta.body);

		for (const campo of [
			"passwordHash",
			"passwordResetTokenHash",
			"passwordResetExpiresAt",
		]) {
			expect(texto).not.toContain(campo);
		}

		// O valor, e não só o nome do campo: o hash real do bcrypt e o do token.
		expect(texto).not.toContain(comToken.passwordHash);
		expect(texto).not.toContain(comToken.passwordResetTokenHash);
		expect(texto).not.toContain("$2b$");
	});

	it("declara data de geração, versão do formato e a unidade monetária", async () => {
		const antes = Date.now();
		await semearConta(titular, MARCA_A);

		const resposta = await exportar(titular).expect(200);
		const { meta } = resposta.body;

		expect(meta.formatVersion).toBe(1);

		const gerado = new Date(meta.generatedAt).getTime();
		expect(gerado).toBeGreaterThanOrEqual(antes);
		expect(gerado).toBeLessThanOrEqual(Date.now());

		// Sem a unidade declarada dentro do arquivo, 12345 é ambíguo fora do app.
		expect(meta.monetaryUnit).toBe("BRL_CENTS");
		expect(meta.monetaryUnitNote).toContain("centavos");
	});

	it("mantém os valores em centavos, sem converter", async () => {
		await semearConta(titular, MARCA_A);

		const resposta = await exportar(titular).expect(200);

		const despesa = resposta.body.transactions.find(
			(transacao) => transacao.description === MARCA_A.despesa
		);
		expect(despesa.valueInCents).toBe(12_345);
		expect(despesa.installment.totalValueInCents).toBe(12_345);

		expect(resposta.body.goals[0].targetAmountInCents).toBe(500_000);
	});

	it("a contagem no cabeçalho bate com as coleções, o que detecta download truncado", async () => {
		await semearConta(titular, MARCA_A);

		const resposta = await exportar(titular).expect(200);
		const { meta } = resposta.body;

		expect(meta.counts.transactions).toBe(resposta.body.transactions.length);
		expect(meta.counts.categories).toBe(resposta.body.categories.length);
		expect(meta.counts.goals).toBe(resposta.body.goals.length);
		expect(meta.counts.bankCards).toBe(resposta.body.bankCards.length);
	});

	it("exporta todo o histórico, sem teto que corte transação", async () => {
		const categoria = await firstCategoryId(titular.token);

		// Mais do que qualquer página da listagem normal usaria.
		const total = 60;
		for (let indice = 0; indice < total; indice += 1) {
			await lancar(titular, {
				type: "debit",
				description: `Despesa ${indice}`,
				totalValueInCents: 100 + indice,
				date: diaRelativo(-indice),
				category: categoria,
			}).expect(201);
		}

		const resposta = await exportar(titular).expect(200);

		expect(resposta.body.transactions).toHaveLength(total);
		expect(resposta.body.meta.counts.transactions).toBe(total);
	});

	it("do cartão exporta só os 4 últimos dígitos", async () => {
		await semearConta(titular, MARCA_A);

		const resposta = await exportar(titular).expect(200);
		const cartao = resposta.body.bankCards[0];

		expect(cartao.lastFourDigits).toBe(MARCA_A.digitos);

		// Nenhum campo com número completo — ele não existe no banco e não deve
		// passar a existir por causa da exportação.
		for (const campo of ["number", "cardNumber", "pan", "cvv", "holderName"]) {
			expect(cartao[campo]).toBeUndefined();
		}
	});

	it("vem como anexo, para o navegador salvar o arquivo", async () => {
		const resposta = await exportar(titular).expect(200);

		expect(resposta.headers["content-disposition"]).toContain("attachment");
		expect(resposta.headers["content-disposition"]).toContain(".json");
		// Dado pessoal não fica em cache de navegador nem de proxy.
		expect(resposta.headers["cache-control"]).toContain("no-store");
	});

	it("a exportação de um usuário não contém dado de outro", async () => {
		await semearConta(titular, MARCA_A);

		const vizinho = await createUser({ password: SENHA });
		await semearConta(vizinho, MARCA_B);

		const resposta = await exportar(titular).expect(200);
		const texto = JSON.stringify(resposta.body);

		for (const valor of [
			MARCA_B.meta,
			MARCA_B.despesa,
			MARCA_B.compra,
			MARCA_B.reserva,
			MARCA_B.digitos,
			vizinho.user.email,
			vizinho.user.id,
		]) {
			expect(texto).not.toContain(valor);
		}

		// E o contrário também: a exportação do vizinho não traz nada do titular.
		const doVizinho = await exportar(vizinho).expect(200);
		expect(JSON.stringify(doVizinho.body)).not.toContain(MARCA_A.despesa);
		expect(doVizinho.body.account.email).toBe(vizinho.user.email);
	});
});

describe("DELETE /account", () => {
	it("com a senha correta apaga usuário, transações, categorias, metas e cartões", async () => {
		await semearConta(titular, MARCA_A);

		const antes = await contarPorUsuario(titular.user.id);
		expect(antes.transactions).toBe(5);
		expect(antes.categories).toBeGreaterThan(0);
		expect(antes.goals).toBe(1);
		expect(antes.bankCards).toBe(1);
		expect(antes.users).toBe(1);

		const resposta = await excluir(titular, SENHA).expect(200);

		// O recibo da eliminação, conferido contra o que existia antes.
		expect(resposta.body.deleted).toEqual({
			account: 1,
			transactions: antes.transactions,
			categories: antes.categories,
			goals: antes.goals,
			bankCards: antes.bankCards,
		});

		// Contando direto nas coleções: documento órfão aqui é vazamento silencioso.
		expect(await contarPorUsuario(titular.user.id)).toEqual({
			transactions: 0,
			categories: 0,
			goals: 0,
			bankCards: 0,
			users: 0,
		});
	});

	it("avisa o frontend para encerrar a sessão", async () => {
		const resposta = await excluir(titular, SENHA).expect(200);

		expect(resposta.body.sessionEnded).toBe(true);
		expect(resposta.body.message).toBeTypeOf("string");

		// A conta sumiu de verdade: o mesmo token não serve mais para /auth/me.
		await titular.auth(request(app).get("/auth/me")).expect(401);
	});

	it("com a senha errada responde 401 e não apaga nada", async () => {
		await semearConta(titular, MARCA_A);
		const antes = await contarPorUsuario(titular.user.id);

		await excluir(titular, "senha-errada-9999").expect(401);

		expect(await contarPorUsuario(titular.user.id)).toEqual(antes);

		// E a conta continua funcionando normalmente.
		await titular.auth(request(app).get("/auth/me")).expect(200);
	});

	it("sem senha no corpo responde 400 e não apaga nada", async () => {
		await semearConta(titular, MARCA_A);
		const antes = await contarPorUsuario(titular.user.id);

		await titular.auth(request(app).delete("/account")).send({}).expect(400);

		expect(await contarPorUsuario(titular.user.id)).toEqual(antes);
	});

	it("não toca nos dados de outro usuário", async () => {
		await semearConta(titular, MARCA_A);

		const vizinho = await createUser({ password: SENHA });
		await semearConta(vizinho, MARCA_B);
		const antesDoVizinho = await contarPorUsuario(vizinho.user.id);

		await excluir(titular, SENHA).expect(200);

		expect(await contarPorUsuario(vizinho.user.id)).toEqual(antesDoVizinho);

		// O vizinho continua lendo os próprios dados por inteiro.
		const resposta = await exportar(vizinho).expect(200);
		expect(resposta.body.transactions).toHaveLength(5);
		expect(resposta.body.goals[0].name).toBe(MARCA_B.meta);
	});

	it("a senha de outro usuário não serve para apagar esta conta", async () => {
		const vizinho = await createUser({ password: "outraSenha4321" });
		await semearConta(titular, MARCA_A);
		const antes = await contarPorUsuario(titular.user.id);

		await excluir(titular, "outraSenha4321").expect(401);

		expect(await contarPorUsuario(titular.user.id)).toEqual(antes);
		expect(await contarPorUsuario(vizinho.user.id)).toMatchObject({ users: 1 });
	});
});

/**
 * O que acontece com o token DEPOIS da exclusão.
 *
 * O JWT vale 7 dias e nada o revoga, então o token de uma conta excluída
 * continua com assinatura válida. Enquanto o middleware olhava só a assinatura,
 * esse token seguia autenticando e as rotas de escrita criavam documento com
 * `user` apontando para um usuário que não existe mais — órfão que nenhuma tela
 * mostra e que nenhuma exclusão posterior alcança, porque a conta que o apagaria
 * já foi embora.
 */
describe("o token de uma conta excluída não vale mais nada", () => {
	it("POST /transactions responde 401 e não cria documento nenhum", async () => {
		await semearConta(titular, MARCA_A);

		// Capturados antes: depois da exclusão não há de onde ler.
		const categoria = await firstCategoryId(titular.token);
		const userId = titular.user.id;

		await excluir(titular, SENHA).expect(200);
		expect(await contarPorUsuario(userId)).toMatchObject({ transactions: 0, users: 0 });

		await lancar(titular, {
			type: "debit",
			description: "Lançamento órfão",
			totalValueInCents: 1_000,
			date: diaRelativo(0),
			category: categoria,
		}).expect(401);

		/**
		 * Contado na coleção inteira, sem filtro de usuário.
		 *
		 * Um órfão nasce com `user` de uma conta que não existe mais, então
		 * contar por usuário é frágil se amanhã o id vier de outro lugar.
		 * Coleção vazia é a prova que não depende disso.
		 */
		expect(await Transaction.countDocuments({})).toBe(0);
		expect(await Transaction.countDocuments({ description: "Lançamento órfão" })).toBe(0);

		// E o mesmo para as outras coleções de escrita.
		await titular
			.auth(request(app).post("/goals"))
			.send({ name: "Meta órfã", targetAmountInCents: 1_000 })
			.expect(401);
		await titular
			.auth(request(app).post("/categories"))
			.send({ name: "Categoria órfã", color: "#22c55e", icon: "tag" })
			.expect(401);

		expect(await Goal.countDocuments({})).toBe(0);
		expect(await Category.countDocuments({})).toBe(0);
		expect(await BankCard.countDocuments({})).toBe(0);
	});

	it("GET /auth/me responde 401 sem contar que a conta foi apagada", async () => {
		await excluir(titular, SENHA).expect(200);

		const depoisDaExclusao = await titular.auth(request(app).get("/auth/me")).expect(401);

		const tokenFalso = await request(app)
			.get("/auth/me")
			.set("Authorization", "Bearer token-falso")
			.expect(401);

		/**
		 * O middleware barra antes do controller e usa a mensagem genérica. Uma
		 * mensagem própria para conta excluída confirmaria a quem roubou o token
		 * que aquela conta existiu — informação que ele não tinha.
		 */
		expect(depoisDaExclusao.body.message).toBe(tokenFalso.body.message);
		expect(depoisDaExclusao.body.message).not.toMatch(/usu[áa]rio|conta|exclu/i);
	});

	it("nenhuma rota protegida aceita o token depois da exclusão", async () => {
		await semearConta(titular, MARCA_A);
		await excluir(titular, SENHA).expect(200);

		const rotas = [
			"/transactions",
			"/categories",
			"/goals",
			"/bank-cards",
			"/dashboard/monthly-balance",
			"/account/export",
		];

		for (const rota of rotas) {
			await titular.auth(request(app).get(rota)).expect(401);
		}

		// Nem a própria exclusão, que de novo responderia 200 com recibo vazio.
		await excluir(titular, SENHA).expect(401);
	});
});

describe("as duas rotas exigem autenticação", () => {
	it("GET /account/export sem token responde 401", async () => {
		await request(app).get("/account/export").expect(401);
	});

	it("DELETE /account sem token responde 401", async () => {
		await request(app).delete("/account").send({ password: SENHA }).expect(401);
	});

	it("token inválido não exporta nem apaga", async () => {
		await semearConta(titular, MARCA_A);
		const antes = await contarPorUsuario(titular.user.id);

		await request(app)
			.get("/account/export")
			.set("Authorization", "Bearer token-falso")
			.expect(401);

		await request(app)
			.delete("/account")
			.set("Authorization", "Bearer token-falso")
			.send({ password: SENHA })
			.expect(401);

		expect(await contarPorUsuario(titular.user.id)).toEqual(antes);
	});
});
