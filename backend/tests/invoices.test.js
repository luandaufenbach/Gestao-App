import { describe, it, expect, beforeEach } from "vitest";
import { app, request, createUser, firstCategoryId } from "./helpers.js";

/**
 * Faturas de cartão de crédito.
 *
 * O cenário de referência é o do usuário: cartão que fecha dia 01 e vence dia
 * 05. Compras feitas em julho entram na "fatura de agosto", paga em 05/08.
 */

let user;
let categoryId;
let cardId;

beforeEach(async () => {
	user = await createUser();
	categoryId = await firstCategoryId(user.token);

	const card = await user
		.auth(request(app).post("/bank-cards"))
		.send({
			name: "Nubank",
			bank: "Nubank",
			lastFourDigits: "1234",
			type: "credit",
			closingDay: 1,
			dueDay: 5,
		})
		.expect(201);

	cardId = card.body._id;
});

const comprar = (valor, data, descricao = "Compra") =>
	user
		.auth(request(app).post("/transactions"))
		.send({
			type: "credit",
			description: descricao,
			totalValueInCents: valor,
			date: data,
			category: categoryId,
			bankCard: cardId,
		})
		.expect(201);

const pagar = (valor, data, ciclo) =>
	user.auth(request(app).post("/transactions")).send({
		type: "invoice_payment",
		description: "Pagamento da fatura",
		totalValueInCents: valor,
		date: data,
		bankCard: cardId,
		invoiceCycle: ciclo,
	});

const faturas = () => user.auth(request(app).get(`/bank-cards/${cardId}/invoices?limit=12`));

const fatura = (ciclo) => user.auth(request(app).get(`/bank-cards/${cardId}/invoices/${ciclo}`));

describe("montagem da fatura", () => {
	it("agrupa as compras de julho na fatura de agosto", async () => {
		await comprar(20_000, "2026-07-10", "Gasolina");
		await comprar(30_000, "2026-07-20", "Mercado");

		const { body } = await fatura("2026-08").expect(200);

		expect(body.totalInCents).toBe(50_000);
		expect(body.transactionCount).toBe(2);
		expect(body.closingDate.slice(0, 10)).toBe("2026-08-01");
		expect(body.dueDate.slice(0, 10)).toBe("2026-08-05");
		expect(body.label).toBe("agosto de 2026");
	});

	it("compra após o fechamento cai na fatura seguinte", async () => {
		// Fechou em 01/08; a compra do dia 02 já é da próxima.
		await comprar(10_000, "2026-08-01", "Antes do corte");
		await comprar(70_000, "2026-08-02", "Depois do corte");

		const agosto = await fatura("2026-08").expect(200);
		const setembro = await fatura("2026-09").expect(200);

		expect(agosto.body.totalInCents).toBe(10_000);
		expect(setembro.body.totalInCents).toBe(70_000);
	});

	it("ignora compras de outro cartão", async () => {
		const outroCartao = await user
			.auth(request(app).post("/bank-cards"))
			.send({
				name: "Outro",
				lastFourDigits: "9999",
				type: "credit",
				closingDay: 1,
				dueDay: 5,
			})
			.expect(201);

		await comprar(20_000, "2026-07-10");

		await user
			.auth(request(app).post("/transactions"))
			.send({
				type: "credit",
				description: "Compra no outro cartão",
				totalValueInCents: 99_000,
				date: "2026-07-10",
				category: categoryId,
				bankCard: outroCartao.body._id,
			})
			.expect(201);

		const { body } = await fatura("2026-08").expect(200);
		expect(body.totalInCents).toBe(20_000);
	});

	it("ignora débito e receita, mesmo vinculados ao cartão", async () => {
		await comprar(20_000, "2026-07-10");

		await user
			.auth(request(app).post("/transactions"))
			.send({
				type: "debit",
				description: "Compra no débito",
				totalValueInCents: 50_000,
				date: "2026-07-11",
				category: categoryId,
				bankCard: cardId,
			})
			.expect(201);

		const { body } = await fatura("2026-08").expect(200);
		expect(body.totalInCents).toBe(20_000);
	});

	it("distribui as parcelas entre faturas consecutivas", async () => {
		await user
			.auth(request(app).post("/transactions"))
			.send({
				type: "credit",
				description: "Notebook",
				totalValueInCents: 30_000,
				date: "2026-07-10",
				category: categoryId,
				bankCard: cardId,
				installments: 3,
			})
			.expect(201);

		const agosto = await fatura("2026-08").expect(200);
		const setembro = await fatura("2026-09").expect(200);
		const outubro = await fatura("2026-10").expect(200);

		expect(agosto.body.totalInCents).toBe(10_000);
		expect(setembro.body.totalInCents).toBe(10_000);
		expect(outubro.body.totalInCents).toBe(10_000);
	});
});

