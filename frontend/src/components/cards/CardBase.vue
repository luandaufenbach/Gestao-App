<template>
  <div class="card">
    <div class="card__head">
      <span class="card__label">{{ title }}</span>
      <span v-if="icon" class="card__icon">
        <GaIcon :name="icon" :size="16" />
      </span>
    </div>
    <div class="card__value">
      <slot />
    </div>
    <slot name="footer" />
  </div>
</template>

<script setup>
/**
 * Casca de card do dashboard, migrada para o design system gestaoApp
 * (ROADMAP 1.4): `.ga-card` de `components/data/data.css` — superfície branca,
 * fio de 1px `--border-subtle`, raio 14 (`--radius-card`) e `--shadow-xs`.
 *
 * MUDANÇA DE API: `icon` era uma String desenhada como texto
 * (`<span class="text-xl">{{ icon }}</span>`), ou seja, um emoji. A skill proíbe
 * emoji na interface, e emoji não segue a cor do CSS nem tem o mesmo desenho em
 * cada sistema. Agora `icon` é o NOME de um ícone Lucide, desenhado pelo
 * GaIcon dentro do quadradinho tingido do padrão `.ga-stat__icon`. Nenhuma
 * chamada atual passa `icon`, então a troca não muda tela nenhuma hoje.
 */
import GaIcon from "../../design-system/components/GaIcon.vue";

defineProps({
  title: String,
  /** Nome de um ícone Lucide — ver `ICON_NAMES` em `design-system/icons.js`. */
  icon: String,
});
</script>

<style scoped>
.card {
	display: flex;
	flex-direction: column;
	gap: var(--space-3);
	min-width: 0;
	padding: var(--card-pad);
	border: 1px solid var(--border-subtle);
	border-radius: var(--radius-card);
	background: var(--surface-card);
	box-shadow: var(--shadow-xs);
	color: var(--text-primary);
}

.card__head {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: var(--space-3);
}

/* Micro-rótulo em caixa alta com +8% de tracking — a única caixa alta que a
   skill permite. */
.card__label {
	font: var(--type-label);
	letter-spacing: var(--ls-label);
	text-transform: uppercase;
	color: var(--text-tertiary);
}

.card__icon {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 28px;
	height: 28px;
	flex-shrink: 0;
	border-radius: var(--radius-sm);
	background: var(--brand-primary-soft);
	color: var(--brand-primary);
}

/*
 * O número do card segue `.ga-stat--compact .ga-stat__value` da skill: 24px,
 * não os 32 do `--type-stat` cheio. Em 768px os três cards desta linha ficam
 * com 194px de conteúdo cada, e "R$ 12.345,67" em 32px não cabe — mediria uns
 * 204px e vazaria. 24px é também o tamanho que o card já tinha.
 *
 * `tabular-nums`: sem isso os dígitos têm larguras diferentes e o valor
 * "pula" de posição a cada troca de mês.
 */
.card__value {
	font: var(--fw-medium) 24px / 1 var(--font-display);
	letter-spacing: -0.02em;
	font-variant-numeric: tabular-nums;
}
</style>
