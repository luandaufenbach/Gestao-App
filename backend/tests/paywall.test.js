import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { createRequire } from "node:module";

/**
 * O paywall é lido do ambiente quando `config/env.js` é carregado, então a
 * variável precisa estar de pé ANTES do primeiro require da aplicação. Por isso
 * o `createRequire`: com `import`, o ES module iça as importações para antes de
 * qualquer atribuição, e o app nasceria com o paywall desligado.
 *
 * O mesmo truque do tests/monitoring.test.js, e pelo mesmo motivo de fundo: o
 * código é CommonJS e o Vitest carrega duas cópias quando ele chega por
 * caminhos diferentes.
 */
process.env.PAYWALL_ENABLED = "true";

const require = createRequire(import.meta.url);
const app = require("../src/app");
const User = require("../src/models/User");

const PAGOS = ["/reports/monthly", "/dashboard/projection"];
const GRATIS = ["/dashboard/monthly-balance?year=2026&month=11", "/transactions", "/categories"];

async function criarConta() {
	const email = `pay${Date.now()}${Math.random().toString(36).slice(2, 8)}@exemplo.com`;
	const { body } = await request(app)
		.post("/auth/register")
		.send({ name: "Teste", email, password: "senha1234" })
		.expect(201);
	return { token: body.token, id: body.user.id };
}

const comToken = (req, token) => req.set("Authorization", `Bearer ${token}`);

describe("paywall", () => {
	let token;
	let id;

	beforeAll(async () => {
		expect(require("../src/config/env").paywallEnabled).toBe(true);
	});

	it("recusa os recursos pagos com 402 e mensagem clara", async () => {
		({ token, id } = await criarConta());

		for (const rota of PAGOS) {
			const res = await comToken(request(app).get(rota), token);
			expect(res.status, `esperava 402 em ${rota}`).toBe(402);
			expect(res.body.message).toMatch(/plano pago/i);
			// A mensagem precisa dizer o que NÃO se perde, senão parece que
			// trancamos os dados da pessoa.
			expect(res.body.message).toMatch(/continuam liberados/i);
		}
	});

	it("deixa o que é grátis continuar aberto", async () => {
		({ token } = await criarConta());

		for (const rota of GRATIS) {
			const res = await comToken(request(app).get(rota), token);
			expect(res.status, `esperava 200 em ${rota}`).toBe(200);
		}
	});

	it("libera quem tem assinatura em dia", async () => {
		({ token, id } = await criarConta());

		await User.findByIdAndUpdate(id, {
			subscription: {
				plan: "pro",
				status: "active",
				validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
			},
		});

		for (const rota of PAGOS) {
			const res = await comToken(request(app).get(rota), token);
			expect(res.status, `esperava 200 em ${rota}`).toBe(200);
		}
	});

	it("não aceita assinatura vencida", async () => {
		({ token, id } = await criarConta());

		await User.findByIdAndUpdate(id, {
			subscription: {
				plan: "pro",
				status: "active",
				validUntil: new Date(Date.now() - 1000),
			},
		});

		const res = await comToken(request(app).get("/reports/monthly"), token);
		expect(res.status).toBe(402);
	});

	it("quem cancela fica até o fim do período já pago", async () => {
		({ token, id } = await criarConta());

		await User.findByIdAndUpdate(id, {
			subscription: {
				plan: "pro",
				status: "canceled",
				validUntil: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
			},
		});

		const res = await comToken(request(app).get("/reports/monthly"), token);
		expect(res.status).toBe(200);
	});

	it("conta nova nasce no plano grátis, sem validade", async () => {
		const { id: novo } = await criarConta();
		const user = await User.findById(novo);

		expect(user.subscription.plan).toBe("free");
		expect(user.subscription.status).toBe("none");
		expect(user.subscription.validUntil).toBeNull();
		expect(user.hasPaidAccess()).toBe(false);
	});

	it("exportar e excluir a conta nunca passam pelo paywall", async () => {
		({ token } = await criarConta());

		// Direito do titular pela LGPD: não pode depender de assinatura.
		const res = await comToken(request(app).get("/account/export"), token);
		expect(res.status).toBe(200);
	});
});
