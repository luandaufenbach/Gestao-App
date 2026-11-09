/**
 * Analytics de funil (ROADMAP 0.5).
 *
 * A pergunta que isto responde é uma só: de 100 pessoas que chegam, quantas
 * criam conta e quantas lançam a primeira transação. Sem ela não dá para saber
 * se a verba de anúncio virou usuário ou virou nada.
 *
 * Sem `VITE_POSTHOG_KEY` tudo aqui é inerte: nenhuma chamada de rede, nenhum
 * identificador guardado, e o próprio `posthog-js` nunca é baixado. É o padrão
 * em desenvolvimento, e é o que impede o tráfego de teste de sujar o funil.
 *
 * O import é dinâmico de propósito: a biblioteca custa cerca de 124 kB
 * comprimidos, quase o triplo do resto do pacote principal. Carregada assim,
 * ela vira um pedaço à parte, buscado depois da tela aparecer e só por quem
 * tem a chave configurada.
 */

const key = import.meta.env.VITE_POSTHOG_KEY ?? "";
const host = import.meta.env.VITE_POSTHOG_HOST || "https://us.i.posthog.com";

/** A instância, depois que o carregamento terminar. Nulo enquanto não houver. */
let client = null;

/**
 * Tira a query string de qualquer URL antes de ela sair do navegador.
 *
 * MOTIVO, e não é teórico: `/reset-password?token=...` e
 * `/verify-email?token=...` carregam o token na própria URL. O `$pageview`
 * padrão do PostHog manda `window.location.href` inteiro, o que entregaria a
 * um terceiro um token válido para trocar a senha da conta. O mesmo vale para
 * o `$referrer`, que é a URL anterior.
 */
function stripQuery(url) {
	if (typeof url !== "string") return url;
	const corte = url.search(/[?#]/);
	return corte === -1 ? url : url.slice(0, corte);
}

function sanitize(properties) {
	for (const campo of ["$current_url", "$referrer", "$initial_current_url", "$initial_referrer"]) {
		if (properties[campo]) properties[campo] = stripQuery(properties[campo]);
	}
	return properties;
}

/**
 * Liga o analytics. Devolve `false` na hora quando não há chave configurada.
 *
 * As opções não são o padrão do PostHog, e cada desvio tem motivo:
 *
 * - `autocapture: false` — o padrão registra o texto e os atributos de tudo
 *   que o usuário clica. Num app de finanças isso capturaria descrição e valor
 *   de lançamento. É o ajuste mais importante deste arquivo.
 * - `disable_session_recording` — gravar a tela de quem mexe no próprio
 *   dinheiro é desproporcional para responder uma pergunta de funil.
 * - `capture_pageview: false` — quem avisa a troca de tela é o router, com a
 *   URL já sem query (ver `trackPage`).
 * - `persistence: "localStorage"` — sem cookie, então sem banner de cookie.
 * - `person_profiles: "identified_only"` — visitante anônimo não vira perfil;
 *   só quem cria conta.
 */
export async function initAnalytics() {
	if (!key) return false;

	const { default: posthog } = await import("posthog-js");

	posthog.init(key, {
		api_host: host,
		autocapture: false,
		disable_session_recording: true,
		capture_pageview: false,
		capture_pageleave: false,
		persistence: "localStorage",
		person_profiles: "identified_only",
		sanitize_properties: sanitize,
	});

	client = posthog;
	return true;
}

/** Troca de tela. Recebe o caminho da rota, nunca a URL com query. */
export function trackPage(path) {
	client?.capture("$pageview", { $current_url: window.location.origin + path });
}

/** Um passo do funil. As propriedades nunca carregam valor nem descrição. */
export function trackEvent(name, properties = {}) {
	client?.capture(name, properties);
}

/**
 * Liga os eventos a uma pessoa pelo id interno da conta.
 *
 * O id e nada mais: e-mail e nome ficam no nosso banco. Sem isto o funil não
 * fecha, porque cadastro e primeira transação acontecem em sessões diferentes.
 */
export function identifyUser(id) {
	if (!id) return;
	client?.identify(String(id));
}

/** Encerra a identificação no logout, para a próxima conta não herdar a anterior. */
export function resetAnalytics() {
	client?.reset();
}
