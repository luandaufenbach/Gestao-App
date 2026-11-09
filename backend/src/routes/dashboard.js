const express = require("express");

const { z } = require("zod");

const {
	getMonthlyBalance,
	getSavedMoney,
	getTotalSavedMoney,
	getCategoryBreakdown,
	getProjection,
} = require("../controllers/dashboardController");
const { monthQuery } = require("../validators/common");
const validate = require("../middlewares/validate");
const requirePaidPlan = require("../middlewares/requirePaidPlan");
const { getRecurringCharges } = require("../controllers/recurringController");

const router = express.Router();

// Todas as rotas do dashboard aceitam ?year=&month= e caem no mês atual (UTC)
// quando os parâmetros são omitidos.
const withMonth = validate({ query: monthQuery });

router.get("/monthly-balance", withMonth, getMonthlyBalance);
router.get("/saved-money", withMonth, getSavedMoney);
router.get("/saved-money-total", withMonth, getTotalSavedMoney);
router.get("/category-breakdown", withMonth, getCategoryBreakdown);

/**
 * A projeção não aceita year/month: ela sempre começa no mês corrente, porque
 * "o que já está comprometido" só faz sentido para o futuro. O único parâmetro
 * é o tamanho da janela, com o mesmo teto de 24 das faturas.
 */
const projectionQuery = z.object({
	months: z.coerce.number().int().min(1).max(24).optional(),
});

// Recurso pago: ver a tabela da Fase 2 no ROADMAP.md. O resto deste router
// é o dashboard do mês, que fica grátis.
router.get(
	"/projection",
	requirePaidPlan,
	validate({ query: projectionQuery }),
	getProjection
);

/**
 * Assinaturas recorrentes (ROADMAP 3.4). Fica no grátis: a tabela da Fase 2
 * cobra pela projeção e pelos relatórios, e esta é uma leitura do que já
 * aconteceu, não do futuro.
 */
router.get("/recurring", getRecurringCharges);

module.exports = router;
