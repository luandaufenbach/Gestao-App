<script setup>
/**
 * Navegação lateral do desktop: 248px, recolhendo para 72px.
 *
 * Porte em Vue de `components/navigation/Sidebar.jsx` da skill
 * `gestaoapp-design`, com o CSS de `components/navigation/navigation.css`
 * (`.ga-sidebar*`, `.ga-wordmark`). As duas larguras são token:
 * `--sidebar-width` (248) e `--sidebar-collapsed` (72).
 *
 * ── Diferenças de API em relação ao React ────────────────────────────────
 *
 * - O `Sidebar.jsx` recebe `header`, `footer` e `children` como props; aqui são
 *   os slots `header`, `footer` e o padrão. Mesma composição.
 * - O botão de recolher é o `IconButton` da skill, que não foi portado (nenhuma
 *   tela precisou dele até agora). O desenho dele está aqui, em
 *   `.ga-sidebar__toggle`, com os tokens de `.ga-iconbtn--ghost`.
 * - `onToggle` virou o evento `toggle`. Sem ouvinte, o botão não é desenhado —
 *   igual ao React, que só renderiza o `IconButton` quando recebe `onToggle`.
 *
 * O ícone segue o `Sidebar.jsx`: `chevron-left` para recolher, `chevron-right`
 * para expandir. O conjunto da skill tem também `panel-left-close`, mais
 * descritivo, mas a seta é o que o componente de referência usa.
 */
import { computed } from "vue";
import GaIcon from "./GaIcon.vue";

const props = defineProps({
  brand: { type: String, default: "gestaoApp" },
  /** Recolhida: 72px, só os ícones. */
  collapsed: { type: Boolean, default: false },
});

defineEmits(["toggle"]);

const classes = computed(() => ["ga-sidebar", props.collapsed && "ga-sidebar--collapsed"]);
</script>

<template>
  <aside :class="classes">
    <div class="ga-sidebar__brand">
      <span class="ga-wordmark">{{ brand }}</span>

      <button
        type="button"
        class="ga-sidebar__toggle"
        :aria-label="collapsed ? 'Expandir menu' : 'Recolher menu'"
        :aria-expanded="!collapsed"
        @click="$emit('toggle')"
      >
        <GaIcon :name="collapsed ? 'chevron-right' : 'chevron-left'" :size="16" />
      </button>
    </div>

    <slot name="header" />

    <nav class="ga-sidebar__body"><slot /></nav>

    <div v-if="$slots.footer" class="ga-sidebar__foot"><slot name="footer" /></div>
  </aside>
</template>

<!--
  Sem `scoped`: as regras de recolhimento alcançam classes de OUTROS
  componentes (`.ga-sidebar--collapsed .ga-nav__label`), que o escopo não
  enxergaria. É num arquivo só que o `navigation.css` da skill faz isso.
-->
<style>
/* Cópia de `.ga-sidebar*` e `.ga-wordmark` de `navigation.css` da skill. */
.ga-sidebar {
	display: flex;
	flex-direction: column;
	gap: var(--space-4);
	width: var(--sidebar-width);
	height: 100%;
	/*
	 * `18px 14px 14px` na skill. Os 14 são `--space-3-5`; 18 não tem token na
	 * escala de 4 — é um valor literal do `navigation.css`, copiado como está,
	 * do mesmo jeito que os 19px da `.ga-wordmark` logo abaixo.
	 */
	padding: 18px var(--space-3-5) var(--space-3-5);
	background: var(--bg-sidebar);
	border-right: 1px solid var(--border-subtle);
	overflow-y: auto;
	scrollbar-width: none;
	flex-shrink: 0;
	transition: width var(--dur-slow) var(--ease-out);
}

.ga-sidebar__brand {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: var(--space-2);
	min-height: var(--control-sm);
	/* `0 4px 0 8px` na skill: o botão encosta na borda, o nome respira. */
	padding: 0 var(--space-1) 0 var(--space-2);
}

.ga-wordmark {
	font: var(--fw-semibold) 19px / 1 var(--font-display);
	letter-spacing: -0.025em;
	color: var(--text-primary);
	white-space: nowrap;
}

.ga-sidebar__body {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: var(--space-5);
	min-height: 0;
}

.ga-sidebar__foot {
	display: flex;
	flex-direction: column;
	gap: var(--space-3);
}

/* ── Recolhida ─────────────────────────────────────────────────────────── */
.ga-sidebar--collapsed {
	width: var(--sidebar-collapsed);
	padding-left: var(--space-3);
	padding-right: var(--space-3);
}
.ga-sidebar--collapsed .ga-nav {
	justify-content: center;
	padding: 0;
}
.ga-sidebar--collapsed .ga-nav__label,
.ga-sidebar--collapsed .ga-navsec__head,
.ga-sidebar--collapsed .ga-wordmark {
	display: none;
}
.ga-sidebar--collapsed .ga-sidebar__brand {
	justify-content: center;
	padding: 0;
}

/*
 * ACRESCENTADO À SKILL — o botão de recolher.
 *
 * O `Sidebar.jsx` usa o `IconButton` de `components/core`, que não foi portado:
 * nenhuma tela precisou dele, e trazer o componente inteiro por um botão só
 * seria CSS morto. São os mesmos tokens de `.ga-iconbtn--ghost`, com o
 * `--control-sm` (32px) do tamanho `sm` que o `Sidebar.jsx` pede.
 */
.ga-sidebar__toggle {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: var(--control-sm);
	height: var(--control-sm);
	flex-shrink: 0;
	border: 0;
	border-radius: var(--radius-sm);
	background: transparent;
	color: var(--text-secondary);
	cursor: pointer;
	transition:
		background var(--dur-fast) var(--ease-out),
		color var(--dur-fast) var(--ease-out),
		transform var(--dur-fast) var(--ease-out);
}
.ga-sidebar__toggle:hover {
	background: var(--surface-hover);
	color: var(--text-primary);
}
.ga-sidebar__toggle:active {
	transform: scale(0.94);
}
.ga-sidebar__toggle:focus-visible {
	outline: none;
	box-shadow: var(--ring-focus);
}
</style>
