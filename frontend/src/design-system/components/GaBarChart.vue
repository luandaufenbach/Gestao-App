<template>
  <div
    class="ga-bc"
    :class="{ 'ga-bc--dense': labels.length > 6, 'ga-bc--dim': hovered !== null }"
    :style="{ '--ga-bc-h': `${height}px`, '--ga-bc-h-md': `${heightDesktop}px` }"
    role="img"
    :aria-label="ariaLabel"
  >
    <!-- Eixo Y: do maior para o menor, espaçado igual, alinhado à direita. -->
    <div class="ga-bc__y" aria-hidden="true">
      <span v-for="(tick, index) in ticks" :key="index" class="ga-bc__yTick">{{
        formatTickValue(tick)
      }}</span>
    </div>

    <div class="ga-bc__plot" @mouseleave="hovered = null">
      <!-- Uma linha de grade por tick, nas mesmas posições dos rótulos. -->
      <div class="ga-bc__grid" aria-hidden="true">
        <span v-for="(tick, index) in ticks" :key="index" class="ga-bc__gridLine"></span>
      </div>

      <!--
        Linha do zero, só quando o domínio desce abaixo dele. Sem ela, uma
        linha de resultado negativa pareceria flutuar sem referência.
      -->
      <span
        v-if="domain.min < 0"
        class="ga-bc__zero"
        :style="{ bottom: `${zeroPercent}%` }"
        aria-hidden="true"
      ></span>

      <!--
        Área das barras: do zero para cima. Quando o domínio é todo positivo
        ela ocupa o plot inteiro; com resultado negativo, ela encolhe e as
        barras continuam nascendo exatamente na linha do zero.
      -->
      <div class="ga-bc__bars" :style="{ bottom: `${zeroPercent}%` }">
        <div
          v-for="(label, index) in labels"
          :key="index"
          class="ga-bc__col"
          :class="{ 'ga-bc__col--on': hovered === index }"
          @mouseenter="hovered = index"
          @touchstart.passive="hovered = index"
        >
          <!-- `grouped` põe as séries lado a lado; `stacked`, uma sobre a
               outra. O realce do topo é `background-image` de cada faixa, e
               não um elemento sobre a pilha: sobreposto, ele pintaria também o
               vão entre as duas barras do modo lado a lado. -->
          <div class="ga-bc__stack" :class="`ga-bc__stack--${mode}`">
            <div
              v-for="item in series"
              :key="item.key ?? item.label"
              class="ga-bc__seg"
              :style="{
                height: `${segmentPercent(item.data[index])}%`,
                backgroundColor: item.color,
              }"
            ></div>
          </div>
        </div>
      </div>

      <!-- Linha sobreposta. SVG só para o traço: com `preserveAspectRatio`
           desligado, um `<circle>` viraria elipse, então os pontos são divs. -->
      <template v-if="line">
        <svg
          class="ga-bc__lineSvg"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <!--
            A cor vai no `style`, e não no atributo `stroke`: atributo de
            apresentação do SVG não resolve `var(--token)`, propriedade CSS
            resolve. É o que permite a série chegar como token.
          -->
          <polyline
            :points="linePoints"
            fill="none"
            :style="{ stroke: line.color }"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            vector-effect="non-scaling-stroke"
          />
        </svg>
        <span
          v-for="(value, index) in line.data"
          :key="`p${index}`"
          class="ga-bc__point"
          :style="{
            left: `${columnCenter(index)}%`,
            bottom: `${valuePercent(value)}%`,
            background: line.color,
          }"
          aria-hidden="true"
        ></span>
      </template>

      <!--
        Tooltip. Fica fora das colunas, posicionado pelo centro da coluna ativa,
        porque dentro dela o `overflow` da área de barras o cortaria.
      -->
      <div
        v-if="hovered !== null"
        class="ga-bc__tip"
        :class="[tipSideClass, tipFlipClass]"
        :style="tipStyle"
        aria-hidden="true"
      >
        <span class="ga-bc__tipLabel">{{ labels[hovered] }}</span>
        <!-- Série que vale zero no mês não vira linha: com seis categorias, a
             caixa viraria uma lista de zeros. -->
        <span v-for="row in tooltipRows" :key="row.label" class="ga-bc__tipRow">
          <span class="ga-bc__tipDot" :style="{ background: row.color }"></span>
          <span class="ga-bc__tipName">{{ row.label }}</span>
          <span class="ga-bc__tipValue">{{ row.value }}</span>
        </span>
      </div>
    </div>

    <!-- Eixo X. Cada rótulo ocupa a fatia da própria coluna, para ficar
         centralizado nela. -->
    <div class="ga-bc__x" aria-hidden="true">
      <span v-for="(label, index) in labels" :key="index" class="ga-bc__xLabel">{{ label }}</span>
    </div>
  </div>
