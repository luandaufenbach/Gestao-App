import { describe, it, expect, beforeEach } from "vitest";
import { app, request, createUser, createCreditCard, firstCategoryId } from "./helpers.js";

/**
 * Projeção de caixa futura (ROADMAP 1.1).
 *
 * O cartão de referência é o do usuário: fecha dia 01, vence dia 05. Logo, uma
 * compra no meio de um mês entra na fatura que VENCE no mês seguinte — e é no
 * mês do vencimento que ela compromete o caixa.
 *
 * Nenhuma data fixa aqui: tudo é ancorado em hoje. A projeção sempre começa no
 * mês corrente, então um "2026-03" escrito à mão envelheceria e o teste
 * quebraria sozinho com o tempo.
 */

const hoje = new Date();

/** Chave "AAAA-MM" do mês a `offset` meses de hoje. */
const mes = (offset) => {
	const data = new Date(Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth() + offset, 1));
	return `${data.getUTCFullYear()}-${String(data.getUTCMonth() + 1).padStart(2, "0")}`;
};

/** "AAAA-MM-DD" do dia `numero` do mês a `offset` meses de hoje. */
const dia = (offset, numero) =>
	new Date(Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth() + offset, numero))
		.toISOString()
		.slice(0, 10);

let user;
let categoryId;
let cardId;
let cardName;

beforeEach(async () => {
	user = await createUser();
	categoryId = await firstCategoryId(user.token);

	const card = await createCreditCard(user.token, { name: "Nubank", lastFourDigits: "1234" });
	cardId = card._id;
	cardName = card.name;
});

const comprar = (valor, data, extra = {}) =>
	user
		.auth(request(app).post("/transactions"))
		.send({
			type: "credit",
			description: "Compra",
			totalValueInCents: valor,
			date: data,
			category: categoryId,
			bankCard: cardId,
			...extra,
		})
		.expect(201);

const debitar = (valor, data) =>
	user
		.auth(request(app).post("/transactions"))
		.send({
			type: "debit",
			description: "Aluguel",
			totalValueInCents: valor,
			date: data,
			category: categoryId,
		})
		.expect(201);

const pagar = (valor, data, ciclo) =>
	user
		.auth(request(app).post("/transactions"))
		.send({
			type: "invoice_payment",
			description: "Pagamento da fatura",
			totalValueInCents: valor,
			date: data,
			bankCard: cardId,
			invoiceCycle: ciclo,
		})
		.expect(201);

const projetar = (query = "") =>
	user.auth(request(app).get(`/dashboard/projection${query}`)).expect(200);

/** Mês da série pela chave, para não depender da posição. */
const mesDe = (body, offset) => body.find((item) => item.month === mes(offset));

