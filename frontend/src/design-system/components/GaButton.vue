<script setup>
/**
 * Botão do design system gestaoApp.
 *
 * Porte em Vue de `components/core/Button.jsx` da skill `gestaoapp-design`.
 * O JSX não foi copiado: a estrutura (ícone · rótulo · ícone), as variantes e
 * os tamanhos vieram do `.jsx`, do `.d.ts` e do `Button.prompt.md`; o CSS
 * abaixo segue `components/core/core.css`, que é CSS puro e pôde vir como
 * está.
 *
 * Diferença de API em relação ao React: lá `icon` e `iconRight` recebem o
 * NOME de um ícone Lucide e o componente `Icon` o desenha. Aqui são slots. O
 * projeto usa Heroicons e a troca para Lucide é a etapa 1.4 — slot deixa o
 * botão pronto para as duas, sem arrastar um conjunto de ícones inteiro para
 * dentro da fundação. O tamanho do ícone continua vindo do botão, pela
 * variável `--ga-btn-icon` (14 / 16 / 18, como no `Button.jsx`).
 *
 * Estado "carregando": a skill não define nenhum. Não foi inventado aqui.
 */
import { computed } from "vue";

/*
 * As listas vão inteiras dentro de cada `validator`. `defineProps` é
 * processado pelo compilador antes do resto do `<script setup>`, então não
 * enxerga constante declarada aqui em cima — o ESLint barra
 * (`vue/valid-define-props`) e o build quebra.
 */
const props = defineProps({
  /**
   * `primary` é a única ação principal da tela; `accent` (zest) é só para
   * concluir ou finalizar; `glass` só sobre a imagem de marca.
   */
  variant: {
    type: String,
    default: "primary",
    validator: (value) =>
      ["primary", "secondary", "accent", "dark", "ghost", "danger", "glass"].includes(value),
  },
  size: {
    type: String,
    default: "md",
    validator: (value) => ["sm", "md", "lg"].includes(value),
  },
  /** Ocupa toda a largura disponível. */
  block: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  /** Só vale quando o botão é `<button>`. */
  type: {
    type: String,
    default: "button",
    validator: (value) => ["button", "submit", "reset"].includes(value),
  },
  /** Com `href`, o botão vira link e mantém a mesma aparência. */
  href: { type: String, default: undefined },
});

/**
 * `<a>` não tem atributo `disabled`: um link desabilitado continua clicável e
 * navegável pelo teclado. Por isso, desabilitado volta a ser `<button>`, que
 * o navegador realmente bloqueia.
 */
const tag = computed(() => (props.href && !props.disabled ? "a" : "button"));

const classes = computed(() => [
  "ga-btn",
  `ga-btn--${props.variant}`,
  props.size !== "md" && `ga-btn--${props.size}`,
  props.block && "ga-btn--block",
]);
</script>

<template>
  <component
    :is="tag"
    :class="classes"
    :href="tag === 'a' ? href : undefined"
    :type="tag === 'button' ? type : undefined"
    :disabled="tag === 'button' ? disabled : undefined"
  >
    <span v-if="$slots.icon" class="ga-btn__icon">
      <slot name="icon" />
    </span>
    <span v-if="$slots.default"><slot /></span>
    <span v-if="$slots.iconRight" class="ga-btn__icon">
      <slot name="iconRight" />
    </span>
  </component>
</template>

<!--
  Sem `scoped`: as classes já têm o prefixo `ga-`, e a etapa 1.4 vai usar
  `.ga-btn` também em elementos que não passam por este componente (um `<a>`
  dentro de outra tela, por exemplo). Estilo com escopo não alcançaria esses.