</template>

<script setup>
/**
 * Gráfico de barras em HTML e CSS — sem canvas.
 *
 * ACRESCENTADO À SKILL. A estrutura vem do `BarChart` do Lumen Design System;
 * as cores e medidas são tokens do gestaoApp. A proveniência e o que foi ou
 * não aproveitado estão no cabeçalho de `charts.css`.
 *
 * Cobre os dois gráficos de barra do app:
 *
 *   grouped + line   evolução por mês (receita, despesa e resultado)
 *   stacked          despesa por categoria em cada mês
 *
 * ── Valores entram crus, nunca formatados ─────────────────────────────────
 *
 * As séries chegam em CENTAVOS, como tudo no projeto. A formatação é do
 * chamador, via `format` e `formatTick` — o componente nunca divide por 100.
 *
 * ── Por que as barras não podem ser negativas ─────────────────────────────
 *
 * Só a linha aceita valor negativo. Receita e despesa são grandezas positivas
 * por definição, e uma barra para baixo ao lado de duas para cima se leria
 * como "gastei menos", quando significa o contrário — é o mesmo motivo que fez
 * o resultado ser linha, e não uma terceira barra.
 */
import { ref, computed } from "vue";

const props = defineProps({
  /** Rótulos do eixo X, um por coluna. Curtos: "nov/26". */
  labels: { type: Array, required: true },

  /**
   * Séries de barra: `{ key, label, color, data }`. `data` tem o mesmo
   * comprimento de `labels` e só valores >= 0.
   */
  series: { type: Array, required: true },

  /** `grouped` lado a lado, `stacked` empilhado. */
  mode: {
    type: String,
    default: "grouped",
    validator: (value) => ["grouped", "stacked"].includes(value),
  },

  /** Linha sobreposta opcional: `{ label, color, data }`. Aceita negativo. */
  line: { type: Object, default: null },

  /** Formata o valor do tooltip. */
  format: { type: Function, required: true },

  /** Formata o tick do eixo Y. Cai no `format` quando não vem. */
  formatTick: { type: Function, default: null },

  /**
   * Alvo de divisões no eixo Y — não um número exato. O passo redondo é que
   * manda; ver `niceDomain`.
   */
  yTicks: { type: Number, default: 4 },

  height: { type: Number, default: 220 },
  heightDesktop: { type: Number, default: 280 },

  /** Resumo para leitor de tela: o gráfico inteiro é um `role="img"`. */
  ariaLabel: { type: String, required: true },
});

const hovered = ref(null);

const formatTickValue = (value) => (props.formatTick ?? props.format)(value);

/**
 * Altura de cada coluna no eixo: soma das séries quando empilhado, maior
 * delas quando lado a lado — é o que precisa caber embaixo do topo do eixo.
 */
const columnTotals = computed(() =>
  props.labels.map((_, index) => {
    const values = props.series.map((item) => Math.max(0, item.data[index] ?? 0));
    if (values.length === 0) return 0;
    return props.mode === "stacked"
      ? values.reduce((sum, value) => sum + value, 0)
      : Math.max(...values);
  })
);

/**
 * Domínio do eixo com passo "redondo", pela escada 1 / 2 / 5 × 10^k.
 *
 * ── Por que o passo manda, e não a quantidade de divisões ─────────────────
 *
 * A primeira versão disto arredondava o TOPO pelo passo e depois cortava o
 * domínio em `yTicks` partes iguais. As partes não são múltiplas do passo, e
 * os ticks saíam quebrados: medido no empilhado, um topo de R$ 6.000 com 4
 * divisões dava 6k / 4,5k / 3k / 1,5k / 0, que a formatação compacta
 * arredondava para "6k 5k 3k 2k 0" — passo visualmente irregular.
 *
 * Agora o passo é a unidade: o domínio vai de um múltiplo dele a outro, e cada
 * tick é um múltiplo. `yTicks` passa a ser um ALVO de quantidade, não um
 * número exato — é o que permite o eixo ter sempre números redondos.
 *
 * O Lumen arredonda só o topo (`ceil(max / 10^k) * 10^k`) e tem o mesmo
 * problema; com números pequenos e inteiros ele não aparece.
 */
