const User = require("../models/User");
const WebhookEvent = require("../models/WebhookEvent");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const asaas = require("../services/asaas");
const { PRO } = require("../config/plans");
const { asaasWebhookToken } = require("../config/env");
const { reportServerError } = require("../config/monitoring");

/**
 * Assinatura (ROADMAP 2.2).
 *
 * Quem decide acesso é `user.hasPaidAccess()`, no modelo. Aqui só se move o
 * estado: criar a assinatura no provedor, e reagir ao que ele avisa.
 *
 * A validade NUNCA é concedida na criação. Pix não é cartão: a assinatura
 * nasce com uma cobrança em aberto, e o dinheiro pode nunca chegar. Quem
 * libera o acesso é o webhook de pagamento confirmado — este controller só
 * guarda os ids e devolve o link de cobrança.
 */

/** Quantos dias de acesso cada pagamento confirmado concede. */
const DAYS_PER_CYCLE = 31;

const addDays = (date, days) => new Date(date.getTime() + days * 24 * 60 * 60 * 1000);

/** Estado da assinatura de quem está logado, para a tela de planos. */
const getMySubscription = asyncHandler(async (req, res) => {
	const user = await User.findById(req.userId).select("subscription");

	if (!user) throw AppError.unauthorized("Token inválido");

	return res.json({
		plan: user.subscription?.plan ?? "free",
		status: user.subscription?.status ?? "none",
		validUntil: user.subscription?.validUntil ?? null,
		hasPaidAccess: user.hasPaidAccess(),
		catalog: PRO,
	});
});

/**
 * Cria a assinatura no Asaas e devolve a cobrança para pagamento.
 *
 * O CPF é exigido pela API do provedor, não por nós: sem ele não existe
 * cliente, e sem cliente não existe cobrança.
 */
const subscribe = asyncHandler(async (req, res) => {
	const { cpfCnpj } = req.body;

	const user = await User.findById(req.userId);
	if (!user) throw AppError.unauthorized("Token inválido");

	if (user.hasPaidAccess() && user.subscription?.subscriptionId) {
		throw AppError.conflict("Você já tem uma assinatura ativa.");
	}

	// Reaproveita o cliente: a API aceita duplicados sem reclamar, e duplicar
	// espalharia o histórico de cobrança da mesma pessoa em dois cadastros.
	let customerId = user.subscription?.customerId;

	if (!customerId) {
		const customer = await asaas.createCustomer({
			name: user.name,
			email: user.email,
			cpfCnpj,
			userId: user._id,
		});
		customerId = customer.id;
	}

	const subscription = await asaas.createSubscription({
		customerId,
		plan: PRO,
		// Primeira cobrança para hoje: o Pix é à vista, não há o que postergar.
		firstDueDate: new Date(),
		userId: user._id,
	});

	user.subscription.customerId = customerId;
	user.subscription.subscriptionId = subscription.id;
	user.subscription.plan = PRO.id;
	/**
	 * `past_due` e não `active`: a cobrança existe e ainda não foi paga. Não
	 * há `validUntil`, então `hasPaidAccess()` continua falso — o acesso só
	 * abre quando o dinheiro entra.
	 */
	user.subscription.status = "past_due";

	await user.save();

	return res.status(201).json({
		subscriptionId: subscription.id,
		/** URL da fatura no Asaas, onde o Pix é exibido. */
		invoiceUrl: subscription.invoiceUrl ?? null,
		status: user.subscription.status,
	});
});

/**
 * Cancela a recorrência.
 *
 * A validade em curso é preservada de propósito: quem pagou o mês tem o mês,
 * mesmo cancelando no dia 2. É o que `hasPaidAccess()` já garante ao olhar
 * `validUntil` em vez do status.
 */
const cancelMySubscription = asyncHandler(async (req, res) => {
	const user = await User.findById(req.userId);
	if (!user) throw AppError.unauthorized("Token inválido");

	const subscriptionId = user.subscription?.subscriptionId;
	if (!subscriptionId) throw AppError.notFound("Você não tem assinatura para cancelar.");

	await asaas.cancelSubscription(subscriptionId);

	user.subscription.status = "canceled";
	user.subscription.subscriptionId = null;
	await user.save();

	return res.json({
		status: "canceled",
		validUntil: user.subscription.validUntil,
		message: user.hasPaidAccess()
			? "Assinatura cancelada. Seu acesso continua até o fim do período já pago."
			: "Assinatura cancelada.",
	});
});

