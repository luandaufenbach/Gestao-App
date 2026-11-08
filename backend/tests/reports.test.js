import { describe, it, expect, beforeEach } from "vitest";
import { app, request, createUser, createCreditCard, firstCategoryId } from "./helpers.js";

/**
 * Relatórios de 3 a 12 meses (ROADMAP 1.2).
 *
 * A janela TERMINA sempre no mês corrente, então nenhuma data aqui pode ser
 * fixa: um "2026-03" escrito à mão sai da janela com o passar do tempo e o
 * teste quebraria sozinho. Tudo é ancorado em hoje, em UTC — no fuso local o
 * dia 1º cairia no mês anterior e a série inteira ficaria deslocada.
 */

const hoje = new Date();

/** Chave "AAAA-MM" do mês a `offset` meses de hoje. */
const mes = (offset) => {
	const data = new Date(Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth() + offset, 1));
	return `${data.getUTCFullYear()}-${String(data.getUTCMonth() + 1).padStart(2, "0")}`;
};

/**
 * "AAAA-MM-DD" do dia `numero` do mês a `offset` meses de hoje.
 *
 * Os testes usam dias do meio do mês de propósito: dia 29 a 31 não existe em
 * todo mês, e a data escorregaria para o mês seguinte em fevereiro.
 */
const dia = (offset, numero) =>
	new Date(Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth() + offset, numero))
		.toISOString()
		.slice(0, 10);

let user;
let categoryId;
let outraCategoriaId;
let cardId;

beforeEach(async () => {
	user = await createUser();

	const categorias = await user.auth(request(app).get("/categories")).expect(200);
	categoryId = categorias.body[0]._id;
	outraCategoriaId = categorias.body[1]._id;

	cardId = (await createCreditCard(user.token))._id;
});

const lancar = (body) =>
	user
		.auth(request(app).post("/transactions"))
		.send(body.type === "credit" && !("bankCard" in body) ? { ...body, bankCard: cardId } : body)
		.expect(201);

const receber = (valor, data) =>
	lancar({ type: "income", description: "Salário", totalValueInCents: valor, date: data });

const debitar = (valor, data, categoria = categoryId) =>
	lancar({
		type: "debit",
		description: "Mercado",
		totalValueInCents: valor,
		date: data,
		category: categoria,
	});

const comprar = (valor, data, extra = {}) =>
	lancar({
		type: "credit",
		description: "Restaurante",
		totalValueInCents: valor,
		date: data,
		category: categoryId,
		...extra,
	});

const relatorio = (query = "") =>
	user.auth(request(app).get(`/reports/monthly${query}`)).expect(200);

/** Mês da série pela chave, para não depender da posição. */
const mesDe = (body, offset) => body.series.find((item) => item.month === mes(offset));