describe("status da fatura", () => {
	/**
	 * "Aberta" e "parcial" dependem do vencimento ainda não ter chegado, então
	 * estes testes não podem usar datas fixas — elas envelhecem e o teste passa
	 * a falhar sozinho com o tempo.
	 *
	 * A solução é ancorar na fatura que está aberta AGORA: a listagem devolve os
	 * ciclos do mais recente para o mais antigo, e o primeiro é sempre o que
	 * ainda está recebendo compras.
	 */
	async function faturaAberta() {
		const { body } = await faturas().expect(200);
		return body.invoices[0];
	}

	/** Uma data dentro do período da fatura aberta. */
	const hoje = () => new Date().toISOString().slice(0, 10);

	it("sem pagamento fica aberta", async () => {
		const aberta = await faturaAberta();

		await comprar(50_000, hoje());

		const { body } = await fatura(aberta.cycle).expect(200);

		expect(body.status).toBe("aberta");
		expect(body.paidInCents).toBe(0);
		expect(body.remainingInCents).toBe(50_000);
	});

	it("pagamento antecipado parcial deixa a fatura parcial", async () => {
		/**
		 * O caso real do usuário: saiu com os amigos, passou R$ 100 no crédito,
		 * eles devolveram a parte deles e ele já quitou esses R$ 100 para não
		 * misturar com o resto da fatura.
		 */
		const aberta = await faturaAberta();

		await comprar(10_000, hoje(), "Rolê com os amigos");
		await comprar(40_000, hoje(), "Mercado");

		await pagar(10_000, hoje(), aberta.cycle).expect(201);

		const { body } = await fatura(aberta.cycle).expect(200);

		expect(body.status).toBe("parcial");
		expect(body.totalInCents).toBe(50_000);
		expect(body.paidInCents).toBe(10_000);
		expect(body.remainingInCents).toBe(40_000);
	});

	it("vários pagamentos somam e fecham a fatura", async () => {
		await comprar(50_000, "2026-07-10");

		await pagar(10_000, "2026-07-11", "2026-08").expect(201);
		await pagar(40_000, "2026-08-05", "2026-08").expect(201);

		const { body } = await fatura("2026-08").expect(200);

		expect(body.status).toBe("paga");
		expect(body.paidInCents).toBe(50_000);
		expect(body.remainingInCents).toBe(0);
		expect(body.payments).toHaveLength(2);
	});

	it("fatura sem compras nem pagamento é 'vazia'", async () => {
		const { body } = await fatura("2026-08").expect(200);

		expect(body.status).toBe("vazia");
		expect(body.totalInCents).toBe(0);
	});

	it("fatura antiga não paga aparece como vencida", async () => {
		// 2020 está no passado em qualquer execução dos testes.
		await comprar(50_000, "2020-01-10");

		const { body } = await fatura("2020-02").expect(200);

		expect(body.status).toBe("vencida");
	});
});

describe("detalhe da fatura", () => {
	it("agrupa as compras por categoria", async () => {
		const categorias = await user.auth(request(app).get("/categories")).expect(200);
		const [mercado, combustivel] = categorias.body;

		const comprarEm = (valor, data, cat, desc) =>
			user
				.auth(request(app).post("/transactions"))
				.send({
					type: "credit",
					description: desc,
					totalValueInCents: valor,
					date: data,
					category: cat,
					bankCard: cardId,
				})
				.expect(201);

		await comprarEm(20_000, "2026-07-05", mercado._id, "Feira");
		await comprarEm(30_000, "2026-07-12", mercado._id, "Supermercado");
		await comprarEm(15_000, "2026-07-18", combustivel._id, "Posto");

		const { body } = await fatura("2026-08").expect(200);

		expect(body.totalInCents).toBe(65_000);
		expect(body.categories).toHaveLength(2);

		// Ordenado do maior gasto para o menor.
		expect(body.categories[0]).toMatchObject({
			category: mercado.name,
			totalInCents: 50_000,
			count: 2,
		});
		expect(body.categories[1].totalInCents).toBe(15_000);

		// E a lista completa das compras vem junto.
		expect(body.transactions).toHaveLength(3);
	});
});

