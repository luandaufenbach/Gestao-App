import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { app, request, createUser } from "./helpers.js";
import mongoose from "mongoose";

/**
 * Assinatura por Pix (ROADMAP 2.2).
 *
 * O banco é real, como no resto da suíte. O que é dublado é só o `fetch`: o
 * Asaas é serviço de terceiro, e teste que depende da rede de outra empresa
 * falha por motivo que não é o nosso.
 *
 * A regra que estes testes protegem: **criar assinatura não dá acesso**. Pix
 * não é cartão — a cobrança nasce em aberto e o dinheiro pode nunca chegar.
 * Quem libera é o webhook de pagamento.
 */

let user;

/**
 * Os models vêm do registro do Mongoose, não de um import do arquivo.
 * Importar src/models/User.js aqui criaria uma segunda instância do módulo
 * ao lado da que o app já carregou por CommonJS, e o schema seria compilado
 * duas vezes (OverwriteModelError).
 */
const User = mongoose.model("User");
const WebhookEvent = mongoose.model("WebhookEvent");

/** Respostas do Asaas, no formato que a documentação descreve. */
const CUSTOMER = { id: "cus_000001", name: "Teste" };
const SUBSCRIPTION = {
	id: "sub_000001",
	invoiceUrl: "https://sandbox.asaas.com/i/abc123",
	status: "ACTIVE",
};

function mockAsaas() {
	return vi.spyOn(globalThis, "fetch").mockImplementation(async (url, options) => {
		const path = String(url);
		const ok = (data) => new Response(JSON.stringify(data), { status: 200 });

		if (path.endsWith("/customers") && options?.method === "POST") return ok(CUSTOMER);
		if (path.endsWith("/subscriptions") && options?.method === "POST") return ok(SUBSCRIPTION);
		if (path.includes("/subscriptions/") && options?.method === "DELETE") {
			return ok({ deleted: true, id: "sub_000001" });
		}

		throw new Error(`fetch não esperado no teste: ${options?.method} ${path}`);
	});
}

beforeEach(async () => {
	user = await createUser();
});

afterEach(() => {
	vi.restoreAllMocks();
});

const assinar = (body = { cpfCnpj: "12345678909" }) =>
	user.auth(request(app).post("/subscriptions")).send(body);

const minhaAssinatura = () => user.auth(request(app).get("/subscriptions/me")).expect(200);

const WEBHOOK_TOKEN = process.env.ASAAS_WEBHOOK_TOKEN;

const notificar = (body, token = WEBHOOK_TOKEN) =>
	request(app).post("/webhooks/asaas").set("asaas-access-token", token).send(body);

const pagamentoRecebido = (id = "evt_001") => ({
	id,
	event: "PAYMENT_RECEIVED",
	payment: { id: "pay_001", subscription: "sub_000001", value: 14.9 },
});

