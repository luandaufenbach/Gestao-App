/**
 * Catálogo de planos (ROADMAP 2.2).
 *
 * Fonte única do preço. Está em código, e não em variável de ambiente, porque
 * mudar preço é decisão de produto que merece commit e revisão — não um campo
 * que alguém altera no painel às três da manhã sem deixar rastro.
 *
 * O valor fica em centavos, como todo dinheiro no projeto. A conversão para o
 * número decimal que o Asaas espera acontece só na borda, em `services/asaas.js`.
 *
 * ── Por que existe um plano anual ─────────────────────────────────────
 *
 * Não é desconto por generosidade: é o que torna tráfego pago viável. No
 * mensal, um custo de aquisição de R$ 100 leva meses de assinatura para se
 * pagar, e só se a pessoa não cancelar antes. No anual, o dinheiro entra
 * inteiro no primeiro dia e a conta fecha na hora. O mensal existe sobretudo
 * como âncora: é ele que faz o anual parecer — e ser — o bom negócio.
 */

/** O que o Pro entrega, igual nos dois ciclos. Só o preço e o prazo mudam. */
const FEATURES = "Projeção de caixa, relatórios de 3 a 12 meses e faturas futuras";

const PLANS = {
	pro_mensal: {
		id: "pro_mensal",
		name: "Mensal",
		priceInCents: 2490,
		/** Ciclo no vocabulário do Asaas. */
		cycle: "MONTHLY",
		/**
		 * Dias de acesso que cada pagamento confirmado concede.
		 *
		 * 31 e não 30: o mês mais longo precisa caber. Conceder menos dias do
		 * que o ciclo cobra faria o acesso piscar entre o fim de um período e a
		 * confirmação do pagamento seguinte — o cliente pagou e viu a porta
		 * fechada, que é o pior minuto possível de uma assinatura.
		 */
		daysPerCycle: 31,
		description: FEATURES,
	},

	pro_anual: {
		id: "pro_anual",
		name: "Anual",
		priceInCents: 17900,
		cycle: "YEARLY",
		/** 366 pelo mesmo motivo do 31: ano bissexto precisa caber. */
		daysPerCycle: 366,
		description: FEATURES,
	},
};

/** Sugerido na tela. É o anual porque é o que sustenta a aquisição paga. */
const DEFAULT_PLAN_ID = PLANS.pro_anual.id;

/**
 * Valor guardado em `user.subscription.plan` antes de existir mais de um
 * ciclo. Nenhuma assinatura chegou a ser cobrada com ele — o paywall nunca
 * esteve ligado —, mas continua aceito para que um documento antigo não vire
 * erro de validação.
 */
const LEGACY_PLAN_ID = "pro";

/** O plano pedido, ou `null` se o id não existe. Nunca lança. */
const findPlan = (id) => PLANS[id] ?? null;

/** Todo id que `user.subscription.plan` aceita, incluindo o gratuito. */
const PLAN_IDS = ["free", LEGACY_PLAN_ID, ...Object.keys(PLANS)];

/**
 * Quantos dias conceder a quem já tem um plano gravado.
 *
 * O webhook de pagamento não sabe qual ciclo foi contratado — ele sabe quem
 * pagou. É aqui que o id guardado vira prazo. Um plano desconhecido ou o
 * legado caem no mensal, que é o menor: errar para menos renova cedo demais,
 * errar para mais daria acesso que ninguém comprou.
 */
const daysForPlanId = (id) => findPlan(id)?.daysPerCycle ?? PLANS.pro_mensal.daysPerCycle;

module.exports = {
	PLANS,
	PLAN_IDS,
	DEFAULT_PLAN_ID,
	LEGACY_PLAN_ID,
	findPlan,
	daysForPlanId,
};