function niceDomain(rawMin, rawMax, target) {
  const range = rawMax - rawMin;

  // Série inteira em zero. Não acontece nas telas (há estado vazio antes),
  // mas sem a guarda o domínio teria altura nula e toda divisão daria NaN.
  if (!(range > 0)) return { min: 0, max: 1, step: 1 };

  /*
   * Começa um décimo abaixo do passo "ideal" e sobe pela escada até a
   * quantidade de divisões caber no alvo. Começar fino e subir garante o menor
   * passo redondo que serve, em vez do primeiro que a conta sugerir.
   */
  let magnitude = 10 ** Math.floor(Math.log10(range / target)) / 10;

  for (let attempt = 0; attempt < 16; attempt += 1) {
    for (const factor of [1, 2, 5]) {
      const step = factor * magnitude;
      const min = Math.floor(rawMin / step) * step;
      const max = Math.ceil(rawMax / step) * step;

      if (max > min && (max - min) / step <= target + 1) return { min, max, step };
    }
    magnitude *= 10;
  }

  // Inalcançável com 16 ordens de magnitude; existe para a função ter saída
  // total em vez de devolver undefined.
  return { min: rawMin, max: rawMax, step: range };
}

const domain = computed(() => {
  const lineValues = props.line?.data ?? [];

  return niceDomain(
    Math.min(0, ...lineValues),
    Math.max(0, ...columnTotals.value, ...lineValues),
    props.yTicks
  );
});

/** Altura total do domínio. Nunca zero, pela guarda em `niceDomain`. */
const span = computed(() => domain.value.max - domain.value.min);

/** Rótulos e linhas de grade, do topo para a base, de passo em passo. */
const ticks = computed(() => {
  const { min, max, step } = domain.value;
  const count = Math.round((max - min) / step);

  return Array.from({ length: count + 1 }, (_, index) => max - step * index);
});

/** Onde está o zero, em % a partir da base do plot. */
const zeroPercent = computed(() => ((0 - domain.value.min) / span.value) * 100);

/**
 * Altura de uma faixa de barra, em % da ÁREA DAS BARRAS (que vai de zero a
 * `domain.max`) — e não do plot inteiro.
 */
function segmentPercent(value) {
  const amount = Math.max(0, value ?? 0);
  if (domain.value.max <= 0) return 0;
  return (amount / domain.value.max) * 100;
}

/** Posição de um valor no plot inteiro, em % a partir da base. Aceita negativo. */
function valuePercent(value) {
  return (((value ?? 0) - domain.value.min) / span.value) * 100;
}

/** Centro horizontal da coluna, em % da largura do plot. */
function columnCenter(index) {
  return ((index + 0.5) / props.labels.length) * 100;
}

const linePoints = computed(() =>
  (props.line?.data ?? [])
    .map((value, index) => `${columnCenter(index)},${100 - valuePercent(value)}`)
    .join(" ")
);

/** Linhas do tooltip: séries com valor, mais a linha sobreposta. */
const tooltipRows = computed(() => {
  if (hovered.value === null) return [];

  const index = hovered.value;

  const rows = props.series
    .filter((item) => (item.data[index] ?? 0) !== 0)
    .map((item) => ({
      label: item.label,
      color: item.color,
      value: props.format(item.data[index]),
    }));

  if (props.line) {
    // O resultado entra sempre, inclusive zerado: "resultado R$ 0,00" é
    // informação, diferente de uma categoria que não teve gasto no mês.
    rows.push({
      label: props.line.label,
      color: props.line.color,
      value: props.format(props.line.data[index] ?? 0),
    });
  }

  return rows;
});

/**
 * Nas pontas o tooltip sai do plot. Em vez de medir largura, a primeira e a
 * última coluna o alinham pela borda — resolve o caso real sem ResizeObserver.
 *
 * O `left` sai daqui junto com a classe, e não de um `:style` separado: com
 * dois lugares mandando na mesma propriedade, a classe precisaria de
 * `!important` para vencer o estilo inline.
 */
const tipSideClass = computed(() => {
  if (hovered.value === 0) return "ga-bc__tip--start";
  if (hovered.value === props.labels.length - 1) return "ga-bc__tip--end";
  return "";
});

/**
 * Altura do topo da coluna, em % do PLOT — o tooltip se ancora nela.
 *
 * `segmentPercent` mede dentro da área de barras, que começa no zero; o
 * tooltip é posicionado no plot inteiro, que pode descer abaixo dele.
 */
function columnTopPercent(index) {
  const inBars = segmentPercent(columnTotals.value[index]) / 100;
  return zeroPercent.value + inBars * (100 - zeroPercent.value);
}

