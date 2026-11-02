<script setup>
/**
 * Uma linha da sidebar.
 *
 * Porte em Vue de `components/navigation/NavItem.jsx` da skill
 * `gestaoapp-design`, com o CSS de `components/navigation/navigation.css`
 * (`.ga-nav*`).
 *
 * ── Diferença de API em relação ao React ─────────────────────────────────
 *
 * Lá o componente recebe `href` + `active` e quem chama calcula se a rota é a
 * atual. Aqui, com `to`, a linha é um `RouterLink` e quem decide o estado ativo
 * é o próprio vue-router:
 *
 * - `activeClass` recebe `ga-nav--active`, a classe da skill;
 * - o `aria-current="page"` do item ativo é posto pelo RouterLink, que já faz
 *   isso por padrão na rota exatamente ativa. É o mesmo atributo que o
 *   `NavItem.jsx` escreve à mão — só que sem uma segunda fonte de verdade sobre
 *   qual rota está aberta.
 *
 * Sem `to`, a linha é um `<button>`, para a ação que não navega (sair da
 * sessão). Era o que o `NavItem.jsx` já fazia quando não recebia `href`.
 *
 * `icon` é o NOME de um ícone Lucide, como no React — aqui o `GaIcon` o
 * desenha. Não é slot, ao contrário do `GaButton`: a sidebar só desenha ícone
 * do conjunto da skill, nunca conteúdo arbitrário.
 */
import { RouterLink } from "vue-router";
import GaIcon from "./GaIcon.vue";

defineProps({
  /** Nome Lucide. Ver `ICON_NAMES` em `../icons.js`. */
  icon: { type: String, default: "" },
  label: { type: String, required: true },
  /** Com `to`, a linha navega; sem, é um botão de ação. */
  to: { type: String, default: "" },
});
</script>

<template>
  <!--
    `title` em toda linha, como no `NavItem.jsx`: quando a sidebar está
    recolhida a 72px o rótulo fica oculto e o title é a única pista do que o
    ícone significa para quem usa mouse.
  -->
  <RouterLink v-if="to" :to="to" class="ga-nav" active-class="ga-nav--active" :title="label">
    <span v-if="icon" class="ga-nav__icon"><GaIcon :name="icon" :size="17" /></span>
    <span class="ga-nav__label">{{ label }}</span>
  </RouterLink>

  <button v-else type="button" class="ga-nav" :title="label">
    <span v-if="icon" class="ga-nav__icon"><GaIcon :name="icon" :size="17" /></span>
    <span class="ga-nav__label">{{ label }}</span>
  </button>
</template>

<!--
  Sem `scoped`, pelo mesmo motivo do `GaButton` e do `GaIcon`: as classes já têm
  o prefixo `ga-`, e o `GaSidebar` precisa alcançá-las de fora para apagar os
  rótulos quando está recolhido (`.ga-sidebar--collapsed .ga-nav__label`) — é
  assim que o `navigation.css` da skill faz, num arquivo só.
-->
<style>
/* Cópia de `.ga-nav*` de `components/navigation/navigation.css` da skill. */
.ga-nav {
	display: flex;
	align-items: center;
	gap: var(--space-2-5);
	width: 100%;
	height: 38px;
	padding: 0 var(--space-2-5);
	border: 0;
	border-radius: var(--radius-md);
	background: transparent;
	color: var(--text-secondary);
	font: var(--fw-medium) var(--fs-body) / 1 var(--font-ui);
	text-align: left;
	text-decoration: none;
	cursor: pointer;
	transition:
		background var(--dur-fast) var(--ease-out),
		color var(--dur-fast) var(--ease-out),
		box-shadow var(--dur-fast) var(--ease-out);
}
.ga-nav:hover {
	background: var(--surface-hover);
	color: var(--text-primary);
	text-decoration: none;
}
.ga-nav--active,
.ga-nav--active:hover {
	background: var(--surface-card);
	color: var(--text-primary);
	box-shadow: var(--shadow-sm);
}

.ga-nav__icon {
	display: inline-flex;
	color: inherit;
}
.ga-nav--active .ga-nav__icon {
	color: var(--brand-primary);
}

.ga-nav__label {
	flex: 1;
	min-width: 0;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

/*
 * ACRESCENTADO À SKILL — foco.
 *
 * O `navigation.css` não traz regra de foco para a linha: confia no
 * `:focus-visible` global do `tokens/base.css`, que hoje já está adotado e
 * daria o anel. A regra explícita existe para o anel não ser cortado pelo
 * `overflow-y: auto` da sidebar — `inset` desenha o anel por dentro da linha,
 * como `.proj__row` já faz pelo mesmo motivo.
 */
.ga-nav:focus-visible {
	outline: none;
	box-shadow: inset var(--ring-focus);
}

/*
 * ACRESCENTADO À SKILL — alvo de toque.
 *
 * A linha tem 38px, abaixo dos 44 que o readme pede no celular. A sidebar não
 * aparece abaixo de 768px (quem navega ali é a `GaTabBar`), mas o rodapé dela
 * tem "Minha conta" e "Sair", que no celular vivem na barra de topo. A regra
 * fica aqui para o caso de a linha ser usada em tela estreita algum dia.
 */
@media (max-width: 767px) {
	.ga-nav {
		height: var(--hit-min);
	}
}
</style>