describe("GET /reports/monthly", () => {
	it("devolve a janela padrão de 6 meses terminando no mês corrente, zerada", async () => {
		const { body } = await relatorio();

		expect(body.months).toBe(6);
		expect(body.series).toHaveLength(6);
		expect(body.series.map((item) => item.month)).toEqual([-5, -4, -3, -2, -1, 0].map(mes));

		for (const item of body.series) {
			expect(item.incomeInCents).toBe(0);
			expect(item.expenseInCents).toBe(0);
			expect(item.netResultInCents).toBe(0);
			expect(item.categories).toEqual([]);
			// Sem base e sem valor: variação zero e percentual indefinido.
			expect(item.change.expenseInCents).toBe(0);
			expect(item.change.expensePercent).toBeNull();
		}

		expect(body.totals.expenseInCents).toBe(0);
		expect(body.categories).toEqual([]);
	});

	it("tem rótulo de mês em português e em ordem cronológica", async () => {
		const { body } = await relatorio("?months=3");

		expect(body.series).toHaveLength(3);
		expect(body.series.map((item) => item.month)).toEqual([-2, -1, 0].map(mes));

		for (const item of body.series) {
			expect(item.label).toMatch(/^[a-zç]+ de \d{4}$/);
		}
	});

	describe("validação da janela", () => {
		it("aceita de 3 a 12 meses", async () => {
			const curta = await relatorio("?months=3");
			const longa = await relatorio("?months=12");

			expect(curta.body.series).toHaveLength(3);
			expect(curta.body.series[0].month).toBe(mes(-2));

			expect(longa.body.series).toHaveLength(12);
			expect(longa.body.series[0].month).toBe(mes(-11));
			expect(longa.body.series[11].month).toBe(mes(0));
		});

		it("recusa janela fora da faixa", async () => {
			await user.auth(request(app).get("/reports/monthly?months=2")).expect(400);
			await user.auth(request(app).get("/reports/monthly?months=13")).expect(400);
			await user.auth(request(app).get("/reports/monthly?months=abc")).expect(400);
		});
	});

	it("exige autenticação", async () => {
		await request(app).get("/reports/monthly").expect(401);
	});

	it("soma receita e despesa de cada mês pela data da transação", async () => {
		await receber(500_000, dia(-1, 5));
		await debitar(120_000, dia(-1, 10));
		await comprar(30_000, dia(-1, 12));

		await receber(400_000, dia(0, 5));
		await debitar(50_000, dia(0, 6));

		const { body } = await relatorio();

		const anterior = mesDe(body, -1);
		expect(anterior.incomeInCents).toBe(500_000);
		expect(anterior.debitExpenseInCents).toBe(120_000);
		expect(anterior.creditExpenseInCents).toBe(30_000);
		expect(anterior.expenseInCents).toBe(150_000);
		expect(anterior.netResultInCents).toBe(350_000);

		const atual = mesDe(body, 0);
		expect(atual.incomeInCents).toBe(400_000);
		expect(atual.expenseInCents).toBe(50_000);
		expect(atual.netResultInCents).toBe(350_000);

		expect(body.totals.incomeInCents).toBe(900_000);
		expect(body.totals.expenseInCents).toBe(200_000);
		expect(body.totals.netResultInCents).toBe(700_000);
		// Média da JANELA pedida, não só dos meses com movimento: 9000 / 6.
		expect(body.totals.averageIncomeInCents).toBe(150_000);
	});

	/**
	 * O ponto mais delicado do item: competência e caixa são coisas diferentes.
	 *
	 * A compra no crédito pesa no mês em que foi feita. O pagamento da fatura,
	 * um ou dois meses depois, NÃO é despesa nova — só quita a dívida que a
	 * compra já registrou. Se ele entrasse, o mesmo dinheiro apareceria duas
	 * vezes no relatório.
	 */
	it("não conta o pagamento da fatura como despesa", async () => {
		await comprar(80_000, dia(-1, 12));

		await lancar({
			type: "invoice_payment",
			description: "Pagamento da fatura",
			totalValueInCents: 80_000,
			date: dia(0, 5),
			bankCard: cardId,
			invoiceCycle: mes(0),
		});

		const { body } = await relatorio();

		expect(mesDe(body, -1).expenseInCents).toBe(80_000);
		// O mês do pagamento fica zerado: a despesa já foi contada lá atrás.
		expect(mesDe(body, 0).expenseInCents).toBe(0);
		expect(body.totals.expenseInCents).toBe(80_000);
	});

	it("ignora guardar e resgatar, que são transferência entre bolsos", async () => {
		await lancar({
			type: "savings",
			description: "Reserva",
			totalValueInCents: 100_000,
			date: dia(0, 8),
		});
		await lancar({
			type: "withdrawal",
			description: "Resgate",
			totalValueInCents: 40_000,
			date: dia(0, 9),
		});

		const { body } = await relatorio();

		const atual = mesDe(body, 0);
		expect(atual.incomeInCents).toBe(0);
		expect(atual.expenseInCents).toBe(0);
		expect(atual.netResultInCents).toBe(0);
	});

	/**
	 * Uma compra em 5x nasce como cinco transações datadas, uma por mês. Em
	 * competência, cada parcela pesa no mês da própria data — é o mesmo
	 * critério do `creditExpenseInCents` do dashboard.
	 */
	it("distribui as parcelas pelo mês de cada uma", async () => {
		await comprar(300_000, dia(-1, 10), { installments: 3 });

		const { body } = await relatorio();

		// 3000 em 3x = 1000 por parcela, sem dízima nem sobra.
		expect(mesDe(body, -1).creditExpenseInCents).toBe(100_000);
		expect(mesDe(body, 0).creditExpenseInCents).toBe(100_000);
		// A terceira parcela vence no mês que vem, fora da janela do relatório.
		expect(body.totals.expenseInCents).toBe(200_000);
	});

	describe("comparativo por categoria", () => {
		it("soma débito e crédito na mesma categoria, do maior para o menor", async () => {
			await debitar(20_000, dia(0, 6));
			await comprar(30_000, dia(0, 7));
			await debitar(90_000, dia(0, 8), outraCategoriaId);

			const { body } = await relatorio();

			const atual = mesDe(body, 0);
			expect(atual.categories).toHaveLength(2);

			const [maior, menor] = atual.categories;
			expect(maior.categoryId).toBe(outraCategoriaId);
			expect(maior.totalInCents).toBe(90_000);
			// Débito e crédito da mesma categoria somam: 200 + 300.
			expect(menor.categoryId).toBe(categoryId);
			expect(menor.totalInCents).toBe(50_000);
			expect(menor.category).toBeTypeOf("string");
			expect(menor.color).toMatch(/^#[0-9a-fA-F]{6}$/);
		});

		it("traz o total da janela por categoria, mês a mês e alinhado com a série", async () => {
			await debitar(10_000, dia(-2, 10));
			await debitar(30_000, dia(0, 10));
			await debitar(50_000, dia(0, 11), outraCategoriaId);

			const { body } = await relatorio("?months=3");

			expect(body.categories).toHaveLength(2);

			const primeira = body.categories.find((item) => item.categoryId === categoryId);
			expect(primeira.totalInCents).toBe(40_000);
			// Uma posição por mês da série, na mesma ordem: [-2, -1, 0].
			expect(primeira.monthlyInCents).toEqual([10_000, 0, 30_000]);

			const segunda = body.categories.find((item) => item.categoryId === outraCategoriaId);
			expect(segunda.monthlyInCents).toEqual([0, 0, 50_000]);

			// Maior total primeiro: 500 na frente de 400.
			expect(body.categories[0].categoryId).toBe(outraCategoriaId);
		});
	});

	describe("variação mês a mês", () => {
		it("compara com o mês anterior, em valor e em percentual", async () => {
			await debitar(100_000, dia(-1, 10));
			await debitar(150_000, dia(0, 10));
			await receber(400_000, dia(-1, 5));
			await receber(300_000, dia(0, 5));

			const { body } = await relatorio();

			const atual = mesDe(body, 0);
			expect(atual.change.expenseInCents).toBe(50_000);
			expect(atual.change.expensePercent).toBe(50);
			expect(atual.change.incomeInCents).toBe(-100_000);
			expect(atual.change.incomePercent).toBe(-25);
			// Resultado: 1500 (mês atual) − 3000 (anterior).
			expect(atual.change.netResultInCents).toBe(-150_000);
		});

		it("deixa o percentual nulo quando o mês anterior foi zero", async () => {
			await debitar(80_000, dia(0, 10));

			const { body } = await relatorio();

			const atual = mesDe(body, 0);
			expect(atual.change.expenseInCents).toBe(80_000);
			// Dividir por zero não daria percentual nenhum: "subiu 100%" a
			// partir de zero não significa nada.
			expect(atual.change.expensePercent).toBeNull();
		});

		/**
		 * O primeiro mês da janela compara com o mês de FORA dela. Sem essa
		 * base, a primeira linha apareceria sempre como alta total, como se
		 * nada tivesse sido gasto antes.
		 */
		it("usa o mês anterior à janela como base do primeiro mês", async () => {
			await debitar(50_000, dia(-3, 10));
			await debitar(75_000, dia(-2, 10));

			const { body } = await relatorio("?months=3");

			const primeiro = body.series[0];
			expect(primeiro.month).toBe(mes(-2));
			expect(primeiro.change.expenseInCents).toBe(25_000);
			expect(primeiro.change.expensePercent).toBe(50);

			// O mês-base não entra na resposta nem nos totais da janela.
			expect(body.series.some((item) => item.month === mes(-3))).toBe(false);
			expect(body.totals.expenseInCents).toBe(75_000);
			expect(body.categories[0].totalInCents).toBe(75_000);
		});
	});

	it("não enxerga transação de outro usuário", async () => {
		const outro = await createUser();
		const outraCategoria = await firstCategoryId(outro.token);

		await outro
			.auth(request(app).post("/transactions"))
			.send({
				type: "debit",
				description: "Mercado do vizinho",
				totalValueInCents: 999_000,
				date: dia(0, 10),
				category: outraCategoria,
			})
			.expect(201);

		await debitar(10_000, dia(0, 10));

		const { body } = await relatorio();

		expect(mesDe(body, 0).expenseInCents).toBe(10_000);
		expect(body.totals.expenseInCents).toBe(10_000);
	});
});
