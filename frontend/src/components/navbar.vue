<template>
  <nav class="topbar">
    <div class="topbar__inner">
      <!--
        A marca é só o nome, em Outfit. O quadrado verde com um "G" dentro saiu:
        a skill diz, no `readme.md`, que não existe logo do gestaoApp, e o verde
        dele era o antigo `lime-400` de ação — cor que agora significa entrada
        de dinheiro, não marca.
      -->
      <!--
        `aria-current-value="false"`: a marca leva ao dashboard, então o
        RouterLink a anunciaria como "página atual" sempre que o dashboard
        estivesse aberto — ao mesmo tempo que a aba "Dashboard" da barra
        inferior, que é a que de fato marca a rota. Dois "página atual" na
        mesma tela é ruído para quem usa leitor de tela. "false" é valor ARIA
        válido e quer dizer exatamente "esta não é a atual".
      -->
      <RouterLink to="/dashboard" class="topbar__brand" aria-current-value="false">
        Gestão App
      </RouterLink>

      <div class="topbar__end">
        <span v-if="user" class="topbar__user">{{ user.name }}</span>

        <!--
          Entrada da tela de conta (exportar e excluir dados).
          Ícone, e não um quinto destino: a `GaTabBar` tem quatro abas e o FAB
          central, e uma quinta aba traria de volta o aperto de largura que as
          abas de topo tinham em 375px. A área de clique é de 44px, o alvo
          mínimo da skill, maior que o desenho — ele fica encostado no "Sair".

          A marca de ativo saiu da comparação à mão para o `active-class` do
          RouterLink, que é também quem põe o `aria-current="page"` — uma fonte
          de verdade só sobre qual rota está aberta, como no `GaNavItem`.
        -->
        <RouterLink
          to="/account"
          title="Minha conta"
          aria-label="Minha conta"
          class="topbar__action"
          active-class="topbar__action--on"
        >
          <GaIcon name="user" :size="17" />
        </RouterLink>

        <button type="button" class="topbar__action topbar__action--wide" @click="handleLogout">
          <GaIcon name="log-out" :size="17" />
          <span>Sair</span>
        </button>
      </div>
    </div>
  </nav>
</template>

<script setup>
/**
 * Barra de topo do CELULAR (ROADMAP 1.4).
 *
 * MIGRADA para o design system gestaoApp. O que mudou de significado, e não
 * só de tom:
 *
 * - A barra era `bg-slate-900` (quase preta). O sistema põe o app sobre a tela
 *   Cloud com superfícies brancas e fios de 1px — chrome escuro era peso que
 *   competia com o conteúdo. Agora é `--surface-card` com `--border-subtle`.
 * - O link da marca tinha hover `text-green-400`. Verde no sistema é sinal de
 *   entrada/sucesso; link e foco são cobalt.
 *
 * ── Abaixo de 768px, e só ali ────────────────────────────────────────────
 *
 * A primeira metade da etapa deixou anotado que "o desktop do sistema pede
 * sidebar de 248px no lugar desta barra". É o que aconteceu: a sidebar
 * (`GaSidebar`, montada pelo `AppShell`) assumiu o desktop, e esta barra ficou
 * escondida de 768px para cima — duas navegações para os mesmos destinos, a
 * 248px de distância uma da outra, é exatamente o que não se quer.
 *
 * Ela não foi apagada porque a skill mantém uma barra de topo no celular
 * ("<768: top bar (wordmark · bell · avatar→settings)") e porque "Minha conta"
 * e "Sair" não cabem na `GaTabBar`. No desktop esses dois destinos estão no
 * rodapé da sidebar.
 *
 * Quem monta esta barra é o `AppShell`, não cada tela. Antes eram cinco telas
 * importando-a uma por uma.
 */
import { RouterLink, useRouter } from "vue-router";
import GaIcon from "../design-system/components/GaIcon.vue";
import { useAuth } from "../stores/auth";

const router = useRouter();
const { user, logout } = useAuth();

function handleLogout() {
  // O logout já limpa as stores de categorias e cartões; a chamada extra que
  // existia aqui virou duplicata quando isso passou para o próprio store.
  logout();
  router.replace("/login");
}
</script>

<style scoped>
/*
 * Escopado de propósito: são classes `topbar__*`, de um componente só, e não
 * classes `ga-` do design system reaproveitadas por fora dele.
 */
.topbar {
	background: var(--surface-card);
	border-bottom: 1px solid var(--border-subtle);
}

.topbar__inner {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: var(--space-3);
	height: var(--topbar-height);
	padding: 0 var(--page-pad-mobile);
}

/* `.ga-wordmark` da skill: Outfit SemiBold 19, tracking fechado. */
.topbar__brand {
	font: var(--fw-semibold) 19px / 1 var(--font-display);
	letter-spacing: -0.025em;
	color: var(--text-primary);
	white-space: nowrap;
	text-decoration: none;
	border-radius: var(--radius-sm);
}
.topbar__brand:hover {
	color: var(--brand-primary);
}

.topbar__end {
	display: flex;
	align-items: center;
	gap: var(--space-1);
}

/*
 * O nome só aparece de 640 a 767px. Em 375px a linha é marca + dois botões, e
 * não sobra largura para ele.
 */
.topbar__user {
	display: none;
	font: var(--type-small);
	color: var(--text-secondary);
	margin-right: var(--space-2);
}
@media (min-width: 640px) {
	.topbar__user {
		display: inline;
	}
}

/*
 * `.ga-iconbtn--ghost` da skill, no alvo de 44px: a barra é só do celular, onde
 * o mínimo da skill vale sempre. Antes havia um caso de 36px para o desktop,
 * que deixou de existir junto com a barra no desktop.
 */
.topbar__action {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	gap: var(--space-2);
	min-width: var(--hit-min);
	height: var(--hit-min);
	flex-shrink: 0;
	border: 0;
	border-radius: var(--radius-md);
	background: transparent;
	color: var(--text-secondary);
	font: var(--fw-medium) var(--fs-body) / 1 var(--font-ui);
	text-decoration: none;
	cursor: pointer;
	transition:
		background var(--dur-fast) var(--ease-out),
		color var(--dur-fast) var(--ease-out);
}
.topbar__action:hover {
	background: var(--surface-sunken);
	color: var(--text-primary);
}
.topbar__action:active {
	transform: scale(0.94);
}
.topbar__action--on,
.topbar__action--on:hover {
	background: var(--surface-selected);
	color: var(--brand-primary);
}
.topbar__action--wide {
	width: auto;
	padding: 0 var(--space-2-5);
}

/* Foco: borda cobalt e anel de 3px, a regra do readme da skill. */
.topbar__action:focus-visible,
.topbar__brand:focus-visible {
	outline: none;
	box-shadow: var(--ring-focus);
}
</style>
