<template>
  <!--
    `overflow-x: auto` com a barra de rolagem escondida: em telas estreitas as
    abas podem passar da largura disponível, e sem isso elas empurravam a
    página inteira, criando rolagem horizontal no documento todo em vez de só
    nas abas.

    O desenho de pílula sobre `bg-slate-100` saiu. As abas do sistema são
    sublinhadas (`.ga-tabs`): a aba ativa é marcada por um traço cobalt de 2px,
    não por uma pastilha branca. Além de ser o padrão da skill, o rótulo volta
    a ocupar só a largura do texto — as quatro abas somavam 348px de pílula
    contra 342px de espaço em 375px de tela, e era daí que vinha a barra de
    rolagem permanente embaixo delas.
  -->
  <nav class="tabs">
    <RouterLink
      v-for="tab in TABS"
      :key="tab.to"
      :to="tab.to"
      class="tabs__tab"
      :class="{ 'tabs__tab--on': route.path === tab.to }"
      :aria-current="route.path === tab.to ? 'page' : undefined"
    >
      {{ tab.label }}
    </RouterLink>
  </nav>
</template>

<script setup>
/**
 * Navegação por abas.
 *
 * MOTIVO: o mesmo bloco de três RouterLink estava repetido nas três views,
 * com a aba ativa marcada à mão em cada uma. Qualquer aba nova exigia editar
 * três arquivos, e era fácil esquecer de trocar a marcação de ativo.
 * Aqui a aba ativa é derivada da rota atual.
 *
 * MIGRADO para o design system gestaoApp (ROADMAP 1.4) com o padrão `.ga-tabs`
 * de `components/navigation/navigation.css`.
 *
 * O que NÃO foi feito, de propósito: a skill pede, abaixo de 768px, uma
 * TabBar INFERIOR com FAB central de "+". Isso não é troca de estilo — o FAB
 * precisa de uma ação de criar por tela, e três das quatro telas que usam este
 * componente (Transações, Metas, Projeção) ficaram fora desta etapa. Mudar o
 * esqueleto do celular agora deixaria essas telas com um botão central sem
 * destino. Fica para a segunda metade, quando todas as quatro estiverem
 * migradas e a ação de cada uma for conhecida.
 */
import { RouterLink, useRoute } from "vue-router";

const route = useRoute();

const TABS = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/transactions", label: "Transações" },
  { to: "/goals", label: "Metas" },
  { to: "/projection", label: "Projeção" },
];
</script>

<style scoped>
.tabs {
	display: flex;
	gap: var(--space-5);
	border-bottom: 1px solid var(--border-subtle);
	overflow-x: auto;
	scrollbar-width: none;
}
.tabs::-webkit-scrollbar {
	display: none;
}
@media (min-width: 768px) {
	.tabs {
		gap: 22px;
	}
}

.tabs__tab {
	position: relative;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	height: 40px;
	color: var(--text-tertiary);
	font: var(--fw-medium) var(--fs-body) / 1 var(--font-ui);
	white-space: nowrap;
	text-decoration: none;
	transition: color var(--dur-fast) var(--ease-out);
}
.tabs__tab:hover {
	color: var(--text-primary);
}
.tabs__tab--on {
	color: var(--text-primary);
}
.tabs__tab--on::after {
	content: "";
	position: absolute;
	left: 0;
	right: 0;
	bottom: -1px;
	height: 2px;
	border-radius: 2px;
	background: var(--brand-primary);
}
.tabs__tab:focus-visible {
	outline: none;
	border-radius: var(--radius-sm);
	box-shadow: var(--ring-focus);
}

/* Alvo mínimo de 44px no celular, como a skill pede. */
@media (max-width: 767px) {
	.tabs__tab {
		min-height: var(--hit-min);
	}
}
</style>