/** Eventos que liberam ou estendem acesso. */
const PAID_EVENTS = new Set(["PAYMENT_CONFIRMED", "PAYMENT_RECEIVED"]);

/**
 * Aplica o efeito do evento no usuário dono da assinatura.
 *
 * Separado do handler HTTP porque o handler tem uma obrigação só — responder
 * 200 — e esta função tem outra: mexer no estado. Juntar as duas foi o que
 * criou a classe de bug que o `processed` existe para consertar.
 */
async function applyEvent(event, body) {
	const subscriptionId = body.payment?.subscription ?? body.subscription?.id;
	if (!subscriptionId) return;

	const user = await User.findOne({ "subscription.subscriptionId": subscriptionId });
	if (!user) return;

	if (PAID_EVENTS.has(event)) {
		/**
		 * Estende a partir do fim vigente, não de hoje: quem paga adiantado não
		 * perde os dias que ainda tinha. Se já venceu, conta de hoje.
		 */
		const now = new Date();
		const base =
			user.subscription.validUntil && user.subscription.validUntil > now
				? user.subscription.validUntil
				: now;

		user.subscription.status = "active";
		user.subscription.plan = PRO.id;
		user.subscription.validUntil = addDays(base, DAYS_PER_CYCLE);
		await user.save();
		return;
	}

	if (event === "PAYMENT_OVERDUE") {
		// Não mexe em `validUntil`: o período já pago continua valendo. O status
		// serve para a interface avisar que a renovação falhou.
		user.subscription.status = "past_due";
		await user.save();
		return;
	}

	if (event === "SUBSCRIPTION_DELETED" || event === "SUBSCRIPTION_INACTIVATED") {
		user.subscription.status = "canceled";
		user.subscription.subscriptionId = null;
		await user.save();
	}
}

/**
 * Webhook do Asaas.
 *
 * Três exigências do provedor moldam este handler:
 *
 *   1. Só HTTP 200 conta como entrega. Qualquer outro código é falha, e 15
 *      falhas seguidas PAUSAM a fila inteira da conta — nenhum evento novo
 *      chega até alguém destravar no painel. Por isso erro de processamento
 *      ainda responde 200, com o evento guardado para reprocessar.
 *   2. Entrega *at least once*: o mesmo evento chega repetido. A unicidade do
 *      `_id` em `WebhookEvent` é o que impede aplicar duas vezes.
 *   3. A autenticidade vem do header `asaas-access-token`, que só quem
 *      configurou o webhook conhece.
 */
const handleAsaasWebhook = asyncHandler(async (req, res) => {
	// Sem token configurado o endpoint fica fechado: ele muda assinatura, e um
	// endpoint assim aberto à internet é convite para fraude.
	if (!asaasWebhookToken || req.get("asaas-access-token") !== asaasWebhookToken) {
		throw AppError.unauthorized("Webhook não autenticado");
	}

	const body = req.body ?? {};
	const { id, event } = body;

	if (!id || !event) throw AppError.badRequest("Evento sem id ou sem tipo");

	try {
		await WebhookEvent.create({ _id: id, event, payload: body });
	} catch (error) {
		// E11000 = já recebido. É o caminho normal da reentrega, não um erro.
		if (error?.code === 11000) return res.status(200).json({ received: true, duplicate: true });
		throw error;
	}

	try {
		await applyEvent(event, body);
		await WebhookEvent.updateOne({ _id: id }, { $set: { processed: true } });
	} catch (error) {
		// Guardado e não aplicado: responder 200 preserva a fila, e o registro
		// com `processed: false` é a fila de reparo.
		await WebhookEvent.updateOne({ _id: id }, { $set: { error: error.message } });
		reportServerError(error, req);
	}

	return res.status(200).json({ received: true });
});

module.exports = {
	getMySubscription,
	subscribe,
	cancelMySubscription,
	handleAsaasWebhook,
};
