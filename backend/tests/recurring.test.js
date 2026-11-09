import { describe, it, expect, beforeEach } from "vitest";
import { createUser, firstCategoryId, request, app } from "./helpers.js";

/**
 * Datas sempre relativas a hoje: o `CLAUDE.md` proíbe data fixa em teste,
 * porque ela envelhece e o teste quebra sozinho com o tempo.
 */
function mesesAtras(n, dia = 10) {
	const hoje = new Date();
	return new Date(Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth() - n, dia))
		.toISOString()
		.slice(0, 10);
}

async function lancar(token, categoria, { descricao, valor, mesesAtras: n, dia = 10, tipo = "debit" }) {
	return request(app)
		.post("/transactions")
		.set("Authorization", `Bearer ${token}`)
		.send({
			type: tipo,
			description: descricao,
			totalValueInCents: valor,
			date: mesesAtras(n, dia),
			category: categoria,
		})
		.expect(201);
}

const buscar = (token) =>
	request(app).get("/dashboard/recurring").set("Authorization", `Bearer ${token}`).expect(200);

describe("assinaturas recorrentes", () => {
	let token;
	let categoria;

	beforeEach(async () => {
		({ token } = await createUser());
		categoria = await firstCategoryId(token);
	});

	it("encontra a cobrança que se repete todo mês", async () => {
		for (const n of [2, 1, 0]) {
			await lancar(token, categoria, { descricao: "Spotify", valor: 2190, mesesAtras: n });
		}

		const { body } = await buscar(token);

		expect(body.subscriptions).toHaveLength(1);
		expect(body.subscriptions[0]).toMatchObject({
			description: "Spotify",
			valueInCents: 2190,
			occurrences: 3,
			active: true,
		});
		expect(body.monthlyTotalInCents).toBe(2190);
	});

	it("ignora duas cobranças: duas vezes no mesmo lugar é coincidência", async () => {
		for (const n of [1, 0]) {
			await lancar(token, categoria, { descricao: "Padaria", valor: 1500, mesesAtras: n });
		}

		const { body } = await buscar(token);
		expect(body.subscriptions).toHaveLength(0);
	});

	it("aceita reajuste de preço, mas não valor que dança", async () => {
		// Netflix reajustando: 44,90 -> 44,90 -> 49,90, dentro da tolerância.
		await lancar(token, categoria, { descricao: "Netflix", valor: 4490, mesesAtras: 2 });
		await lancar(token, categoria, { descricao: "Netflix", valor: 4490, mesesAtras: 1 });
		await lancar(token, categoria, { descricao: "Netflix", valor: 4990, mesesAtras: 0 });

		// Mercado: mesmo lugar todo mês, valor completamente diferente.
		await lancar(token, categoria, { descricao: "Mercado", valor: 12000, mesesAtras: 2 });
		await lancar(token, categoria, { descricao: "Mercado", valor: 31000, mesesAtras: 1 });
		await lancar(token, categoria, { descricao: "Mercado", valor: 8000, mesesAtras: 0 });

		const { body } = await buscar(token);
		const nomes = body.subscriptions.map((s) => s.description);

		expect(nomes).toContain("Netflix");
		expect(nomes).not.toContain("Mercado");
	});

	it("junta descrições que só diferem no número do mês", async () => {
		await lancar(token, categoria, { descricao: "Claro conta 09", valor: 6390, mesesAtras: 2 });
		await lancar(token, categoria, { descricao: "Claro conta 10", valor: 6390, mesesAtras: 1 });
		await lancar(token, categoria, { descricao: "Claro conta 11", valor: 6390, mesesAtras: 0 });

		const { body } = await buscar(token);

		expect(body.subscriptions).toHaveLength(1);
		// A descrição mostrada é a da última cobrança, como o usuário escreveu.
		expect(body.subscriptions[0].description).toBe("Claro conta 11");
	});

	it("não chama de assinatura o mercado que sobe um pouco todo mês", async () => {
		/**
		 * Regressão encontrada rodando contra dados semeados: a normalização
		 * tira os números, então "Mercado do mes 5", "Mercado do mes 4"... viram
		 * um grupo só. Valores entre R$ 600 e R$ 750 cabem na banda de 25%, e o
		 * app anunciava "assinatura de R$ 675".
		 */
		for (let n = 5; n >= 0; n--) {
			await lancar(token, categoria, {
				descricao: `Mercado do mes ${n}`,
				valor: 60000 + n * 3000,
				mesesAtras: n,
			});
		}

		const { body } = await buscar(token);
		expect(body.subscriptions).toHaveLength(0);
	});

	it("mostra o preço novo depois do reajuste, não o antigo", async () => {
		await lancar(token, categoria, { descricao: "Netflix", valor: 4490, mesesAtras: 2 });
		await lancar(token, categoria, { descricao: "Netflix", valor: 4490, mesesAtras: 1 });
		await lancar(token, categoria, { descricao: "Netflix", valor: 4990, mesesAtras: 0 });

		const { body } = await buscar(token);

		// Com a mediana seriam 44,90, e o comprometido do mês sairia menor.
		expect(body.subscriptions[0].valueInCents).toBe(4990);
		expect(body.monthlyTotalInCents).toBe(4990);
	});

	it("não confunde compra espaçada com assinatura", async () => {
		// Mesmo valor, mesmo lugar, mas de quatro em quatro meses.
		for (const n of [8, 4, 0]) {
			await lancar(token, categoria, { descricao: "Oficina", valor: 20000, mesesAtras: n });
		}

		const { body } = await buscar(token);
		expect(body.subscriptions).toHaveLength(0);
	});

	it("marca como encerrada a que parou de cobrar, e não soma no total", async () => {
		for (const n of [7, 6, 5]) {
			await lancar(token, categoria, { descricao: "Revista velha", valor: 3000, mesesAtras: n });
		}
		for (const n of [2, 1, 0]) {
			await lancar(token, categoria, { descricao: "Spotify", valor: 2190, mesesAtras: n });
		}

		const { body } = await buscar(token);
		const encerrada = body.subscriptions.find((s) => s.description === "Revista velha");

		expect(encerrada).toBeDefined();
		expect(encerrada.active).toBe(false);
		// Só a ativa entra no comprometido do mês.
		expect(body.monthlyTotalInCents).toBe(2190);
	});

	it("deixa o parcelado de fora, que tem fim e já está na projeção", async () => {
		const cartao = await request(app)
			.post("/bank-cards")
			.set("Authorization", `Bearer ${token}`)
			.send({ name: "Cartão", lastFourDigits: "1234", type: "credit", closingDay: 1, dueDay: 5 })
			.expect(201);

		await request(app)
			.post("/transactions")
			.set("Authorization", `Bearer ${token}`)
			.send({
				type: "credit",
				description: "Geladeira",
				totalValueInCents: 120000,
				date: mesesAtras(2),
				category: categoria,
				bankCard: cartao.body._id,
				installments: 12,
			})
			.expect(201);

		const { body } = await buscar(token);
		expect(body.subscriptions.map((s) => s.description)).not.toContain("Geladeira");
	});

	it("não enxerga assinatura de outra conta", async () => {
		for (const n of [2, 1, 0]) {
			await lancar(token, categoria, { descricao: "Spotify", valor: 2190, mesesAtras: n });
		}

		const outro = await createUser();
		const { body } = await buscar(outro.token);

		expect(body.subscriptions).toHaveLength(0);
		expect(body.monthlyTotalInCents).toBe(0);
	});

	it("soma o comprometido de várias assinaturas ativas", async () => {
		for (const n of [2, 1, 0]) {
			await lancar(token, categoria, { descricao: "Spotify", valor: 2190, mesesAtras: n });
			await lancar(token, categoria, { descricao: "Claro", valor: 6390, mesesAtras: n, dia: 15 });
		}

		const { body } = await buscar(token);

		expect(body.subscriptions).toHaveLength(2);
		// Maior primeiro.
		expect(body.subscriptions[0].description).toBe("Claro");
		expect(body.monthlyTotalInCents).toBe(2190 + 6390);
	});
});
