import { ref, computed } from "vue";
/**
 * Imports nomeados, não `import * as api` — ver a razão em stores/bankCards.js.
 *
 * `login` e `register` vêm com apelido porque o `useAuth()` abaixo declara
 * funções com esses mesmos nomes. Sem o apelido, a função local sombrearia o
 * import e `login(credentials)` chamaria a si mesma até estourar a pilha.
 */
import {
	getMe,
	login as loginRequest,
	register as registerRequest,
	logout as logoutRequest,
} from "../services/api";
import { tokenStorage, refreshStorage, setUnauthorizedHandler } from "../services/http";
import { identifyUser, resetAnalytics, trackEvent } from "../services/analytics";
import { useCategories } from "./categories";
import { useBankCards } from "./bankCards";
import { useSubscription } from "./subscription";

/**
 * Store de autenticação.
 *
 * O estado vive no módulo (fora da função), não dentro dela. Isso o torna um
 * singleton: todo componente que importar `useAuth` enxerga a MESMA sessão.
 * Ver stores/categories.js para o problema que isso resolve (A6).
 */
const user = ref(null);
const token = ref(tokenStorage.get());
const loading = ref(false);
const initialized = ref(false);

const isAuthenticated = computed(() => Boolean(token.value));

function setSession(response) {
	token.value = response.token;
	user.value = response.user;
	tokenStorage.set(response.token);
	// A sessão renovável: é ela que segura o login entre as renovações do
	// token de acesso, que agora vence em minutos.
	refreshStorage.set(response.refreshToken);

	/**
	 * Só o id. Cadastro e primeira transação acontecem em sessões diferentes,
	 * e sem isto os dois passos do funil não se ligam à mesma pessoa.
	 *
	 * É `id`, não `_id`: o `toPublicJSON` do User renomeia o campo antes de
	 * mandar para o cliente. Com `_id` isto virava `undefined` em silêncio e o
	 * funil contava todo mundo como anônimo.
	 */
	identifyUser(response.user?.id);
}

/**
 * Apaga a sessão SÓ deste navegador.
 *
 * É o caminho do 401: ali a sessão já morreu no servidor, e tentar revogá-la
 * de novo seria uma chamada inútil — pior, uma chamada que pode falhar e
 * atrasar a volta para o login.
 */
function clearSession() {
	token.value = null;
	user.value = null;
	tokenStorage.clear();
	refreshStorage.clear();

	/**
	 * As duas stores já tinham um reset() escrito para isto, mas ninguém o
	 * chamava. Como elas são singletons de módulo, o cache sobrevivia ao
	 * logout: entrar com outra conta na mesma aba mostrava as categorias e os
	 * cartões do usuário anterior até a primeira recarga da página.
	 */
	useCategories().reset();
	useBankCards().reset();
	useSubscription().reset();

	// Sem isto a próxima conta na mesma aba herdaria a identificação anterior.
	resetAnalytics();
}

/**
 * Sair da conta de verdade (ROADMAP 0.9).
 *
 * A revogação vem PRIMEIRO e é aguardada: é o que encerra a sessão no
 * servidor. Se falhar — sem rede, por exemplo —, a sessão local cai do mesmo
 * jeito, porque negar a saída a quem pediu para sair é pior do que uma sessão
 * que ainda expira sozinha pelo TTL.
 */
async function logout() {
	const refreshToken = refreshStorage.get();

	if (refreshToken) {
		try {
			await logoutRequest(refreshToken);
		} catch {
			// Ver acima: a saída local acontece de qualquer forma.
		}
	}

	clearSession();
}

/**
 * Qualquer 401 vindo da API derruba a sessão automaticamente.
 * Cobre o caso do token expirado enquanto a aba estava aberta.
 */
setUnauthorizedHandler(clearSession);

/**
 * Revalida o token guardado no localStorage ao abrir a aplicação.
 *
 * Sem isso, um token expirado deixaria a interface carregar como se estivesse
 * logada e só falharia depois, requisição por requisição.
 */
async function restoreSession() {
	if (initialized.value) return;

	if (!token.value) {
		initialized.value = true;
		return;
	}

	try {
		user.value = await getMe();

		/**
		 * Também aqui, e não só no `setSession`: quem volta com o token ainda
		 * válido não passa por login nenhum. Sem esta linha, o funil perderia
		 * exatamente o caso que ele existe para medir — cadastrou num dia,
		 * lançou a primeira transação no outro.
		 */
		identifyUser(user.value?.id);
	} catch {
		// setUnauthorizedHandler já limpou a sessão em caso de 401. Aqui é a
		// limpeza local: o token não vale mais, não há o que revogar.
		clearSession();
	} finally {
		initialized.value = true;
	}
}

export function useAuth() {
	async function login(credentials) {
		loading.value = true;
		try {
			setSession(await loginRequest(credentials));
		} finally {
			loading.value = false;
		}
	}

	async function register(payload) {
		loading.value = true;
		try {
			setSession(await registerRequest(payload));
			// Segundo passo do funil. Depois do setSession, para o evento já
			// sair ligado à pessoa que acabou de ser identificada.
			trackEvent("cadastro_concluido");
		} finally {
			loading.value = false;
		}
	}

	return {
		user,
		token,
		loading,
		initialized,
		isAuthenticated,
		login,
		register,
		logout,
		restoreSession,
	};
}
