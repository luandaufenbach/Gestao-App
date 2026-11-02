/**
 * Cliente HTTP central da aplicação.
 *
 * BUG CORRIGIDO (A1): a versão anterior de api.js fazia, em todas as 18
 * funções, apenas `return response.json()` — sem nunca olhar o status HTTP.
 * Consequências reais disso:
 *   - um 400/500 virava um objeto {message} tratado como SUCESSO;
 *   - o catch dos composables nunca era acionado;
 *   - useTransactions.createNew fazia push() do objeto de erro na lista;
 *   - os modais precisavam da gambiarra `if (res?.message && !res?._id)`.
 *
 * Aqui, qualquer status fora da faixa 2xx vira um ApiError lançado, e o
 * try/catch dos chamadores passa a funcionar como sempre se esperou.
 */

// BUG CORRIGIDO (A8): a URL era a constante "http://localhost:3000", o que
// tornava impossível gerar build para qualquer outro ambiente.
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const TOKEN_STORAGE_KEY = "gf:token";

export class ApiError extends Error {
	constructor(status, message, details) {
		super(message);
		this.name = "ApiError";
		this.status = status;
		this.details = details;
	}

	/** Mensagem pronta para exibir, já incluindo os detalhes de validação. */
	get displayMessage() {
		if (Array.isArray(this.details) && this.details.length > 0) {
			return this.details.map((detail) => detail.message).join(". ");
		}
		return this.message;
	}
}

// ── Token ─────────────────────────────────────────────────────
export const tokenStorage = {
	get: () => localStorage.getItem(TOKEN_STORAGE_KEY),
	set: (token) => localStorage.setItem(TOKEN_STORAGE_KEY, token),
	clear: () => localStorage.removeItem(TOKEN_STORAGE_KEY),
};

/**
 * Callback disparado quando o servidor devolve 401.
 *
 * Permite que o store de auth derrube a sessão e redirecione para o login
 * sem que o http.js precise conhecer o router (evita import circular).
 */
let onUnauthorized = null;
export function setUnauthorizedHandler(handler) {
	onUnauthorized = handler;
}

/** Monta a query string ignorando valores nulos/indefinidos. */
function buildQuery(params = {}) {
	const search = new URLSearchParams();

	for (const [key, value] of Object.entries(params)) {
		if (value !== undefined && value !== null && value !== "") {
			search.append(key, String(value));
		}
	}

	const query = search.toString();
	return query ? `?${query}` : "";
}

/**
 * Nome do arquivo anunciado no `Content-Disposition`.
 *
 * Só funciona entre origens diferentes (5173 -> 3000, ou front e API em
 * domínios distintos) quando a API devolve
 * `Access-Control-Expose-Headers: Content-Disposition`. Sem isso o navegador
 * esconde o cabeçalho e `header` chega nulo — daí o retorno vazio, e quem
 * chamou usa o próprio nome de reserva em vez de baixar um "download" sem
 * extensão.
 */
function filenameFromDisposition(header) {
	if (!header) return "";

	// Cobre os três formatos usuais: filename="x.json", filename=x.json e
	// filename*=UTF-8''x.json.
	const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(header);
	if (!match) return "";

	try {
		return decodeURIComponent(match[1].trim());
	} catch {
		// Nome com % que não é escape válido: vale mais cru do que nada.
		return match[1].trim();
	}
}

/**
 * @param {object} [options]
 * @param {"json"|"blob"} [options.responseType] - `"blob"` para resposta que é
 *   ARQUIVO, não dado de tela: devolve `{ blob, filename }` em vez do JSON
 *   decodificado. O resto do caminho (token, 401, ApiError) continua idêntico,
 *   então nenhum chamador precisa repetir fetch na mão.
 * @param {boolean} [options.logoutOn401] - `false` desliga o handler global de
 *   401 SÓ nesta chamada. Serve para a rota em que 401 significa "senha
 *   errada", e não "sessão expirada": derrubar a sessão ali trocaria a
 *   mensagem de erro por um logout silencioso.
 */
async function request(
	method,
	path,
	{ body, params, auth = true, responseType = "json", logoutOn401 = true } = {}
) {
	const headers = {};

	if (body !== undefined) {
		headers["Content-Type"] = "application/json";
	}

	if (auth) {
		const token = tokenStorage.get();
		if (token) headers.Authorization = `Bearer ${token}`;
	}

	let response;
	try {
		response = await fetch(`${API_URL}${path}${buildQuery(params)}`, {
			method,
			headers,
			body: body !== undefined ? JSON.stringify(body) : undefined,
		});
	} catch (networkError) {
		// fetch só rejeita em falha de rede; agora isso é reportado de verdade,
		// em vez de virar um "undefined" silencioso mais adiante.
		throw new ApiError(0, "Não foi possível conectar ao servidor. Verifique sua conexão.", [
			{ message: networkError.message },
		]);
	}

	/**
	 * O erro é SEMPRE JSON, mesmo numa requisição de download: quem monta a
	 * resposta de falha é o errorHandler, não a rota. Por isso o corpo de erro é
	 * lido aqui, antes de qualquer tratamento de blob.
	 */
	if (!response.ok) {
		const errorPayload = await response.json().catch(() => null);

		if (response.status === 401 && auth && logoutOn401 && onUnauthorized) {
			onUnauthorized();
		}

		throw new ApiError(
			response.status,
			errorPayload?.message || `Erro ${response.status}`,
			errorPayload?.details
		);
	}

	if (responseType === "blob") {
		return {
			blob: await response.blob(),
			filename: filenameFromDisposition(response.headers.get("Content-Disposition")),
		};
	}

	// 204 e afins não têm corpo.
	return response.status === 204 ? null : await response.json().catch(() => null);
}

export const http = {
	get: (path, options) => request("GET", path, options),
	post: (path, body, options) => request("POST", path, { ...options, body }),
	patch: (path, body, options) => request("PATCH", path, { ...options, body }),
	delete: (path, options) => request("DELETE", path, options),
};

export { API_URL };
