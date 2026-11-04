<script setup>
/**
 * Página de amostra da fundação do design system (ROADMAP 1.3).
 *
 * Fica FORA do fluxo do app: a rota `/design-system` não aparece em nenhum
 * menu e nenhuma tela leva até ela. Serve para conferir tokens, fontes e o
 * botão sem tocar nas telas de produção.
 *
 * Por que rota do Vue e não um HTML estático em `public/`: um arquivo
 * estático não passa pelo Vite nem pelo PostCSS, então provaria o CSS dele,
 * não o do app. Aqui o que se vê é exatamente a cascata que a etapa 1.4 vai
 * encontrar — mesmo build, mesmas layers, mesma ordem de import. A rota é
 * carregada sob demanda, então não entra no bundle de quem não abre a página.
 *
 * Os nomes de raio (`--radius-md`, `--radius-lg`…) pertencem ao Tailwind
 * enquanto as telas antigas usarem `rounded-*` (ver `design-system/index.css`),
 * então esta página usa só `--radius-pill`, que não tem conflito. Raio entra
 * na amostra quando a etapa 1.4 liberar os nomes.
 */
import GaButton from "../design-system/components/GaButton.vue";

const VARIANTS = [
  { name: "primary", label: "Ação principal da tela" },
  { name: "secondary", label: "Ação ao lado da principal" },
  { name: "accent", label: "Concluir, finalizar" },
  { name: "dark", label: "Chamada forte" },
  { name: "ghost", label: "Ação discreta" },
  { name: "danger", label: "Ação destrutiva" },
  { name: "glass", label: "Sobre imagem de marca" },
];

const SIZES = ["sm", "md", "lg"];

