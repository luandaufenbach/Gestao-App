import { ref, computed } from "vue";
import * as api from "../services/api";
import { tokenStorage, setUnauthorizedHandler } from "../services/http";
import { identifyUser, resetAnalytics, trackEvent } from "../services/analytics";
import { useCategories } from "./categories";
import { useBankCards } from "./bankCards";

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

function logout() {
	token.value = null;
	user.value = null;
	tokenStorage.clear();

	/**
	 * As duas stores já tinham um reset() escrito para isto, mas ninguém o
	 * chamava. Como elas são singletons de módulo, o cache sobrevivia ao
	 * logout: entrar com outra conta na mesma aba mostrava as categorias e os
	 * cartões do usuário anterior até a primeira recarga da página.
	 */
	useCategories().reset();
	useBankCards().reset();

	// Sem isto a próxima conta na mesma aba herdaria a identificação anterior.
	resetAnalytics();
}

/**
 * Qualquer 401 vindo da API derruba a sessão automaticamente.
 * Cobre o caso do token expirado enquanto a aba estava aberta.
 */
setUnauthorizedHandler(logout);

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
		user.value = await api.getMe();

		/**
		 * Também aqui, e não só no `setSession`: quem volta com o token ainda
		 * válido não passa por login nenhum. Sem esta linha, o funil perderia
		 * exatamente o caso que ele existe para medir — cadastrou num dia,
		 * lançou a primeira transação no outro.
		 */
		identifyUser(user.value?.id);
	} catch {
		// setUnauthorizedHandler já limpou a sessão em caso de 401.
		logout();
	} finally {
		initialized.value = true;
	}
}

export function useAuth() {
	async function login(credentials) {
		loading.value = true;
		try {
			setSession(await api.login(credentials));
		} finally {
			loading.value = false;
		}
	}

	async function register(payload) {
		loading.value = true;
		try {
			setSession(await api.register(payload));
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
