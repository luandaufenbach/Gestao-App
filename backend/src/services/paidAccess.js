const User = require("../models/User");
const { paywallEnabled } = require("../config/env");
const { cycleForPurchase } = require("../utils/invoiceCycle");

/**
 * Acesso pago consultado DENTRO do controller (ROADMAP 2.3).
 *
 * O `requirePaidPlan` resolve o caso simples: a rota inteira é paga ou não é.
 * A fatura não é assim. A do ciclo atual e as passadas são grátis — ler o
 * próprio histórico nunca entra no paywall —, e só as de ciclo FUTURO são
 * pagas. A regra é por item, então não cabe num middleware de rota.
 */

/** `true` quando o paywall está desligado ou o usuário tem plano em dia. */
async function hasPaidAccess(userId) {
	if (!paywallEnabled) return true;

	const user = await User.findById(userId).select("subscription");
	return Boolean(user?.hasPaidAccess());
}

/**
 * O ciclo que está correndo agora neste cartão.
 *
 * Sai do `cycleForPurchase`, e não de `AAAA-MM` de hoje, porque a fatura é
 * nomeada pelo mês do VENCIMENTO: num cartão que fecha dia 01 e vence dia 05,
 * estamos em novembro mas o ciclo corrente é o de dezembro.
 */
function currentCycleOf(card, now = new Date()) {
	return cycleForPurchase(now, card).cycle;
}

/** Chave "AAAA-MM" ordena como string, então comparar texto basta. */
function isFutureCycle(card, cycle, now = new Date()) {
	return String(cycle) > currentCycleOf(card, now);
}

module.exports = { hasPaidAccess, currentCycleOf, isFutureCycle };