describe("GET /dashboard/projection", () => {
	it("devolve a série completa do mês corrente para frente, zerada quando não há nada", async () => {
		const { body } = await projetar();

		expect(body).toHaveLength(6);
		expect(body.map((item) => item.month)).toEqual([0, 1, 2, 3, 4, 5].map(mes));

		for (const item of body) {
			expect(item.committedInCents).toBe(0);
			expect(item.invoicesInCents).toBe(0);
			expect(item.debitsInCents).toBe(0);
			expect(item.installmentCount).toBe(0);
			expect(item.cards).toEqual([]);
		}
	});

	it("respeita o tamanho da janela pedido", async () => {
		const curta = await projetar("?months=1");
		const longa = await projetar("?months=12");

		expect(curta.body).toHaveLength(1);
		expect(curta.body[0].month).toBe(mes(0));

		expect(longa.body).toHaveLength(12);
		expect(longa.body[11].month).toBe(mes(11));
	});

	/**
	 * O ponto do item 1.1: uma compra em 5x já existe no banco como cinco
	 * transações datadas, uma por mês. A projeção só precisa colocar cada uma no
	 * mês em que a fatura dela vence.
	 */
	it("distribui a compra em 5x, uma parcela por mês", async () => {
		await comprar(50_000, dia(0, 15), { installments: 5, description: "Geladeira" });

		const { body } = await projetar();

		// Comprou no meio do mês 0: a primeira parcela só vence no mês 1.
		expect(mesDe(body, 0).committedInCents).toBe(0);

		for (const offset of [1, 2, 3, 4, 5]) {
			const item = mesDe(body, offset);

			expect(item.committedInCents).toBe(10_000);
			expect(item.invoicesInCents).toBe(10_000);
			expect(item.installmentCount).toBe(1);
			expect(item.cards).toHaveLength(1);
			expect(item.cards[0]).toMatchObject({
				name: cardName,
				cycle: mes(offset),
				committedInCents: 10_000,
				installmentCount: 1,
			});
		}

		const total = body.reduce((soma, item) => soma + item.committedInCents, 0);
		expect(total).toBe(50_000);
	});

	/**
	 * REGRESSÃO: a fatura é nomeada pelo mês do VENCIMENTO, não pelo da compra.
	 * Num cartão que fecha dia 01 e vence dia 05, a compra do mês corrente vence
	 * no dia 05 do mês seguinte — e é lá que ela compromete o caixa.
	 */
	it("compromete o mês do vencimento da fatura, não o mês da compra", async () => {
		await comprar(30_000, dia(0, 15));

		const { body } = await projetar();

		expect(mesDe(body, 0).committedInCents).toBe(0);
		expect(mesDe(body, 0).cards).toEqual([]);

		const vencimento = mesDe(body, 1);
		expect(vencimento.committedInCents).toBe(30_000);
		expect(vencimento.cards[0].cycle).toBe(mes(1));
		expect(vencimento.cards[0].dueDate.slice(0, 10)).toBe(dia(1, 5));

		// Compra à vista não é parcela: a contagem conta parcelamento, não compras.
		expect(vencimento.installmentCount).toBe(0);
	});

	/**
	 * A fronteira da série: a compra do mês passado vence no mês corrente, então
	 * ela é o primeiro compromisso da projeção — não sobra para trás da janela.
	 */
	it("a compra do mês passado compromete o mês corrente", async () => {
		await comprar(45_000, dia(-1, 15));

		const { body } = await projetar();

		expect(mesDe(body, 0).committedInCents).toBe(45_000);
		expect(mesDe(body, 0).cards[0].dueDate.slice(0, 10)).toBe(dia(0, 5));
		expect(mesDe(body, 1).committedInCents).toBe(0);
	});

	/**
	 * Cartão cujo vencimento cai no mês SEGUINTE ao fechamento (fecha 28, vence
	 * 05) — o outro ramo de `dueDateForClosing`. A compra do dia 20 fecha no dia
	 * 28 do mesmo mês e só vence no dia 05 do mês seguinte.
	 */
	it("respeita o ciclo de um cartão que vence depois de virar o mês", async () => {
		const cartao = await createCreditCard(user.token, {
			name: "Itaú",
			lastFourDigits: "5555",
			closingDay: 28,
			dueDay: 5,
		});

		await comprar(60_000, dia(0, 20), { bankCard: cartao._id });

		const { body } = await projetar();

		expect(mesDe(body, 0).committedInCents).toBe(0);

		const vencimento = mesDe(body, 1);
		expect(vencimento.committedInCents).toBe(60_000);
		expect(vencimento.cards[0]).toMatchObject({ name: "Itaú", cycle: mes(1) });
		expect(vencimento.cards[0].dueDate.slice(0, 10)).toBe(dia(1, 5));
	});

	it("projeta apenas o que falta pagar de uma fatura parcialmente paga", async () => {
		await comprar(30_000, dia(0, 15));
		await pagar(10_000, dia(1, 5), mes(1));

		const { body } = await projetar();
		const item = mesDe(body, 1);

		expect(item.committedInCents).toBe(20_000);
		expect(item.cards[0]).toMatchObject({
			totalInCents: 30_000,
			paidInCents: 10_000,
			committedInCents: 20_000,
		});
	});

	it("fatura quitada não compromete mais nada, mas continua na abertura", async () => {
		await comprar(30_000, dia(0, 15));
		await pagar(30_000, dia(1, 5), mes(1));

		const { body } = await projetar();
		const item = mesDe(body, 1);

		expect(item.committedInCents).toBe(0);
		expect(item.cards[0]).toMatchObject({
			totalInCents: 30_000,
			paidInCents: 30_000,
			committedInCents: 0,
		});
	});

	it("o débito futuro entra no mês da própria data", async () => {
		await debitar(25_000, dia(2, 15));

		const { body } = await projetar();

		expect(mesDe(body, 2)).toMatchObject({
			debitsInCents: 25_000,
			invoicesInCents: 0,
			committedInCents: 25_000,
		});
		expect(mesDe(body, 1).committedInCents).toBe(0);
		expect(mesDe(body, 3).committedInCents).toBe(0);
	});

	/**
	 * A compra no crédito compromete UMA vez, no mês do vencimento da fatura.
	 * Contá-la também como lançamento do mês da compra somaria o mesmo gasto
	 * duas vezes — o mesmo erro que o saldo de caixa já evita.
	 */
	it("não conta a compra no crédito duas vezes", async () => {
		await comprar(40_000, dia(0, 15));

		const { body } = await projetar();

		const total = body.reduce((soma, item) => soma + item.committedInCents, 0);
		expect(total).toBe(40_000);

		// Nenhum centavo aparece pelo lado dos débitos.
		expect(body.every((item) => item.debitsInCents === 0)).toBe(true);
	});

	it("soma fatura e débito do mesmo mês num único comprometido", async () => {
		await comprar(30_000, dia(0, 15));
		await debitar(20_000, dia(1, 20));

		const item = mesDe((await projetar()).body, 1);

		expect(item.invoicesInCents).toBe(30_000);
		expect(item.debitsInCents).toBe(20_000);
		expect(item.committedInCents).toBe(50_000);
	});

	it("cartão sem ciclo configurado não quebra a rota nem entra na projeção", async () => {
		const semCiclo = await createCreditCard(user.token, {
			name: "Sem ciclo",
			lastFourDigits: "9999",
			closingDay: null,
			dueDay: null,
		});

		await user
			.auth(request(app).post("/transactions"))
			.send({
				type: "credit",
				description: "Compra no cartão sem ciclo",
				totalValueInCents: 70_000,
				date: dia(0, 15),
				category: categoryId,
				bankCard: semCiclo._id,
			})
			.expect(201);

		await comprar(30_000, dia(0, 15));

		const { body } = await projetar();

		// Sem fechamento e vencimento não há como saber em que mês a fatura cai,
		// então o cartão fica fora — e a projeção do que dá para saber continua.
		const total = body.reduce((soma, item) => soma + item.committedInCents, 0);
		expect(total).toBe(30_000);
		expect(mesDe(body, 1).cards).toHaveLength(1);
		expect(mesDe(body, 1).cards[0].name).toBe(cardName);
	});

	it("não mostra dados de outro usuário", async () => {
		const outro = await createUser();
		const outraCategoria = await firstCategoryId(outro.token);
		const outroCartao = await createCreditCard(outro.token);

		await outro
			.auth(request(app).post("/transactions"))
			.send({
				type: "credit",
				description: "Compra do outro",
				totalValueInCents: 99_000,
				date: dia(0, 15),
				category: outraCategoria,
				bankCard: outroCartao._id,
			})
			.expect(201);

		await outro
			.auth(request(app).post("/transactions"))
			.send({
				type: "debit",
				description: "Débito do outro",
				totalValueInCents: 88_000,
				date: dia(2, 10),
				category: outraCategoria,
			})
			.expect(201);

		const { body } = await projetar();

		expect(body.every((item) => item.committedInCents === 0)).toBe(true);
		expect(body.every((item) => item.cards.length === 0)).toBe(true);
	});

	it("exige autenticação", async () => {
		await request(app).get("/dashboard/projection").expect(401);
	});
});

describe("validação da janela da projeção", () => {
	it("recusa months fora do intervalo de 1 a 24", async () => {
		await user.auth(request(app).get("/dashboard/projection?months=0")).expect(400);
		await user.auth(request(app).get("/dashboard/projection?months=25")).expect(400);
		await user.auth(request(app).get("/dashboard/projection?months=abc")).expect(400);
		await user.auth(request(app).get("/dashboard/projection?months=2.5")).expect(400);
	});
});