describe("listagem de faturas", () => {
	it("lista os ciclos do mais recente para o mais antigo", async () => {
		const { body } = await faturas().expect(200);

		expect(body.card.name).toBe("Nubank");
		expect(body.invoices.length).toBe(12);

		const cycles = body.invoices.map((i) => i.cycle);
		expect([...cycles].sort().reverse()).toEqual(cycles);
	});

	it("traz totais e status corretos por ciclo", async () => {
		await comprar(50_000, "2026-07-10");
		await pagar(50_000, "2026-08-05", "2026-08").expect(201);

		const { body } = await faturas().expect(200);
		const agosto = body.invoices.find((i) => i.cycle === "2026-08");

		expect(agosto.totalInCents).toBe(50_000);
		expect(agosto.paidInCents).toBe(50_000);
		expect(agosto.status).toBe("paga");
	});
});

describe("validações", () => {
	it("cartão sem ciclo configurado não tem fatura", async () => {
		const semCiclo = await user
			.auth(request(app).post("/bank-cards"))
			.send({ name: "Sem ciclo", lastFourDigits: "0000", type: "credit" })
			.expect(201);

		await user.auth(request(app).get(`/bank-cards/${semCiclo.body._id}/invoices`)).expect(400);
	});

	it("recusa fechamento sem vencimento", async () => {
		await user
			.auth(request(app).post("/bank-cards"))
			.send({ name: "Meio", lastFourDigits: "1111", type: "credit", closingDay: 1 })
			.expect(400);
	});

	it("pagamento exige cartão e ciclo", async () => {
		await user
			.auth(request(app).post("/transactions"))
			.send({
				type: "invoice_payment",
				description: "Sem cartão",
				totalValueInCents: 10_000,
				date: "2026-08-05",
			})
			.expect(400);

		await user
			.auth(request(app).post("/transactions"))
			.send({
				type: "invoice_payment",
				description: "Sem ciclo",
				totalValueInCents: 10_000,
				date: "2026-08-05",
				bankCard: cardId,
			})
			.expect(400);
	});

	it("só pagamento de fatura pode informar ciclo", async () => {
		await user
			.auth(request(app).post("/transactions"))
			.send({
				type: "debit",
				description: "Débito com ciclo?",
				totalValueInCents: 10_000,
				date: "2026-08-05",
				category: categoryId,
				invoiceCycle: "2026-08",
			})
			.expect(400);
	});

	it("não aceita pagar fatura de cartão de débito", async () => {
		const debito = await user
			.auth(request(app).post("/bank-cards"))
			.send({ name: "Débito", lastFourDigits: "2222", type: "debit" })
			.expect(201);

		await user
			.auth(request(app).post("/transactions"))
			.send({
				type: "invoice_payment",
				description: "Fatura de débito?",
				totalValueInCents: 10_000,
				date: "2026-08-05",
				bankCard: debito.body._id,
				invoiceCycle: "2026-08",
			})
			.expect(400);
	});

	it("recusa ciclo malformado na URL", async () => {
		await user.auth(request(app).get(`/bank-cards/${cardId}/invoices/agosto`)).expect(400);
		await user.auth(request(app).get(`/bank-cards/${cardId}/invoices/2026-13`)).expect(400);
	});

	it("não expõe fatura de cartão de outro usuário", async () => {
		const outro = await createUser({ email: "outro-fatura@exemplo.com" });

		await outro.auth(request(app).get(`/bank-cards/${cardId}/invoices`)).expect(404);
	});
});

