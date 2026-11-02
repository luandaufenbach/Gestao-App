<script setup>
/**
 * Grupo com rótulo dentro da sidebar ("MENU PRINCIPAL").
 *
 * Porte em Vue de `components/navigation/NavSection.jsx` da skill
 * `gestaoapp-design`, com o CSS de `components/navigation/navigation.css`
 * (`.ga-navsec*`).
 *
 * O rótulo é a única exceção à regra de sentence case do `readme.md`: "uppercase
 * only for micro labels (MENU PRINCIPAL, PROJETOS) with +8% tracking". Daí o
 * `text-transform` e o `--ls-label` no CSS, e não o texto digitado em
 * maiúsculas — o conteúdo segue em sentence case, o CAIXA ALTA é estilo.
 *
 * O slot `action` do React (um `IconButton` à direita do rótulo) foi mantido
 * como slot nomeado, mesmo sem uso hoje: é o lugar previsto para um "novo"
 * ao lado do título do grupo.
 */
defineProps({
  label: { type: String, default: "" },
});
</script>

<template>
  <div class="ga-navsec">
    <div v-if="label" class="ga-navsec__head">
      <span>{{ label }}</span>
      <slot name="action" />
    </div>
    <slot />
  </div>
</template>

<!-- Sem `scoped`: ver o comentário do `GaNavItem`. -->
<style>
/* Cópia de `.ga-navsec*` de `components/navigation/navigation.css` da skill. */
.ga-navsec {
	display: flex;
	flex-direction: column;
	gap: var(--space-0-5);
}
.ga-navsec__head {
	display: flex;
	align-items: center;
	justify-content: space-between;
	height: 22px;
	padding: 0 var(--space-1-5) var(--space-1) var(--space-2-5);
	font: var(--fw-medium) var(--fs-micro) / 1 var(--font-ui);
	letter-spacing: var(--ls-label);
	text-transform: uppercase;
	color: var(--text-tertiary);
}
</style>
