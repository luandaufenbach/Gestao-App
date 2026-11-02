import { createRouter, createWebHistory } from "vue-router";
import { useAuth } from "../stores/auth";

const routes = [
	{
		path: "/login",
		name: "login",
		// Carregamento sob demanda: a tela de login não precisa estar no bundle
		// principal, e quem já está logado nunca a baixa.
		component: () => import("../views/Login.vue"),
		meta: { public: true },
	},
	{
		path: "/forgot-password",
		name: "forgot-password",
		component: () => import("../views/ForgotPassword.vue"),
		meta: { public: true },
	},
	{
		/**
		 * Destino do link do e-mail: `${APP_URL}/reset-password?token=...`
		 * (ver backend/src/utils/mailer.js). O token vai na query string, e não
		 * no caminho, porque é assim que o mailer já monta o link.
		 */
		path: "/reset-password",
		name: "reset-password",
		component: () => import("../views/ResetPassword.vue"),
		/**
		 * `allowAuthenticated`: esta é a única rota pública que precisa funcionar
		 * COM sessão também. O link do e-mail costuma abrir no navegador onde a
		 * aba antiga segue logada; sem a exceção, o guard mandaria justamente
		 * essa pessoa para o dashboard e a troca de senha seria impossível.
		 */
		meta: { public: true, allowAuthenticated: true },
	},
	{ path: "/", redirect: "/dashboard" },
	{
		path: "/dashboard",
		name: "dashboard",
		component: () => import("../views/Dashboard.vue"),
	},
	{
		path: "/transactions",
		name: "transactions",
		component: () => import("../views/Transactions.vue"),
	},
	{
		path: "/goals",
		name: "goals",
		component: () => import("../views/Goals.vue"),
	},
	{
		path: "/projection",
		name: "projection",
		component: () => import("../views/Projection.vue"),
	},
	{
		// Exportar e excluir os próprios dados (ROADMAP 0.6). Protegida, como
		// toda rota que não declara `meta.public`.
		path: "/account",
		name: "account",
		component: () => import("../views/Account.vue"),
	},
	{
		/**
		 * Amostra da fundação do design system (ROADMAP 1.3).
		 *
		 * Não aparece em nenhum menu: é página de conferência, chegada só por
		 * URL. Pública e com `allowAuthenticated` porque precisa abrir dos dois
		 * jeitos — sem sessão, para olhar a fundação sem backend nenhum, e com
		 * sessão, sem que o guard desvie para o dashboard.
		 */
		path: "/design-system",
		name: "design-system",
		component: () => import("../views/DesignSystem.vue"),
		meta: { public: true, allowAuthenticated: true },
	},
	// Antes, uma URL inexistente renderizava uma página em branco sem aviso.
	{
		path: "/:pathMatch(.*)*",
		redirect: "/dashboard",
	},
];

const router = createRouter({
	history: createWebHistory(),
	routes,
});

/**
 * Guard de autenticação.
 *
 * Rotas são protegidas por padrão: só passam sem sessão as que declaram
 * `meta.public`. Assim, uma rota nova nasce protegida, e não o contrário.
 */
router.beforeEach(async (to) => {
	const { isAuthenticated, initialized, restoreSession } = useAuth();

	// Na primeira navegação, revalida o token guardado no localStorage.
	if (!initialized.value) {
		await restoreSession();
	}

	if (to.meta.public) {
		// Quem já está logado não precisa ver a tela de login — exceto nas rotas
		// que valem com e sem sessão (ver `allowAuthenticated` em /reset-password).
		if (to.meta.allowAuthenticated) return true;

		return isAuthenticated.value ? { path: "/dashboard" } : true;
	}

	if (!isAuthenticated.value) {
		// Guarda o destino para retomar depois do login.
		return { path: "/login", query: to.fullPath !== "/" ? { redirect: to.fullPath } : {} };
	}

	return true;
});

export default router;
