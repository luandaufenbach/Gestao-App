import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createRequire } from "node:module";

/** Mesmo motivo do tests/paywall.test.js: a flag é lida no require do env. */
process.env.PAYWALL_ENABLED = "true";

const require = createRequire(import.meta.url);
const app = require("../src/app");
const User = require("../src/models/User");
const { cycleForPurchase } = require("../src/utils/invoiceCycle");

/** Cartão que fecha dia 01 e vence dia 05 — o exemplo do CLAUDE.md. */
const CARTAO = { name: "Nubank", lastFourDigits: "4561", type: "credit", closingDay: 1, dueDay: 5 };

function somaMeses(cycle, n) {
	const [ano, mes] = cycle.split("-").map(Number);
	const d = new Date(Date.UTC(ano, mes - 1 + n, 1));
	return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

async function conta() {
	const email = `inv${Date.now()}${Math.random().toString(36).slice(2, 8)}@exemplo.com`;
	const { body } = await request(app)
		.post("/auth/register")
		.send({ name: "Teste", email, password: "senha1234" })
		.expect(201);
	return { token: body.token, id: body.user.id };
}

const auth = (req, token) => req.set("Authorization", `Bearer ${token}`);

describe("paywall da fatura futura", () => {
	let token;
	let id;
	let cartaoId;
	let cicloAtual;

	beforeEach(async () => {
		({ token, id } = await conta());
		const { body } = await auth(request(app).post("/bank-cards"), token).send(CARTAO).expect(201);
		cartaoId = body._id;
		cicloAtual = cycleForPurchase(new Date(), body).cycle;
	});

	it("recusa o detalhe de fatura que ainda não fechou", async () => {
		const futuro = somaMeses(cicloAtual, 2);
		const res = await auth(request(app).get(`/bank-cards/${cartaoId}/invoices/${futuro}`), token);

		expect(res.status).toBe(402);
		expect(res.body.message).toMatch(/plano pago/i);
		// Precisa dizer o que continua liberado, senão parece bloqueio geral.
		expect(res.body.message).toMatch(/continuam liberadas/i);
	});

	it("deixa ver a fatura do ciclo atual", async () => {
		await auth(request(app).get(`/bank-cards/${cartaoId}/invoices/${cicloAtual}`), token).expect(
			200
		);
	});

	it("deixa ver fatura passada: ler o próprio histórico nunca é pago", async () => {
		const passado = somaMeses(cicloAtual, -3);
		await auth(request(app).get(`/bank-cards/${cartaoId}/invoices/${passado}`), token).expect(200);
	});

	it("a lista normal, ancorada em hoje, não muda", async () => {
		const { body } = await auth(
			request(app).get(`/bank-cards/${cartaoId}/invoices`),
			token
		).expect(200);

		expect(body.invoices.length).toBe(6);
		// A lista anda para trás: nenhum ciclo futuro aparece nem por engano.
		expect(body.invoices.every((i) => i.cycle <= cicloAtual)).toBe(true);
	});

	it("recusa a lista quando a janela inteira é futura", async () => {
		const daquiA = new Date();
		daquiA.setUTCMonth(daquiA.getUTCMonth() + 10);

		const res = await auth(
			request(app).get(
				`/bank-cards/${cartaoId}/invoices?year=${daquiA.getUTCFullYear()}&month=${daquiA.getUTCMonth() + 1}&limit=3`
			),
			token
		);

		expect(res.status).toBe(402);
	});

	it("com assinatura em dia, a fatura futura abre", async () => {
		await User.findByIdAndUpdate(id, {
			subscription: {
				plan: "pro",
				status: "active",
				validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
			},
		});

		const futuro = somaMeses(cicloAtual, 2);
		await auth(request(app).get(`/bank-cards/${cartaoId}/invoices/${futuro}`), token).expect(200);
	});
});
