import { describe, it, expect } from "vitest";
import request from "supertest";
import { createRequire } from "node:module";

/**
 * Cortesia para quem é anterior ao paywall (ROADMAP 2.4).
 *
 * As duas variáveis precisam existir ANTES do primeiro require da aplicação —
 * `config/env.js` as lê no carregamento. Mesmo motivo e mesmo truque do
 * tests/paywall.test.js.
 *
 * A data é relativa a hoje, nunca fixa: data fixa envelhece e o teste passa a
 * falhar sozinho com o tempo.
 */
const DIAS = 24 * 60 * 60 * 1000;
const INICIO_DO_PAYWALL = new Date(Date.now() - 7 * DIAS);

process.env.PAYWALL_ENABLED = "true";
process.env.PAYWALL_STARTS_AT = INICIO_DO_PAYWALL.toISOString();

const require = createRequire(import.meta.url);
const app = require("../src/app");
const User = require("../src/models/User");
const mongoose = require("mongoose");

const UM_RECURSO_PAGO = "/dashboard/projection";

async function criarConta() {
	const email = `cort${Date.now()}${Math.random().toString(36).slice(2, 8)}@exemplo.com`;
	const { body } = await request(app)
		.post("/auth/register")
		.send({ name: "Teste", email, password: "senha1234" })
		.expect(201);

	return { token: body.token, id: body.user.id };
}

/**
 * Finge que a conta nasceu antes do paywall existir.
 *
 * Pelo driver cru, e nao pelo Mongoose: com `timestamps: true` o `createdAt`
 * nasce `immutable`, e um `updateOne` do model descarta a alteracao EM
 * SILENCIO — o teste passaria a medir outra coisa sem avisar.
 */
async function envelhecer(id, dias) {
	await User.collection.updateOne(
		{ _id: new mongoose.Types.ObjectId(String(id)) },
		{ $set: { createdAt: new Date(Date.now() - dias * DIAS) } }
	);
}

const abrir = (rota, token) => request(app).get(rota).set("Authorization", `Bearer ${token}`);

describe("cortesia para quem é anterior ao paywall", () => {
	it("quem já usava o app continua entrando no recurso pago", async () => {
		const { token, id } = await criarConta();
		await envelhecer(id, 30);

		await abrir(UM_RECURSO_PAGO, token).expect(200);
	});

	it("quem chegou depois do paywall é cobrado normalmente", async () => {
		const { token } = await criarConta();

		await abrir(UM_RECURSO_PAGO, token).expect(402);
	});

	/**
	 * A cortesia NÃO é uma assinatura. Se ela entrasse por `hasPaidAccess`, a
	 * tela de planos anunciaria "Pro ativo até" sem data, e o app acharia que
	 * recebeu um dinheiro que nunca entrou.
	 */
	it("cortesia não finge ser assinatura paga", async () => {
		const { token, id } = await criarConta();
		await envelhecer(id, 30);

		const { body } = await abrir("/subscriptions/me", token).expect(200);

		expect(body.hasPaidAccess).toBe(false);
		expect(body.plan).toBe("free");
		expect(body.grandfatheredUntil).not.toBeNull();
	});

	it("a cortesia termina 60 dias depois do início do paywall", async () => {
		const { token, id } = await criarConta();
		await envelhecer(id, 30);

		const { body } = await abrir("/subscriptions/me", token).expect(200);

		const esperado = new Date(INICIO_DO_PAYWALL);
		esperado.setUTCDate(esperado.getUTCDate() + 60);

		expect(new Date(body.grandfatheredUntil).toISOString()).toBe(esperado.toISOString());
	});

	it("passado o prazo, a cortesia acaba", async () => {
		const { id } = await criarConta();
		await envelhecer(id, 30);

		const user = await User.findById(id);
		const depoisDoPrazo = new Date(Date.now() + 90 * DIAS);

		expect(user.mayUsePaidFeatures()).toBe(true);
		expect(user.mayUsePaidFeatures(depoisDoPrazo)).toBe(false);
	});

	it("recurso grátis nunca depende da cortesia", async () => {
		const { token } = await criarConta();

		await abrir("/transactions", token).expect(200);
	});
});