/**
 * Coluna alta não tem espaço acima dela dentro do plot: aí o tooltip desce e
 * fica sobre a barra, em vez de sair do card e cobrir o texto da tela.
 */
const tipFlipClass = computed(() =>
  hovered.value !== null && columnTopPercent(hovered.value) > 62 ? "ga-bc__tip--below" : ""
);

const tipStyle = computed(() => {
  if (hovered.value === null) return {};

  const style = { bottom: `${columnTopPercent(hovered.value)}%` };

  if (hovered.value === 0) style.left = "0%";
  else if (hovered.value === props.labels.length - 1) style.left = "100%";
  else style.left = `${columnCenter(hovered.value)}%`;

  return style;
});
</script>

<style scoped>
/*
 * Grade de duas colunas e duas linhas:
 *
 *   eixo Y | plot
 *      -   | eixo X
 */
.ga-bc {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: var(--space-2) var(--space-2-5);
  width: 100%;
  min-width: 0;
  font-family: var(--font-mono);
}

/* ── Eixos ──────────────────────────────────────────────────────────────── */
.ga-bc__y {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: var(--ga-bc-h);
  text-align: right;
}
.ga-bc__yTick,
.ga-bc__xLabel {
  font-size: var(--fs-micro);
  line-height: 1;
  letter-spacing: 0.02em;
  color: var(--data-tick);
  font-variant-numeric: tabular-nums;
}
/*
 * O primeiro e o último tick são deslocados meia linha para fora, para o
 * número ficar centrado na linha de grade em vez de empurrado para dentro.
 */
.ga-bc__yTick:first-child {
  transform: translateY(-0.1em);
}
.ga-bc__yTick:last-child {
  transform: translateY(0.1em);
}

.ga-bc__x {
  grid-column: 2;
  display: flex;
  min-width: 0;
}
.ga-bc__xLabel {
  flex: 1 1 0;
  min-width: 0;
  text-align: center;
  white-space: nowrap;
}

/*
 * Doze meses não cabem em 375px. Em vez de esconder o rótulo — o que faria as
 * fatias se redistribuírem e sairiam do lugar das colunas —, ele fica
 * invisível mantendo o espaço.
 */
@media (max-width: 767px) {
  .ga-bc--dense .ga-bc__xLabel:nth-child(even) {
    visibility: hidden;
  }
}

/* ── Plot ───────────────────────────────────────────────────────────────── */
.ga-bc__plot {
  position: relative;
  height: var(--ga-bc-h);
  min-width: 0;
}

.ga-bc__grid {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  pointer-events: none;
}
.ga-bc__gridLine {
  height: 1px;
  background: var(--data-grid);
}

/* A linha do zero é mais firme que a grade: ela é referência, não fundo. */
.ga-bc__zero {
  position: absolute;
  left: 0;
  right: 0;
  height: 1px;
  background: var(--border-strong);
  pointer-events: none;
}

