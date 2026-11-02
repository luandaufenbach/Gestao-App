<template>
  <nav class="topbar">
    <div class="topbar__inner">
      <!--
        A marca é só o nome, em Outfit. O quadrado verde com um "G" dentro saiu:
        a skill diz, no `readme.md`, que não existe logo do gestaoApp, e o verde
        dele era o antigo `lime-400` de ação — cor que agora significa entrada
        de dinheiro, não marca.
      -->
      <RouterLink to="/dashboard" class="topbar__brand">Gestão App</RouterLink>

      <div class="topbar__end">
        <span v-if="user" class="topbar__user">{{ user.name }}</span>

        <!--
          Entrada da tela de conta (exportar e excluir dados).
          Ícone, e não uma quinta aba: as quatro de AppTabs já ocupam a largura
          disponível em 375px. A área de clique é de 44px no celular (regra de
          alvo mínimo da skill) e 36px no desktop, maior que o desenho nos dois
          casos, porque fica encostado no botão "Sair".
        -->
        <RouterLink
          to="/account"
          title="Minha conta"
          aria-label="Minha conta"
          class="topbar__action"
          :class="{ 'topbar__action--on': route.path === '/account' }"
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
 * Barra superior do app (ROADMAP 1.4).
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
 * O desktop do sistema pede sidebar de 248px no lugar desta barra. Ficou para
 * a segunda metade da etapa: a sidebar muda o esqueleto de TODAS as telas, e
 * as que não foram migradas ainda esperam o `<main>` que existe hoje.
 */
import { RouterLink, useRoute, useRouter } from "vue-router";
import GaIcon from "../design-system/components/GaIcon.vue";
import { useAuth } from "../stores/auth";

const route = useRoute();
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
 * Escopado de propósito. O `tokens/base.css` da skill — que redefiniria
 * `body`, títulos, links e foco de toda a aplicação — não entra nesta etapa:
 * mudaria também as telas que ainda não foram migradas. O que esta barra
 * precisa dele está aqui dentro.
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
	max-width: var(--content-max);
	margin: 0 auto;
	padding: 0 var(--page-pad-mobile);
}
@media (min-width: 768px) {
	.topbar__inner {
		padding: 0 var(--page-pad);
	}
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

/* `.ga-iconbtn--ghost` da skill, com o alvo de 44px no celular. */
.topbar__action {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	gap: var(--space-2);
	width: 36px;
	height: 36px;
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

@media (max-width: 767px) {
	.topbar__action {
		min-width: var(--hit-min);
		min-height: var(--hit-min);
	}
}
</style>