/**
 * Faturas futuras.
 *
 * As parcelas de uma compra nascem como transações datadas nos meses
 * seguintes, então a fatura de dezembro já existe no banco no dia em que a
 * compra em 5x é lançada. O que faltava era pedi-la: a lista era sempre
 * ancorada em "hoje", e navegar para um mês futuro no dashboard continuava
 * mostrando a fatura do mês corrente.
 */
describe("lista ancorada em um mês", () => {
	const listarEm = (year, month) =>
		user
			.auth(
				request(app).get(
					`/bank-cards/${cardId}/invoices?limit=6&year=${year}&month=${month}`
				)
			)
			.expect(200);

	/** Compra de R$ 1.000 em 5x, feita em agosto: R$ 200 por mês. */
	const comprarParcelado = () =>
		user
			.auth(request(app).post("/transactions"))
			.send({
				type: "credit",
				description: "Notebook",
				totalValueInCents: 100_000,
				date: "2026-08-10",
				category: categoryId,
				bankCard: cardId,
				installments: 5,
			})
			.expect(201);

	it("a lista começa na fatura que recebe as compras do mês pedido", async () => {
		// Compras de novembro fecham em 01/12 e vencem em 05/12: fatura de dezembro.
		const resposta = await listarEm(2026, 11);
		const ciclos = resposta.body.invoices.map((invoice) => invoice.cycle);

		expect(ciclos.slice(0, 4)).toEqual(["2026-12", "2026-11", "2026-10", "2026-09"]);
	});

	/**
	 * Regressão do bug relatado: com setembro selecionado, o card listava
	 * julho, agosto e setembro. A âncora era o nome do próprio mês, mas a fatura
	 * é nomeada pelo VENCIMENTO — a "de setembro" vence em 05/09 e guarda as
	 * compras de agosto. As compras de setembro estão na fatura de outubro.
	 */
	it("em setembro, começa pela fatura de outubro, que recebe as compras do mês", async () => {
		await comprar(30_000, "2026-08-20", "Compra de agosto");
		await comprar(10_000, "2026-09-10", "Compra de setembro");

		const resposta = await listarEm(2026, 9);
		const [primeira, segunda] = resposta.body.invoices;

		expect(primeira.cycle).toBe("2026-10");
		expect(primeira.totalInCents).toBe(10_000);
		expect(primeira.dueDate.slice(0, 10)).toBe("2026-10-05");

		expect(segunda.cycle).toBe("2026-09");
		expect(segunda.totalInCents).toBe(30_000);
	});

	it("a fatura de um mês futuro já traz a parcela daquele mês", async () => {
		await comprarParcelado();

		// Compra em 10/08 cai na fatura de setembro; a 4a parcela, em 10/11,
		// cai na de dezembro.
		const resposta = await listarEm(2026, 12);
		const dezembro = resposta.body.invoices.find((invoice) => invoice.cycle === "2026-12");

		expect(dezembro.totalInCents).toBe(20_000);
		expect(dezembro.transactionCount).toBe(1);
	});

	it("cada mês do parcelamento tem a sua parcela, nem mais nem menos", async () => {
		await comprarParcelado();

		const resposta = await listarEm(2027, 1);
		const porCiclo = Object.fromEntries(
			resposta.body.invoices.map((invoice) => [invoice.cycle, invoice.totalInCents])
		);

		// Cinco parcelas de 200, de setembro a janeiro.
		expect(porCiclo["2026-09"]).toBe(20_000);
		expect(porCiclo["2026-10"]).toBe(20_000);
		expect(porCiclo["2026-11"]).toBe(20_000);
		expect(porCiclo["2026-12"]).toBe(20_000);
		expect(porCiclo["2027-01"]).toBe(20_000);
	});

	it("fatura futura ainda não vencida aparece como aberta", async () => {
		await comprarParcelado();

		const resposta = await listarEm(2027, 1);
		const janeiro = resposta.body.invoices.find((invoice) => invoice.cycle === "2027-01");

		expect(janeiro.status).toBe("aberta");
		expect(janeiro.paidInCents).toBe(0);
	});

	it("sem year e month, a âncora continua sendo o mês corrente", async () => {
		const semAncora = await faturas().expect(200);
		const hoje = new Date();
		const cicloCorrente = `${hoje.getUTCFullYear()}-${String(hoje.getUTCMonth() + 1).padStart(2, "0")}`;

		// O ciclo é nomeado pelo mês do vencimento, então o primeiro da lista é
		// o do mês corrente ou o do seguinte, conforme o dia de fechamento.
		expect(semAncora.body.invoices[0].cycle >= cicloCorrente).toBe(true);
	});
});

