<template>
  <div ref="el" class="gx-chart" :class="{ 'gx-dim': hover !== null }">
    <svg
      class="gx-svg"
      :width="width"
      :height="height"
      role="img"
      :aria-label="ariaLabel"
      @pointermove="onMove"
      @pointerleave="hover = null"
    >
      <!-- Grade horizontal leve, sem grade vertical, e a linha do zero mais
           firme que as outras — regra de anatomia do README da skill. -->
      <g v-for="tick in layout.ticks" :key="tick">
        <line
          :x1="layout.m.l"
          :x2="width - layout.m.r"
          :y1="layout.y(tick)"
          :y2="layout.y(tick)"
          :class="tick === 0 ? 'gx-base' : 'gx-grid'"
        />
        <text
          :x="layout.m.l - 10"
          :y="layout.y(tick)"
          dy="0.32em"
          text-anchor="end"
          class="gx-tick"
        >
          {{ formatValue(tick, yFormat) }}
        </text>
      </g>

      <!-- Faixa de hover atrás da coluna inteira. -->
      <rect
        v-if="hover !== null"
        class="gx-band"
        :x="layout.m.l + hover * layout.bw + 2"
        :y="layout.m.t - 6"
        :width="layout.bw - 4"
        :height="layout.ih + 6"
        rx="8"
      />

      <path
        v-for="bar in bars"
        :key="bar.key"
        :d="bar.d"
        :fill="bar.fill"
        class="gx-bar"
        :class="{ 'gx-bar--neg': bar.neg, 'is-on': hover === bar.i }"
        :style="{ animationDelay: `${Math.min(bar.i * 30, 300)}ms` }"
      />

      <!-- Rótulos do eixo X, pulando de `step` em `step` quando não cabem. -->
      <template v-for="(row, index) in data" :key="`x${index}`">
        <text
          v-if="index % layout.step === 0"
          :x="layout.m.l + index * layout.bw + layout.bw / 2"
          :y="height - 8"
          text-anchor="middle"
          class="gx-tick"
        >
          {{ xLabel(index) }}
        </text>
      </template>
    </svg>

    <!--
      Tooltip escuro que segue o ponteiro, com uma linha por série. Vira para o
      outro lado depois de 58% da largura para não sair do card.
    -->
    <div
      v-if="hover !== null"
      class="gx-tip"
      :style="tipStyle"
      role="status"
      aria-live="polite"
    >
      <div class="gx-tip__t">{{ xLabel(hover) }}</div>
      <div v-for="row in tipRows" :key="row.label" class="gx-tip__r">
        <span class="gx-tip__sw" :style="{ background: row.color }"></span>
        <span class="gx-tip__l">{{ row.label }}</span>
        <span class="gx-tip__v">{{ row.value }}</span>
      </div>
      <div v-if="tipFooter" class="gx-tip__f">{{ tipFooter }}</div>
    </div>

    <!--
      Tabela oculta com os dados: a regra de acessibilidade da skill é que todo
      gráfico cartesiano traga uma, porque cor e posição não chegam ao leitor
      de tela.

      O `.gx-sr` vai num `div` em volta, e não na própria `table`. A classe
      esconde pelo método clássico (`width:1px` + `overflow:hidden` + `clip`),
      e isso não funciona em `<table>`: tabela usa layout automático e trata
      `width:1px` como mínimo de conteúdo. Medido em 375px, a tabela ficava com
      277px e criava 54px de rolagem horizontal na página. Num `div`, a largura
      vale e a tabela dentro é recortada.
    -->
    <div class="gx-sr">
      <table>
        <caption>{{ ariaLabel }}</caption>
        <thead>
          <tr>
            <th scope="col"></th>
            <th v-for="item in visible" :key="item.serie.key" scope="col">
              {{ item.serie.label }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, index) in data" :key="index">
            <td>{{ xLabel(index) }}</td>
            <td v-for="item in visible" :key="item.serie.key">
              {{ formatValue(row[item.serie.key], yFormat) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
/**
 * Colunas verticais — porte de `graficos/components/cartesian/ColumnChart.jsx`
 * da skill `gestaoapp-design`.
 *
 * Comparar quantias entre poucos períodos ou categorias, até 12 colunas; mais
 * que isso o README manda usar linha. Aceita série única, agrupada ou
 * empilhada, valores negativos e realce em zest para o período atual.
 *
 * ── O que NÃO foi portado, e por quê ──────────────────────────────────────
 *
 *   showValues    rótulo do valor em cima da coluna: com doze meses de reais
 *                 em 375px os números se sobrepõem
 *   references    linhas de meta: nenhuma tela de dinheiro tem meta por mês
 *   onSelect      drill-down: não há para onde descer hoje
 *   WrapLabel     quebra do rótulo em duas linhas: os rótulos daqui são
 *                 "nov/26", que nunca quebram
 *
 * Nada disso foi adaptado ou reinterpretado — ficou de fora inteiro, para o
 * arquivo continuar comparável com o da skill.
 */
import { ref, computed } from "vue";
import {
  useElementWidth,
  niceTicks,
  formatValue,
  seriesColor,
  barPath,
  textWidth,
  tickStep,
  tickCount,
  bandIndex,
} from "./chartCore";

const props = defineProps({
  /** Linhas de dados. Cada uma traz `xKey` e as chaves das séries. */
  data: { type: Array, required: true },

  xKey: { type: String, default: "label" },

  /** `{ key, label, color?, format? }`. A cor sai da paleta quando omitida. */
  series: { type: Array, default: () => [{ key: "value", label: "Valor" }] },

  mode: {
    type: String,
    default: "grouped",
    validator: (value) => ["grouped", "stacked"].includes(value),
  },

  height: { type: Number, default: 240 },

  /** Nome de formato do `chartCore` ou função. Ver a nota em `formatValue`. */
  yFormat: { type: [String, Function], default: null },

  /** Transforma o valor do eixo X em rótulo. */
  xFormat: { type: Function, default: null },

  /** Índice (ou predicado) da coluna em zest. Só com série única. */
  highlight: { type: [Number, Function], default: null },

  /** Chaves de série escondidas pela legenda. */
  hidden: { type: Array, default: () => [] },

  maxBarWidth: { type: Number, default: 36 },
  radius: { type: Number, default: 6 },

  ariaLabel: { type: String, required: true },
});

const { el, width } = useElementWidth();
const hover = ref(null);

const visible = computed(() =>
  props.series
    .map((serie, index) => ({ serie, color: seriesColor(index, serie.color) }))
    .filter((item) => !props.hidden.includes(item.serie.key))
);

const isHighlighted = (row, index) =>
  typeof props.highlight === "function" ? props.highlight(row, index) : props.highlight === index;

const xLabel = (index) => {
  const value = props.data[index]?.[props.xKey];
  return props.xFormat ? props.xFormat(value, index) : value;
};

/**
 * Escala e margens. A margem esquerda sai da largura do maior rótulo do eixo,
 * medida em caracteres — é o que evita o número encostar na grade quando o
 * valor passa de milhar.
 */
const layout = computed(() => {
  const items = visible.value;
  const k = items.length || 1;
  const n = props.data.length;

  let lo = 0;
  let hi = 0;

  props.data.forEach((row) => {
    if (props.mode === "stacked") {
      let positive = 0;
      let negative = 0;
      items.forEach((item) => {
        const value = row[item.serie.key] || 0;
        if (value >= 0) positive += value;
        else negative += value;
      });
      hi = Math.max(hi, positive);
      lo = Math.min(lo, negative);
    } else {
      items.forEach((item) => {
        const value = row[item.serie.key] || 0;
        hi = Math.max(hi, value);
        lo = Math.min(lo, value);
      });
    }
  });

  const ticks = niceTicks(lo, hi || 1, tickCount(props.height));
  const yMin = ticks[0];
  const yMax = ticks[ticks.length - 1];

  const labelW = Math.max(...ticks.map((tick) => textWidth(formatValue(tick, props.yFormat))));
  const m = { t: 12, r: 8, b: 28, l: Math.ceil(labelW) + 12 };

  const iw = Math.max(10, width.value - m.l - m.r);
  const ih = Math.max(10, props.height - m.t - m.b);
  const bw = iw / Math.max(1, n);

  const groupW = Math.min(bw * (k > 1 ? 0.78 : 0.62), props.maxBarWidth * (props.mode === "stacked" ? 1 : k));
  const gap = props.mode === "grouped" && k > 1 ? 3 : 0;
  const barW = props.mode === "stacked" ? groupW : (groupW - gap * (k - 1)) / k;

  const y = (value) => m.t + ih - ((value - yMin) / (yMax - yMin || 1)) * ih;

  return { ticks, m, iw, ih, bw, groupW, gap, barW, y, y0: y(0), k, step: tickStep(n, iw, 44) };
});

const bars = computed(() => {
  const out = [];
  const { m, bw, groupW, gap, barW, y, y0, k } = layout.value;
  const items = visible.value;

  props.data.forEach((row, i) => {
    const gx = m.l + i * bw + (bw - groupW) / 2;
    let positive = 0;
    let negative = 0;

    // No empilhado só a faixa do topo arredonda; as de baixo ficam retas.
    let topIndex = -1;
    if (props.mode === "stacked") {
      items.forEach((item, j) => {
        if ((row[item.serie.key] || 0) > 0) topIndex = j;
      });
    }

    items.forEach((item, j) => {
      const value = row[item.serie.key];
      if (value == null || value === 0) return;

      let x;
      let yA;
      let yB;
      let dir;

      if (props.mode === "stacked") {
        x = gx;
        if (value > 0) {
          yA = y(positive + value);
          yB = y(positive);
          positive += value;
          dir = j === topIndex ? "up" : "none";
        } else {
          yA = y(negative);
          yB = y(negative + value);
          negative += value;
          dir = "down";
        }
      } else {
        x = gx + j * (barW + gap);
        if (value > 0) {
          yA = y(value);
          yB = y0;
          dir = "up";
        } else {
          yA = y0;
          yB = y(value);
          dir = "down";
        }
      }

      const highlighted = isHighlighted(row, i) && k === 1;

      out.push({
        key: `${i}-${j}`,
        i,
        d: barPath(x, yA, barW, Math.max(1, yB - yA), props.radius, dir),
        fill: highlighted ? "var(--chart-highlight)" : item.color,
        neg: value < 0,
      });
    });
  });

  return out;
});

const tipRows = computed(() => {
  if (hover.value === null) return [];
  const row = props.data[hover.value];

  return visible.value
    .filter((item) => (row[item.serie.key] ?? 0) !== 0 || visible.value.length <= 2)
    .map((item) => ({
      color:
        isHighlighted(row, hover.value) && layout.value.k === 1
          ? "var(--chart-highlight)"
          : item.color,
      label: item.serie.label,
      value: formatValue(row[item.serie.key], item.serie.format || props.yFormat),
    }));
});

/** Total só faz sentido quando as faixas somam uma coluna. */
const tipFooter = computed(() => {
  if (hover.value === null || props.mode !== "stacked" || layout.value.k <= 1) return null;

  const row = props.data[hover.value];
  const total = visible.value.reduce((sum, item) => sum + (row[item.serie.key] || 0), 0);

  return `Total: ${formatValue(total, props.yFormat)}`;
});

const tipStyle = computed(() => {
  const { m, bw, ih } = layout.value;
  const x = m.l + hover.value * bw + bw / 2;
  const flip = x > width.value * 0.58;

  return {
    left: `${x}px`,
    top: `${m.t + ih / 2}px`,
    transform: `translate(${flip ? "calc(-100% - 14px)" : "14px"}, -50%)`,
  };
});

function onMove(event) {
  const { m, iw } = layout.value;
  hover.value = bandIndex(
    event.clientX,
    event.currentTarget.getBoundingClientRect(),
    m.l,
    iw,
    props.data.length
  );
}
</script>
