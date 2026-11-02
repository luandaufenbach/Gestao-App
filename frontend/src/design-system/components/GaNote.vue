<script setup>
/**
 * Aviso em linha: ícone num canto, texto do lado, fundo tingido pelo tom.
 *
 * ACRESCENTADO À SKILL. A skill tem `Toast` (flutuante, some sozinho) e
 * `Badge` (uma palavra), e nenhum dos dois serve para o que o app faz em sete
 * lugares: um parágrafo fixo dentro da tela, que explica o que vai acontecer —
 * "isto é dinheiro que ainda vai sair", "baixe seus dados antes", "senha
 * trocada, entre com a senha nova".
 *
 * Nenhum valor foi inventado: fundo, fio e cor do ícone saem dos
 * `--feedback-*` e dos `--border-*`, o raio é `--radius-md`, os espaços são da
 * escala e o texto é `--type-small`. A composição (ícone + texto, fio de 1px)
 * é a mesma do `.ga-toast` da skill, sem a sombra e sem a animação, que são do
 * que flutua.
 *
 * ── O TEXTO FICA EM TINTA, não na cor do tom ──────────────────────────────
 *
 * O tom pinta o fundo, o fio e o ícone; o texto continua `--text-primary`.
 * São três marcas do mesmo sinal, e a quarta custaria legibilidade: verde
 * `--feedback-success` sobre `--feedback-success-bg` em 13px fica no limite do
 * contraste, e estes parágrafos têm duas e três linhas. É também o que as
 * telas já faziam — o aviso da projeção era `text-amber-900`, que é tinta, não
 * laranja.
 */
import GaIcon from "./GaIcon.vue";

defineProps({
  /**
   * Qual sinal o aviso carrega. Segue o mapa do resto do app: cobalt é
   * informação em curso, verde é concluído, laranja é atenção, vermelho é
   * erro, neutro é constatação sem sinal.
   */
  tone: {
    type: String,
    default: "info",
    validator: (value) => ["info", "success", "warning", "danger", "neutral"].includes(value),
  },
  /** Nome de um ícone Lucide — ver `ICON_NAMES` em `../icons.js`. */
  icon: { type: String, required: true },
  /** Primeira linha em destaque, quando o aviso tem título. */
  title: { type: String, default: "" },
});
</script>

<template>
  <div class="note" :class="`note--${tone}`">
    <span class="note__icon">
      <GaIcon :name="icon" :size="18" />
    </span>
    <div class="note__text">
      <p v-if="title" class="note__title">{{ title }}</p>
      <p class="note__body"><slot /></p>
    </div>
  </div>
</template>

<style scoped>
.note {
	display: flex;
	align-items: flex-start;
	gap: var(--space-2-5);
	padding: var(--space-3);
	border: 1px solid;
	border-radius: var(--radius-md);
}

.note__icon {
	display: inline-flex;
	flex-shrink: 0;
	/* Alinha o ícone com a primeira linha do texto, não com o topo da caixa. */
	margin-top: 1px;
}

.note__text {
	min-width: 0;
	font: var(--type-small);
	color: var(--text-primary);
}
.note__title {
	font-weight: var(--fw-semibold);
}
/* Só separa do título quando existe um; sem título a caixa tem uma linha só. */
.note__title + .note__body {
	margin-top: var(--space-1);
}

/* ── O tom pinta fundo, fio e ícone. Ver o comentário do script. ────────── */
.note--info {
	background: var(--feedback-info-bg);
	border-color: var(--cobalt-100);
}
.note--info .note__icon {
	color: var(--feedback-info);
}

.note--success {
	background: var(--feedback-success-bg);
	border-color: var(--green-100);
}
.note--success .note__icon {
	color: var(--feedback-success);
}

.note--warning {
	background: var(--feedback-warning-bg);
	border-color: var(--orange-100);
}
.note--warning .note__icon {
	color: var(--feedback-warning);
}

.note--danger {
	background: var(--feedback-danger-bg);
	border-color: var(--feedback-danger-border);
}
.note--danger .note__icon {
	color: var(--feedback-danger);
}

.note--neutral {
	background: var(--surface-sunken);
	border-color: var(--border-subtle);
}
.note--neutral .note__icon {
	color: var(--text-tertiary);
}
</style>