/**
 * REGRESSÃO — "as compras no crédito estão dando um dia de diferença".
 *
 * Sintoma relatado: escolhe-se o dia 04 e a fatura exibe a compra no dia 03.
 *
 * A causa não estava na exibição nem no intervalo do mês: estava no contrato do
 * campo `date`. O validador aceitava qualquer string que o `new Date()`
 * engolisse, e `normalizeToUTCDay` derivava o dia do INSTANTE resultante — o
 * que faz o dia gravado depender do fuso declarado no payload e do fuso do
 * processo. Ver backend/src/utils/date.js e backend/src/validators/common.js.
 *
 * O percurso completo é verificado aqui: o que entra no POST tem de sair igual
 * na listagem E no detalhe da fatura.
 */
describe("o dia gravado é o dia escolhido", () => {
	const diaDaCompra = (transacao) => transacao.date.slice(0, 10);

	it("compra no dia 04 aparece no dia 04, não no 03", async () => {
		const criada = await comprar(10_000, "2026-11-04", "Compra dia 04");

		expect(diaDaCompra(criada.body)).toBe("2026-11-04");

		const lista = await user.auth(request(app).get("/transactions")).expect(200);
		expect(diaDaCompra(lista.body[0])).toBe("2026-11-04");

		// Cartão que fecha 01 e vence 05: a compra de 04/11 vence em 05/12.
		const dezembro = await fatura("2026-12").expect(200);
		expect(dezembro.body.transactions).toHaveLength(1);
		expect(diaDaCompra(dezembro.body.transactions[0])).toBe("2026-11-04");
	});

	/**
	 * Este é o payload que reproduzia o defeito: o instante correspondente é
	 * 2026-11-03T21:00:00Z, e o dia gravado era 03.
	 */
	it("data com fuso declarado não escorrega para o dia anterior", async () => {
		const criada = await comprar(10_000, "2026-11-04T00:00:00+03:00", "Com fuso");

		expect(diaDaCompra(criada.body)).toBe("2026-11-04");

		const dezembro = await fatura("2026-12").expect(200);
		expect(diaDaCompra(dezembro.body.transactions[0])).toBe("2026-11-04");
	});

	/**
	 * Sem fuso, a string era interpretada no fuso LOCAL do processo: o mesmo
	 * corpo gravava dia 04 em UTC e dia 05 em America/Sao_Paulo. O teste trava
	 * o resultado independentemente de onde a suíte roda.
	 */
	it("data com hora e sem fuso não depende do fuso do servidor", async () => {
		const criada = await comprar(10_000, "2026-11-04T23:59:00", "Sem fuso");

		expect(diaDaCompra(criada.body)).toBe("2026-11-04");
	});

	/**
	 * "04/11/2026" é como se escreve a data no Brasil. O parser não-ISO do V8 a
	 * lia como MM/DD/AAAA, ou seja 11 de ABRIL: o lançamento ia para outro mês,
	 * em outra fatura, sem erro nenhum. Agora é recusado na borda.
	 */
	it("recusa data fora do formato em vez de trocar dia por mês", async () => {
		const resposta = await user
			.auth(request(app).post("/transactions"))
			.send({
				type: "credit",
				description: "Data brasileira",
				totalValueInCents: 10_000,
				date: "04/11/2026",
				category: categoryId,
				bankCard: cardId,
			})
			.expect(400);

		expect(JSON.stringify(resposta.body)).toContain("AAAA-MM-DD");
	});

	it("recusa um dia que não existe no calendário", async () => {
		await user
			.auth(request(app).post("/transactions"))
			.send({
				type: "credit",
				description: "31 de fevereiro",
				totalValueInCents: 10_000,
				date: "2026-02-31",
				category: categoryId,
				bankCard: cardId,
			})
			.expect(400);
	});

	it("a edição também preserva o dia escolhido", async () => {
		const criada = await comprar(10_000, "2026-11-10", "Para editar");

		const editada = await user
			.auth(request(app).patch(`/transactions/${criada.body._id}`))
			.send({ date: "2026-11-04T00:00:00+03:00" })
			.expect(200);

		expect(diaDaCompra(editada.body)).toBe("2026-11-04");
	});
});

