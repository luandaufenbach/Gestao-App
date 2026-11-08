const express = require("express");

const { z } = require("zod");

const { getMonthlyReport, DEFAULT_MONTHS } = require("../controllers/reportController");
const validate = require("../middlewares/validate");

const router = express.Router();

/**
 * O relatório não aceita year/month: a janela termina SEMPRE no mês corrente,
 * porque a pergunta é "como foram os últimos meses". O único parâmetro é o
 * tamanho da janela.
 *
 * O teto é 12 e o piso é 3, que é o aceite do item 1.2 do roteiro. Abaixo de 3
 * não existe comparação que valha o nome de relatório — o dashboard já mostra
 * um mês —, e acima de 12 o gráfico fica ilegível no celular. Fora da faixa, o
 * `errorHandler` traduz o erro do Zod para 400.
 */
const reportQuery = z.object({
	months: z.coerce.number().int().min(3).max(12).default(DEFAULT_MONTHS),
});

router.get("/monthly", validate({ query: reportQuery }), getMonthlyReport);

module.exports = router;
