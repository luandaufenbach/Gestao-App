const User = require("../models/User");
const AppError = require("../utils/AppError");
const { paywallEnabled } = require("../config/env");

/**
 * Paywall (ROADMAP 2.3).
 *
 * Grátis é o presente; pago é o futuro e o passado. Lançar, categorizar,
 * cartões, metas e o dashboard do mês não passam por aqui — ver a tabela da
 * Fase 2 no ROADMAP.md.
 *
 * Nunca use este middleware em rota de leitura do próprio histórico, nem em
 * `/account`: exportar e excluir são direito do titular pela LGPD (artigo 18),
 * e cobrar por eles é ilegal, não só feio.
 *
 * Com `PAYWALL_ENABLED` desligado, deixa tudo passar. É o padrão, e continua
 * sendo até existir forma de pagar (2.2) e a interface saber tratar o 402 —
 * ligar antes disso só transformaria duas telas em erro sem saída.
 */
async function requirePaidPlan(req, res, next) {
	if (!paywallEnabled) return next();

	let user;

	try {
		user = await User.findById(req.userId).select("subscription");
	} catch (error) {
		// Banco fora do ar é problema do servidor, não da assinatura: deixa o
		// errorHandler registrar e devolver 500, em vez de cobrar de quem pagou.
		return next(error);
	}

	if (!user) {
		// Mesma mensagem do `authenticate`, pelo mesmo motivo.
		return next(AppError.unauthorized("Token inválido"));
	}

	if (user.hasPaidAccess()) return next();

	return next(
		AppError.paymentRequired(
			"Este recurso faz parte do plano pago. Seus lançamentos, categorias, " +
				"cartões e metas continuam liberados, e nada do que você já registrou " +
				"deixa de aparecer."
		)
	);
}

module.exports = requirePaidPlan;