/**
 * AUDITORIA DE PARCELAMENTO — cartão que fecha 01 e vence 05.
 *
 * O cenário concreto do usuário: compra em 2x no dia 23. A primeira parcela
 * cai na fatura em aberto; a segunda, na seguinte. Cada caso abaixo fixa qual
 * é a data gravada de cada parcela e em qual ciclo ela aparece.
 */
describe("auditoria das parcelas no ciclo que fecha dia 01", () => {
	const parcelar = (valor, data, parcelas) =>
		user
			.auth(request(app).post("/transactions"))
			.send({
				type: "credit",
				description: `Compra em ${parcelas}x`,
				totalValueInCents: valor,
				date: data,
				category: categoryId,
				bankCard: cardId,
				installments: parcelas,
			})
			.expect(201);

	const datas = (resposta) => resposta.body.transactions.map((t) => t.date.slice(0, 10));

	it("compra em 23/11 em 2x: parcela 1 em novembro, parcela 2 em dezembro", async () => {
		const criada = await parcelar(20_000, "2026-11-23", 2);

		expect(datas(criada)).toEqual(["2026-11-23", "2026-12-23"]);

		// 23/11 está dentro de 02/11–01/12, que vence em 05/12.
		const dezembro = await fatura("2026-12").expect(200);
		// 23/12 está dentro de 02/12–01/01, que vence em 05/01.
		const janeiro = await fatura("2027-01").expect(200);

		expect(dezembro.body.totalInCents).toBe(10_000);
		expect(janeiro.body.totalInCents).toBe(10_000);
		expect(datas(criada)[1]).toBe(janeiro.body.transactions[0].date.slice(0, 10));
	});

	it("a mesma compra em 1x fica inteira na primeira fatura", async () => {
		await parcelar(20_000, "2026-11-23", 1);

		const dezembro = await fatura("2026-12").expect(200);
		const janeiro = await fatura("2027-01").expect(200);

		expect(dezembro.body.totalInCents).toBe(20_000);
		expect(janeiro.body.totalInCents).toBe(0);
	});

	it("a compra do dia do fechamento ainda entra na fatura que fecha nele", async () => {
		await comprar(1_000, "2026-11-01", "No fechamento");

		const novembro = await fatura("2026-11").expect(200);
		expect(novembro.body.totalInCents).toBe(1_000);
	});

	it("a compra do dia seguinte ao fechamento já vai para a fatura seguinte", async () => {
		await comprar(1_000, "2026-11-02", "Depois do fechamento");

		const novembro = await fatura("2026-11").expect(200);
		const dezembro = await fatura("2026-12").expect(200);

		expect(novembro.body.totalInCents).toBe(0);
		expect(dezembro.body.totalInCents).toBe(1_000);
	});

	it("compra no dia 31 em 2x: a parcela cai no último dia do mês curto", async () => {
		const criada = await parcelar(20_000, "2026-01-31", 2);

		// Fevereiro não tem 31; a parcela ancora em 28 em vez de pular para março.
		expect(datas(criada)).toEqual(["2026-01-31", "2026-02-28"]);

		const fevereiro = await fatura("2026-02").expect(200);
		const marco = await fatura("2026-03").expect(200);

		expect(fevereiro.body.totalInCents).toBe(10_000);
		expect(marco.body.totalInCents).toBe(10_000);
	});

	it("o parcelamento atravessa a virada de ano", async () => {
		const criada = await parcelar(30_000, "2026-12-23", 3);

		expect(datas(criada)).toEqual(["2026-12-23", "2027-01-23", "2027-02-23"]);

		const janeiro = await fatura("2027-01").expect(200);
		const fevereiro = await fatura("2027-02").expect(200);
		const marco = await fatura("2027-03").expect(200);

		expect(janeiro.body.totalInCents).toBe(10_000);
		expect(fevereiro.body.totalInCents).toBe(10_000);
		expect(marco.body.totalInCents).toBe(10_000);
	});
});