const RAMPS = [
  {
    name: "Cobalt — ação e foco",
    steps: [25, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((s) => `cobalt-${s}`),
  },
  {
    name: "Zest — conclusão e conquista",
    steps: [50, 100, 200, 300, 400, 500, 600, 700, 800].map((s) => `zest-${s}`),
  },
  {
    name: "Ink — neutros",
    steps: [0, 25, 50, 75, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map((s) => `ink-${s}`),
  },
  {
    name: "Sinais",
    steps: [
      "red-50",
      "red-100",
      "red-500",
      "red-600",
      "red-700",
      "orange-50",
      "orange-100",
      "orange-500",
      "orange-600",
      "orange-700",
      "green-50",
      "green-100",
      "green-500",
      "green-600",
      "green-700",
      "violet-50",
      "violet-100",
      "violet-500",
      "violet-600",
      "sky-50",
      "sky-500",
      "sky-600",
      "lime-500",
    ],
  },
];

const SEMANTIC = [
  { group: "Superfícies", names: ["bg-app", "bg-sidebar", "surface-card", "surface-sunken", "surface-hover", "surface-selected", "surface-inverse", "surface-brand", "surface-accent"] },
  { group: "Bordas", names: ["border-subtle", "border-default", "border-strong", "border-focus"] },
  { group: "Texto", names: ["text-primary", "text-secondary", "text-tertiary", "text-disabled", "text-link", "text-brand"] },
  { group: "Marca", names: ["brand-primary", "brand-primary-hover", "brand-primary-press", "brand-primary-soft", "accent", "accent-hover", "accent-soft"] },
  { group: "Retorno ao usuário", names: ["feedback-danger", "feedback-warning", "feedback-success", "feedback-info"] },
];

const TYPE_STYLES = [
  { token: "type-display", spec: "Outfit 500 · 88 / 1.0", sample: "88" },
  { token: "type-h1", spec: "Outfit 500 · 48 / 1.05", sample: "Tarefas simples" },
  { token: "type-heading", spec: "Outfit 500 · 32 / 1.2", sample: "Saldo do mês" },
  { token: "type-page-title", spec: "Outfit 500 · 26 / 1.15", sample: "Minhas transações" },
  { token: "type-title", spec: "Outfit 500 · 20 / 1.3", sample: "Cartão de crédito" },
  { token: "type-subtitle", spec: "Outfit 500 · 17 / 1.3", sample: "Fatura de novembro" },
  {
    token: "type-body-lg",
    spec: "Plus Jakarta Sans 400 · 16 / 1.55",
    sample: "Texto corrido usa Plus Jakarta Sans. A ação de cada tela responde à pergunta: o que eu faço agora?",
  },
  { token: "type-body", spec: "Outfit 400 · 14 / 1.45", sample: "Texto de interface, com acentuação: ação, coração, três." },
  { token: "type-body-strong", spec: "Outfit 500 · 14 / 1.45", sample: "Texto de interface em destaque" },
  { token: "type-small", spec: "Outfit 400 · 13 / 1.45", sample: "Observação secundária" },
  { token: "type-caption", spec: "Outfit 400 · 12 / 1.4", sample: "qui, 9 out · 10:00" },
  { token: "type-micro", spec: "Outfit 500 · 11 / 1.3", sample: "3 vencem hoje" },
  { token: "type-stat", spec: "Outfit 500 · 32 / 1", sample: "R$ 8.175,00" },
];
</script>

<template>
  <div class="ds">
    <header class="ds__head">
      <p class="ds__eyebrow">Design system gestaoApp</p>
      <h1 class="ds__h1">Fundação</h1>
      <p class="ds__lead">
        Tokens, fontes e o botão base. Página fora do fluxo do app, para conferir a fundação sem
        mexer nas telas.
      </p>
    </header>

    <section class="ds__section">
      <h2 class="ds__h2">Botão</h2>
      <p class="ds__note">
        Passe o mouse para ver o estado de hover, pressione para a escala de 0,97 e use Tab para o
        foco: borda cobalt e anel de 3px.
      </p>

      <div class="ds__rows">
        <div v-for="variant in VARIANTS" :key="variant.name" class="ds__row">
          <div class="ds__rowHead">
            <span class="ds__rowName">{{ variant.name }}</span>
            <span class="ds__rowHint">{{ variant.label }}</span>
          </div>
          <div class="ds__samples" :class="{ 'ds__samples--onBrand': variant.name === 'glass' }">
            <GaButton v-for="size in SIZES" :key="size" :variant="variant.name" :size="size">
              Nova transação
            </GaButton>
            <GaButton :variant="variant.name" disabled>Desabilitado</GaButton>
          </div>
        </div>
      </div>

      <h3 class="ds__h3">Largura total</h3>
      <div class="ds__block">
        <GaButton variant="primary" size="lg" block>Salvar transação</GaButton>
      </div>

      <h3 class="ds__h3">Com ícone</h3>
      <p class="ds__note">
        Os ícones entram por slot e herdam o tamanho do botão: 14, 16 e 18 pixels.
      </p>
      <div class="ds__samples">
        <GaButton v-for="size in SIZES" :key="size" :size="size">
          <template #icon>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" aria-hidden="true">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </template>
          Nova transação
        </GaButton>
        <GaButton variant="secondary">
          Avançar
          <template #iconRight>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </template>
        </GaButton>
      </div>
    </section>

    <section class="ds__section">
      <h2 class="ds__h2">Cor</h2>
      <div v-for="ramp in RAMPS" :key="ramp.name" class="ds__ramp">
        <h3 class="ds__h3">{{ ramp.name }}</h3>
        <div class="ds__swatches">
          <div v-for="step in ramp.steps" :key="step" class="ds__swatch">
            <div class="ds__chip" :style="{ background: `var(--${step})` }"></div>
            <span class="ds__swatchName">{{ step }}</span>
          </div>
        </div>
      </div>

      <h3 class="ds__h3">Aliases semânticos</h3>
      <div v-for="group in SEMANTIC" :key="group.group" class="ds__ramp">
        <p class="ds__groupName">{{ group.group }}</p>
        <div class="ds__swatches">
          <div v-for="name in group.names" :key="name" class="ds__swatch">
            <div class="ds__chip" :style="{ background: `var(--${name})` }"></div>
            <span class="ds__swatchName">{{ name }}</span>
          </div>
        </div>
      </div>
    </section>

    <section class="ds__section">
      <h2 class="ds__h2">Tipografia</h2>
      <p class="ds__note">
        Outfit em títulos, números e interface. Plus Jakarta Sans em texto corrido.
      </p>
      <div class="ds__types">
        <div v-for="style in TYPE_STYLES" :key="style.token" class="ds__type">
          <div class="ds__typeMeta">
            <span class="ds__rowName">{{ style.token }}</span>
            <span class="ds__rowHint">{{ style.spec }}</span>
          </div>
          <p class="ds__typeSample" :style="{ font: `var(--${style.token})` }">
            {{ style.sample }}
          </p>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
/*
 * Só tokens. Nenhum valor de cor, raio ou espaçamento fora deles — exceto as
 * larguras de coluna da grade, que são medida de layout da própria página.
 */
.ds {
	min-height: 100vh;
	background: var(--bg-app);
	color: var(--text-primary);
	font: var(--type-body);
	padding: var(--page-pad-mobile);
	display: flex;
	flex-direction: column;
	gap: var(--space-12);
}
@media (min-width: 768px) {
	.ds {
		padding: var(--space-12) var(--page-pad);
	}
}

.ds__head {
	display: flex;
	flex-direction: column;
	gap: var(--space-2);
}
.ds__eyebrow {
	font: var(--type-label);
	letter-spacing: var(--ls-label);
	text-transform: uppercase;
	color: var(--text-tertiary);
	margin: 0;
}
.ds__h1 {
	font: var(--type-heading);
	letter-spacing: var(--ls-heading);
	margin: 0;
}
.ds__lead {
	font: var(--type-body-lg);
	color: var(--text-secondary);
	margin: 0;
	max-width: 60ch;
}

.ds__section {
	display: flex;
	flex-direction: column;
	gap: var(--space-5);
	border-top: 1px solid var(--border-subtle);
	padding-top: var(--space-8);
}
.ds__h2 {
	font: var(--type-title);
	letter-spacing: var(--ls-title);
	margin: 0;
}
.ds__h3 {
	font: var(--type-body-strong);
	color: var(--text-secondary);
	margin: 0;
}
.ds__note {
	font: var(--type-small);
	color: var(--text-secondary);
	margin: 0;
	max-width: 70ch;
}
.ds__groupName {
	font: var(--type-label);
	letter-spacing: var(--ls-label);
	text-transform: uppercase;
	color: var(--text-tertiary);
	margin: 0 0 var(--space-2);
}

.ds__rows,
.ds__ramp,
.ds__types {
	display: flex;
	flex-direction: column;
	gap: var(--space-4);
}
.ds__row {
	display: flex;
	flex-direction: column;
	gap: var(--space-2);
	padding-bottom: var(--space-4);
	border-bottom: 1px solid var(--border-subtle);
}
.ds__rowHead {
	display: flex;
	align-items: baseline;
	gap: var(--space-2);
	flex-wrap: wrap;
}
.ds__rowName {
	font: var(--type-body-strong);
	color: var(--text-primary);
}
.ds__rowHint {
	font: var(--type-caption);
	color: var(--text-tertiary);
}
.ds__samples {
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: var(--space-3);
}
/* A variante `glass` só se lê sobre a imagem de marca. */
.ds__samples--onBrand {
	background: var(--gradient-sky);
	padding: var(--space-4);
}
.ds__block {
	max-width: 420px;
}

.ds__swatches {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(104px, 1fr));
	gap: var(--space-3);
}
.ds__swatch {
	display: flex;
	flex-direction: column;
	gap: var(--space-1);
	min-width: 0;
}
.ds__chip {
	height: var(--space-12);
	box-shadow: var(--shadow-inset-hairline);
}
.ds__swatchName {
	font: var(--type-caption);
	color: var(--text-secondary);
	overflow-wrap: anywhere;
}

.ds__type {
	display: flex;
	flex-direction: column;
	gap: var(--space-1);
	padding-bottom: var(--space-4);
	border-bottom: 1px solid var(--border-subtle);
}
.ds__typeMeta {
	display: flex;
	align-items: baseline;
	gap: var(--space-2);
	flex-wrap: wrap;
}
.ds__typeSample {
	margin: 0;
	overflow-wrap: anywhere;
}
</style>
