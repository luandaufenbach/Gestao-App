const Sentry = require("@sentry/node");
const { sentryDsn, nodeEnv } = require("./env");

/**
 * Monitoramento de erro em produção.
 *
 * MOTIVO: o `errorHandler` traduz tudo que não reconhece para 500 e escreve o
 * stack no `console.error`. No Render esse log vive na aba de logs e ninguém
 * olha — um 500 em produção só era descoberto quando o usuário reclamava, e aí
 * o log já tinha rolado para fora da janela. Aqui o mesmo erro vira uma
 * notificação com stack e com o id de quem o encontrou.
 *
 * Sem `SENTRY_DSN` tudo isto é inerte: nenhuma chamada de rede, nenhum efeito.
 * É o que mantém o desenvolvimento local e a suíte de testes sem dependência
 * externa, e o que evita que erro de teste vire alerta em produção.
 */

let active = false;

/**
 * Tira do evento o que não precisamos para depurar.
 *
 * O app guarda dado financeiro real. O `sendDefaultPii: false` já impede o
 * grosso, mas o corpo da requisição é o que mais dói vazar — é onde vão valor,
 * descrição e o cabeçalho `Authorization`. Removemos explicitamente em vez de
 * confiar no padrão do SDK, porque um padrão pode mudar entre versões maiores.
 *
 * Do usuário fica só o id: é o que permite responder "quem bateu nisso?" sem
 * copiar e-mail nem nome para fora do nosso banco.
 */
function scrub(event) {
	if (event.request) {
		delete event.request.data;
		delete event.request.headers;
		delete event.request.cookies;
		delete event.request.query_string;
	}

	if (event.user) {
		event.user = event.user.id ? { id: event.user.id } : undefined;
	}

	return event;
}

/**
 * Liga o monitoramento. Devolve `false` quando não há DSN configurado.
 *
 * Precisa ser chamado ANTES de o Express ser carregado: a instrumentação
 * automática do SDK envolve os módulos no momento em que eles são exigidos, e
 * quem chega depois fica de fora.
 *
 * `transport` existe para o teste poder observar o envelope real do SDK em
 * memória, sem rede e sem mock.
 */
function initMonitoring({ dsn = sentryDsn, transport } = {}) {
	if (!dsn) return false;

	Sentry.init({
		dsn,
		environment: nodeEnv,
		sendDefaultPii: false,
		// Monitoramento de erro, não de performance: traço custa cota e não é
		// o que o 0.4 do roteiro pede.
		tracesSampleRate: 0,
		beforeSend: scrub,
		...(transport ? { transport } : {}),
	});

	active = true;
	return true;
}

/**
 * Reporta um erro que virou 500. Devolve `false` se o monitoramento está
 * desligado, para o chamador não precisar saber se há DSN.
 *
 * Só o 500 passa por aqui. Um 400 de validação ou um 404 são respostas
 * previstas, e alertar sobre elas treinaria todo mundo a ignorar o alerta.
 */
function reportServerError(error, req) {
	if (!active) return false;

	Sentry.withScope((scope) => {
		if (req?.userId) scope.setUser({ id: String(req.userId) });

		scope.setContext("requisicao", {
			metodo: req?.method,
			rota: req?.originalUrl,
		});

		Sentry.captureException(error);
	});

	return true;
}

/**
 * Espera a fila de envio esvaziar.
 *
 * MOTIVO: o SDK envia em segundo plano. No SIGTERM de todo deploy o processo
 * morre antes do envio, e justamente o erro que derrubou a instância é o que
 * se perde.
 */
async function flushMonitoring(timeoutMs = 2000) {
	if (!active) return false;
	return Sentry.flush(timeoutMs);
}

module.exports = { initMonitoring, reportServerError, flushMonitoring };
