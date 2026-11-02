import { computed, onBeforeUnmount, ref } from "vue";

const STORAGE_KEY = "gf:sidebarCollapsed";

/**
 * A faixa em que a skill manda a sidebar nascer como trilho de ícones:
 * "768–1023: sidebar auto-collapses to icon rail" (readme, regras
 * responsivas). Abaixo de 768 a sidebar não existe — quem navega ali é a
 * `GaTabBar`.
 */
const RAIL_QUERY = "(min-width: 768px) and (max-width: 1023px)";

/**
 * Lê a escolha guardada. `null` = o usuário nunca escolheu.
 *
 * `try/catch` porque `localStorage` LANÇA, e não devolve null, quando o acesso
 * a dado de site está bloqueado — janela anônima com cookies de terceiros
 * desligados é o caso comum. Sem a guarda, a aplicação inteira não montaria por
 * causa de uma preferência de menu.
 */
function readStored() {
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		return stored === null ? null : stored === "1";
	} catch {
		return null;
	}
}

function writeStored(value) {
	try {
		localStorage.setItem(STORAGE_KEY, value ? "1" : "0");
	} catch {
		// Preferência de menu não vale derrubar a tela. Vale só nesta sessão.
	}
}

/**
 * Estado de recolhimento da sidebar.
 *
 * Quem usa é só o `AppShell`, e ele monta UMA vez, acima da `<RouterView>` —
 * por isso a escolha sobrevive à troca de rota sem precisar de store. O
 * `localStorage` é o que a faz sobreviver também ao recarregamento da página.
 *
 * ── Por que a escolha tem três estados, e não dois ────────────────────────
 *
 * `choice` é `null` até o usuário clicar no botão. Enquanto for `null`, a
 * largura vem do breakpoint: trilho entre 768 e 1023, aberta a partir de 1024,
 * que é a regra da skill. Com dois estados não haveria como distinguir "ainda
 * não escolheu" de "escolheu aberta", e o auto-recolhimento do tablet seria
 * impossível sem atropelar quem escolheu.
 *
 * "Auto-collapses" é um PADRÃO, não uma trava: o botão continua ali em qualquer
 * largura, e um clique passa a valer mais que o breakpoint.
 */
export function useSidebar() {
	const choice = ref(readStored());

	const media = window.matchMedia(RAIL_QUERY);
	const autoRail = ref(media.matches);
	const onChange = (event) => {
		autoRail.value = event.matches;
	};
	media.addEventListener("change", onChange);
	onBeforeUnmount(() => media.removeEventListener("change", onChange));

	/** O que a sidebar mostra de fato. */
	const rail = computed(() => choice.value ?? autoRail.value);

	function toggle() {
		choice.value = !rail.value;
		writeStored(choice.value);
	}

	return { rail, toggle };
}