/* ── Barras ─────────────────────────────────────────────────────────────── */
.ga-bc__bars {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: flex-end;
}
.ga-bc__col {
  position: relative;
  flex: 1 1 0;
  min-width: 0;
  height: 100%;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

/*
 * O vão entre colunas sai da LARGURA da pilha, não de padding na coluna.
 *
 * Padding em % resolve contra a largura do bloco contenedor — aqui a linha de
 * barras inteira, não a fatia. Medido: `padding: 0 7%` virou 61,8px de cada
 * lado numa fatia de 147px e sobrou uma barra de 10px. Largura em % de um item
 * flex resolve contra o pai certo, que é a fatia.
 *
 * O teto é para o outro extremo: com 6 colunas em 1024px, 86% de uma fatia
 * larga ainda dava barra de mais de 100px, e o gráfico lia como bloco, não
 * como série.
 */
.ga-bc__stack {
  position: relative;
  display: flex;
  /*
   * 80%, e não 86%: o vão ENTRE colunas tem que ser visivelmente maior que o
   * vão DENTRO da coluna, senão o par receita/despesa deixa de se ler como
   * par. Medido com 12 meses em 375px: a 86% dava 3,2px contra 2px, quase
   * iguais; a 80% dá 4,5px contra 2px.
   */
  width: 80%;
  max-width: 88px;
  height: 100%;
  align-items: flex-end;
}
/* Lado a lado: cada série é uma barra da largura da fatia dividida. */
.ga-bc__stack--grouped {
  gap: 2px;
}
.ga-bc__stack--grouped .ga-bc__seg {
  flex: 1 1 0;
  min-width: 0;
}
/*
 * Empilhado: `column-reverse` põe a primeira série embaixo, que é a ordem em
 * que a legenda a lista.
 */
.ga-bc__stack--stacked {
  flex-direction: column-reverse;
}
.ga-bc__stack--stacked .ga-bc__seg {
  width: 100%;
}

.ga-bc__seg {
  /* Sem isto o flex encolhe a faixa e a altura em % deixa de valer. */
  flex-shrink: 0;
  border-radius: var(--radius-xs) var(--radius-xs) 0 0;
  /* O realce do topo, sobre a cor da série, que vem do `background-color`
     inline. Ver `--data-bar-sheen`. */
  background-image: var(--data-bar-sheen);
  transition:
    filter var(--dur-fast) var(--ease-out),
    opacity var(--dur-fast) var(--ease-out);
}
/*
 * Empilhado, só a faixa do topo arredonda. Com `column-reverse` o topo visual
 * é o ÚLTIMO filho, então as demais ficam retas — canto redondo no meio da
 * pilha abriria um vão com a cor do card contra a faixa de baixo.
 */
.ga-bc__stack--stacked .ga-bc__seg:not(:last-child) {
  border-radius: 0;
}

/* Hover: as outras colunas recuam, a ativa clareia. Do Lumen. */
.ga-bc--dim .ga-bc__col:not(.ga-bc__col--on) .ga-bc__seg {
  /* 0.55 é o valor do Lumen. Em 0.45 a coluna vizinha some demais e o
     gráfico deixa de ser comparável enquanto o ponteiro está nele. */
  opacity: 0.55;
}
.ga-bc__col--on .ga-bc__seg {
  filter: brightness(1.12);
}

/* ── Linha sobreposta ───────────────────────────────────────────────────── */
.ga-bc__lineSvg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
  pointer-events: none;
}
.ga-bc__point {
  position: absolute;
  width: 6px;
  height: 6px;
  margin: 0 0 -3px -3px;
  border-radius: 50%;
  pointer-events: none;
}

/* ── Tooltip ────────────────────────────────────────────────────────────── */
/*
 * O `bottom` vem inline, do topo da COLUNA — e não do topo do plot. Ancorado
 * no plot, numa coluna baixa o tooltip ficava lá em cima, longe do que
 * explica, e numa coluna alta saía do card e cobria o texto da tela.
 */
.ga-bc__tip {
  position: absolute;
  transform: translateX(-50%);
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  margin-bottom: var(--space-2);
  padding: var(--space-2) var(--space-2-5);
  border-radius: var(--radius-sm);
  background: var(--surface-inverse);
  color: var(--text-inverse);
  box-shadow: var(--shadow-md);
  pointer-events: none;
  white-space: nowrap;
}
/* O fio de 8px descendo até a coluna, como no Lumen. */
.ga-bc__tip::after {
  content: "";
  position: absolute;
  left: 50%;
  bottom: calc(-1 * var(--space-2));
  width: 1px;
  height: var(--space-2);
  background: var(--surface-inverse);
  opacity: 0.6;
}

/*
 * Coluna alta: o tooltip desce e fica sobre a barra. Sem o fio, que apontaria
 * para cima, para lugar nenhum.
 */
.ga-bc__tip--below {
  transform: translate(-50%, 100%);
  margin-bottom: calc(-1 * var(--space-2));
}
.ga-bc__tip--below::after {
  display: none;
}

.ga-bc__tip--start {
  transform: none;
}
.ga-bc__tip--start.ga-bc__tip--below {
  transform: translateY(100%);
}
.ga-bc__tip--start::after {
  left: var(--space-4);
}
.ga-bc__tip--end {
  transform: translateX(-100%);
}
.ga-bc__tip--end.ga-bc__tip--below {
  transform: translate(-100%, 100%);
}
.ga-bc__tip--end::after {
  left: auto;
  right: var(--space-4);
}

.ga-bc__tipLabel {
  font-size: var(--fs-micro);
  letter-spacing: var(--ls-label);
  text-transform: uppercase;
  opacity: 0.65;
}
.ga-bc__tipRow {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--fs-caption);
}
.ga-bc__tipDot {
  width: 8px;
  height: 8px;
  flex-shrink: 0;
  border-radius: 50%;
}
.ga-bc__tipName {
  flex: 1 1 auto;
  opacity: 0.8;
}
.ga-bc__tipValue {
  font-variant-numeric: tabular-nums;
  font-weight: var(--fw-medium);
}

@media (min-width: 768px) {
  .ga-bc__y,
  .ga-bc__plot {
    height: var(--ga-bc-h-md);
  }
}
</style>
