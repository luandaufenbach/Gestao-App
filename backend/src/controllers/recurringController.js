const mongoose = require("mongoose");

const asyncHandler = require("../utils/asyncHandler");
const { detectRecurringCharges } = require("../services/recurringService");

const toObjectId = (id) => new mongoose.Types.ObjectId(String(id));

/**
 * Assinaturas recorrentes detectadas no histórico (ROADMAP 3.4).
 *
 * Sem parâmetro: a janela é fixa em 12 meses e a referência é hoje. A pergunta
 * é "o que está me cobrando todo mês", e ela não tem recorte de tempo para o
 * usuário escolher.
 */
const getRecurringCharges = asyncHandler(async (req, res) => {
	return res.json(await detectRecurringCharges(toObjectId(req.userId)));
});

module.exports = { getRecurringCharges };
