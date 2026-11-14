/**
 * Catálogo de planos (ROADMAP 2.2).
 *
 * Fonte única do preço. Está em código, e não em variável de ambiente, porque
 * mudar preço é decisão de produto que merece commit e revisão — não um campo
 * que alguém altera no painel às três da manhã sem deixar rastro.
 *
 * O valor fica em centavos, como todo dinheiro no projeto. A conversão para o
 * número decimal que o Asaas espera acontece só na borda, em `services/asaas.js`.
 */

const PLANS = {
	pro: {
		id: "pro",
		name: "Pro",
		priceInCents: 1490,
		/** Ciclo no vocabulário do Asaas. */
		cycle: "MONTHLY",
		description: "Projeção de caixa, relatórios de 3 a 12 meses e faturas futuras",
	},
};

/** O único plano cobrado hoje. Existe como constante para não espalhar "pro". */
const PRO = PLANS.pro;

module.exports = { PLANS, PRO };
