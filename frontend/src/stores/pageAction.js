import { ref, onMounted, onUnmounted } from "vue";

/**
 * A ação de criar da tela aberta — o que o FAB da `GaTabBar` dispara.
 *
 * MOTIVO: no celular o botão central da barra inferior fica na CASCA
 * (`AppShell`), que é o pai da `<RouterView>`, mas os modais de criação vivem
 * dentro de cada tela, com o estado e o recarregamento de que cada uma precisa.
 * A casca precisa chamar a tela de volta, e `provide`/`inject` só desce. Então o
 * sentido se inverte: cada tela REGISTRA a própria ação aqui, e a casca lê.
 *
 * Singleton de módulo, como `stores/categories.js`: o estado vive fora da
 * função. Ver o comentário de lá para o problema que isso resolve (A6).
 *
 * ── A regra de qual ação é a de cada tela ─────────────────────────────────
 *
 * Dashboard e Transações: "Nova transação" — o mesmo modal do botão primário
 * que cada uma já tem no cabeçalho.
 * Metas: "Nova meta".
 * Projeção: não tem ação de criar própria, mas registra "Nova transação" aqui
 * porque criar um débito futuro MUDA a série que ela mostra, e ela precisa
 * recarregar depois.
 * Minha conta: não registra nada. Quem não registra cai no modal de "Nova
 * transação" da própria casca — é a ação principal do app, e nada na tela de
 * conta muda quando uma transação nasce. Assim a tela de conta não precisa
 * saber o que é uma transação.
 *
 * O FAB NUNCA é escondido. Em qualquer tela da casca ele tem destino, porque
 * esconder só em algumas faria a barra pular de layout a cada troca de aba.
 */

/** `{ label, run }` da tela atual, ou `null` antes do primeiro registro. */
const pageAction = ref(null);

/**
 * Registra a ação de criar da tela que chama. Vale enquanto a tela está
 * montada; na saída, o registro é desfeito.
 *
 * A guarda do `onUnmounted` existe por causa da ordem de montagem do
 * vue-router: a tela nova monta ANTES de a antiga desmontar, então a antiga
 * apagaria o registro recém-feito pela nova. Só apaga quem ainda é o dono.
 *
 * @param {{ label: string, run: () => void }} action
 */
export function definePageAction(action) {
	onMounted(() => {
		pageAction.value = action;
	});

	onUnmounted(() => {
		if (pageAction.value === action) pageAction.value = null;
	});
}

export function usePageAction() {
	return { pageAction };
}