describe("criar assinatura", () => {
	it("guarda os ids do provedor e devolve a cobrança", async () => {
		const fetchMock = mockAsaas();

		const resposta = await assinar().expect(201);

		expect(resposta.body.subscriptionId).toBe("sub_000001");
		expect(resposta.body.invoiceUrl).toBe(SUBSCRIPTION.invoiceUrl);

		const gravado = await User.findById(user.user.id ?? user.user._id);
		expect(gravado.subscription.customerId).toBe("cus_000001");
		expect(gravado.subscription.subscriptionId).toBe("sub_000001");
		expect(fetchMock).toHaveBeenCalledTimes(2);
	});

	it("NÃO libera acesso pago antes do pagamento", async () => {
		mockAsaas();
		await assinar().expect(201);

		const estado = await minhaAssinatura();

		expect(estado.body.hasPaidAccess).toBe(false);
		expect(estado.body.validUntil).toBeNull();
		expect(estado.body.status).toBe("past_due");
	});

	it("envia o valor em reais, não em centavos", async () => {
		const fetchMock = mockAsaas();
		await assinar().expect(201);

		const chamada = fetchMock.mock.calls.find(([url]) => String(url).endsWith("/subscriptions"));
		const enviado = JSON.parse(chamada[1].body);

		expect(enviado.value).toBe(14.9);
		expect(enviado.billingType).toBe("PIX");
		expect(enviado.cycle).toBe("MONTHLY");
		expect(enviado.nextDueDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
	});

	it("aceita CPF com máscara e recusa documento de tamanho inválido", async () => {
		mockAsaas();

		await assinar({ cpfCnpj: "123.456.789-09" }).expect(201);
		await assinar({ cpfCnpj: "123" }).expect(400);
	});

	it("não guarda o CPF na nossa base", async () => {
		mockAsaas();
		await assinar().expect(201);

		const gravado = await User.findById(user.user.id ?? user.user._id).lean();
		expect(JSON.stringify(gravado)).not.toContain("12345678909");
	});
});

describe("webhook", () => {
	beforeEach(async () => {
		mockAsaas();
		await assinar().expect(201);
	});

	it("pagamento recebido libera o acesso", async () => {
		await notificar(pagamentoRecebido()).expect(200);

		const estado = await minhaAssinatura();
		expect(estado.body.hasPaidAccess).toBe(true);
		expect(estado.body.status).toBe("active");
		expect(new Date(estado.body.validUntil).getTime()).toBeGreaterThan(Date.now());
	});

	it("o mesmo evento duas vezes não estende o acesso duas vezes", async () => {
		await notificar(pagamentoRecebido("evt_dup")).expect(200);
		const primeira = await minhaAssinatura();

		const repetida = await notificar(pagamentoRecebido("evt_dup")).expect(200);

		expect(repetida.body.duplicate).toBe(true);
		const segunda = await minhaAssinatura();
		expect(segunda.body.validUntil).toBe(primeira.body.validUntil);
	});

	it("pagamento atrasado não derruba o período já pago", async () => {
		await notificar(pagamentoRecebido("evt_pago")).expect(200);
		const pago = await minhaAssinatura();

		await notificar({
			id: "evt_atraso",
			event: "PAYMENT_OVERDUE",
			payment: { id: "pay_002", subscription: "sub_000001" },
		}).expect(200);

		const depois = await minhaAssinatura();
		expect(depois.body.status).toBe("past_due");
		// O que foi pago continua valendo: só a renovação falhou.
		expect(depois.body.validUntil).toBe(pago.body.validUntil);
		expect(depois.body.hasPaidAccess).toBe(true);
	});

	it("recusa quem não traz o token do provedor", async () => {
		await notificar(pagamentoRecebido("evt_x"), "token-errado").expect(401);
		await request(app).post("/webhooks/asaas").send(pagamentoRecebido("evt_y")).expect(401);

		const estado = await minhaAssinatura();
		expect(estado.body.hasPaidAccess).toBe(false);
	});

	it("guarda o evento recebido, para reprocessar se a regra falhar", async () => {
		await notificar(pagamentoRecebido("evt_guardado")).expect(200);

		const gravado = await WebhookEvent.findById("evt_guardado").lean();
		expect(gravado.event).toBe("PAYMENT_RECEIVED");
		expect(gravado.processed).toBe(true);
	});

	it("evento de assinatura desconhecida não derruba o webhook", async () => {
		await notificar({
			id: "evt_outro",
			event: "PAYMENT_RECEIVED",
			payment: { id: "pay_003", subscription: "sub_de_outra_conta" },
		}).expect(200);
	});
});

describe("cancelamento", () => {
	it("mantém o acesso até o fim do período já pago", async () => {
		mockAsaas();
		await assinar().expect(201);
		await notificar(pagamentoRecebido("evt_cancel")).expect(200);

		const resposta = await user.auth(request(app).delete("/subscriptions")).expect(200);

		expect(resposta.body.status).toBe("canceled");

		const estado = await minhaAssinatura();
		expect(estado.body.status).toBe("canceled");
		// Pagou o mês, usa o mês.
		expect(estado.body.hasPaidAccess).toBe(true);
	});

	it("recusa cancelar quem não assinou", async () => {
		await user.auth(request(app).delete("/subscriptions")).expect(404);
	});
});
