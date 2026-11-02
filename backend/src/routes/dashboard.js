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

router.get("/projection", validate({ query: projectionQuery }), getProjection);

module.exports = router;