-->
<style>
/* Cópia de `components/core/core.css` da skill, mais os dois blocos marcados. */
.ga-btn {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	gap: 8px;
	height: 40px;
	padding: 0 18px;
	border-radius: var(--radius-pill);
	border: 1px solid transparent;
	font: var(--fw-medium) var(--fs-body) / 1 var(--font-ui);
	letter-spacing: -0.005em;
	white-space: nowrap;
	cursor: pointer;
	user-select: none;
	text-decoration: none;
	transition:
		background var(--dur-fast) var(--ease-out),
		border-color var(--dur-fast) var(--ease-out),
		box-shadow var(--dur-fast) var(--ease-out),
		transform var(--dur-fast) var(--ease-out),
		color var(--dur-fast) var(--ease-out);
	/* Tamanho do ícone por tamanho de botão, como no `Button.jsx` da skill. */
	--ga-btn-icon: 16px;
}
.ga-btn:hover {
	text-decoration: none;
}
.ga-btn:active:not(:disabled) {
	transform: scale(var(--press-scale));
}
.ga-btn:disabled {
	opacity: 0.45;
	cursor: not-allowed;
	box-shadow: none;
}
.ga-btn--sm {
	height: 32px;
	padding: 0 12px;
	font-size: var(--fs-small);
	gap: 6px;
	--ga-btn-icon: 14px;
}
.ga-btn--lg {
	height: 48px;
	padding: 0 24px;
	font-size: 15px;
	--ga-btn-icon: 18px;
}
.ga-btn--block {
	width: 100%;
}
.ga-btn--primary {
	background: var(--brand-primary);
	color: var(--text-on-brand);
	box-shadow: var(--shadow-brand);
}
.ga-btn--primary:hover:not(:disabled) {
	background: var(--brand-primary-hover);
	color: var(--text-on-brand);
}
.ga-btn--secondary {
	background: var(--surface-card);
	color: var(--text-primary);
	border-color: var(--border-default);
}
.ga-btn--secondary:hover:not(:disabled) {
	background: var(--surface-hover);
	border-color: var(--border-strong);
	color: var(--text-primary);
}
.ga-btn--accent {
	background: var(--accent);
	color: var(--text-on-accent);
	box-shadow: var(--shadow-accent);
}
.ga-btn--accent:hover:not(:disabled) {
	background: var(--accent-hover);
	color: var(--text-on-accent);
}
.ga-btn--dark {
	background: var(--ink-950);
	color: #fff;
}
.ga-btn--dark:hover:not(:disabled) {
	background: var(--ink-800);
	color: #fff;
}
.ga-btn--ghost {
	background: transparent;
	color: var(--text-secondary);
}
.ga-btn--ghost:hover:not(:disabled) {
	background: var(--surface-sunken);
	color: var(--text-primary);
}
.ga-btn--danger {
	background: var(--surface-card);
	color: var(--feedback-danger);
	border-color: var(--feedback-danger-border);
}
.ga-btn--danger:hover:not(:disabled) {
	background: var(--feedback-danger-bg);
	color: var(--feedback-danger);
}
.ga-btn--glass {
	background: rgba(255, 255, 255, 0.16);
	color: #fff;
	border-color: rgba(255, 255, 255, 0.3);
	backdrop-filter: blur(12px);
	-webkit-backdrop-filter: blur(12px);
}
.ga-btn--glass:hover:not(:disabled) {
	background: rgba(255, 255, 255, 0.26);
	color: #fff;
}

/*
 * ACRESCENTADO À SKILL — foco.
 *
 * O `core.css` não traz regra de foco para o botão: o export confia no
 * `:focus-visible` global do `tokens/base.css`, que não foi trazido para cá
 * porque colocaria anel de foco em todo elemento focável das telas atuais
 * (ver `design-system/index.css`). A regra abaixo é a do readme da skill —
 * "focus = cobalt border + 3px soft cobalt ring" — aplicada só ao botão, com
 * os tokens `--border-focus` e `--ring-focus`.
 *
 * `:focus-visible`, e não `:focus`: o anel aparece para quem navega por
 * teclado e não pisca a cada clique de mouse.
 */
.ga-btn:focus-visible {
	outline: none;
	border-color: var(--border-focus);
	box-shadow: var(--ring-focus);
}
/* O primário mantém o brilho cobalt por baixo do anel. */
.ga-btn--primary:focus-visible {
	box-shadow:
		var(--shadow-brand),
		var(--ring-focus);
}
.ga-btn--accent:focus-visible {
	box-shadow:
		var(--shadow-accent),
		var(--ring-focus);
}

/*
 * ACRESCENTADO À SKILL — alvo de toque no celular.
 *
 * O readme pede "44px min hit targets" abaixo de 768px, e o token existe
 * (`--hit-min`), mas nenhuma regra do `core.css` o aplica. Como consequência
 * deliberada, `sm` e `md` ficam com a mesma altura no celular; o próprio
 * `Button.prompt.md` já manda usar `lg` na ação principal do mobile.
 */
@media (max-width: 767px) {
	.ga-btn {
		min-height: var(--hit-min);
	}
}

.ga-btn__icon {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	flex: none;
}
.ga-btn__icon > * {
	width: var(--ga-btn-icon);
	height: var(--ga-btn-icon);
}
</style>
