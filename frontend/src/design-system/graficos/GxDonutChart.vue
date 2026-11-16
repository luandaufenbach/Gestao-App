<template>
  <div class="gx-donut" :class="{ 'gx-donut--bottom': legend === 'bottom' }">
    <div class="gx-donut__fig" :style="{ width: `${size}px`, height: `${size}px` }">
      <svg
        :width="size"
        :height="size"
        :viewBox="`0 0 ${size} ${size}`"
        role="img"
        :aria-label="ariaLabel"
      >
        <circle :cx="c" :cy="c" :r="r" fill="none" stroke="var(--chart-track)" :stroke-width="sw" />

        <!--
          Cada fatia é um arco feito de `stroke-dasharray` num círculo só: um
          traço do tamanho da fatia e o resto vazio, deslocado pelo acumulado.
          É assim que a skill desenha a rosca sem biblioteca de gráfico.
        -->
        <g :transform="`rotate(-90 ${c} ${c})`">
          <circle
            v-for="seg in segments"
            :key="seg.i"
            class="gx-donut__seg"
            :cx="c"
            :cy="c"
            :r="r"
            fill="none"
            :stroke="seg.color"
            :stroke-width="hover === seg.i ? sw + 6 : sw"
            :stroke-dasharray="`${seg.len} ${circumference - seg.len}`"
            :stroke-dashoffset="seg.off"
            :opacity="hover !== null && hover !== seg.i ? 0.35 : 1"
            @pointerenter="hover = seg.i"
            @pointerleave="hover = null"
          />
        </g>
      </svg>

      <!-- O centro troca para a fatia sob o ponteiro e volta ao total ao sair. -->
      <div class="gx-donut__center">
        <span class="gx-donut__cv">{{ centerCurrentValue }}</span>
        <span class="gx-donut__cl">{{ hovered ? hovered.label : centerLabel }}</span>
      </div>
    </div>

    <div v-if="legend !== 'none'" class="gx-donut__list">
      <div
        v-for="seg in segments"
        :key="seg.i"
        class="gx-donut__row"
        :class="{ 'is-on': hover === seg.i }"
        @pointerenter="hover = seg.i"
        @pointerleave="hover = null"
      >
        <span class="gx-donut__sw" :style="{ background: seg.color }"></span>
        <span>{{ seg.label }}</span>
        <span class="gx-donut__v">{{ formatValue(seg.value, format) }}</span>
        <span class="gx-donut__p">{{ showPercent ? percent(seg.frac) : "" }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * Rosca — porte de `graficos/components/proportion/DonutChart.jsx` da skill
 * `gestaoapp-design`.
 *
 * Composição de um total, 2 a 6 fatias; acima disso o README manda agrupar a
 * cauda em "Outros". A legenda faz parte do componente, com valor e
 * porcentagem, e é ligada ao destaque da fatia nos dois sentidos.
 *
 * ── Isto é o que tirou o Chart.js do projeto ──────────────────────────────
 *
 * A rosca era o último gráfico em canvas, e canvas não resolve `var(--token)`:
 * a borda entre fatias ficava `#ffffff` escrito à mão. Aqui o arco é um
 * `stroke-dasharray` num `<circle>`, o token vale direto e o tema escuro
 * funciona sem segunda lista de cores.
 *
 * A variante `pie` do original não veio: nenhuma tela usa, e sem o furo o
 * centro com o total — que é metade do valor do componente — deixa de existir.
 */
import { ref, computed } from "vue";
import { formatValue, seriesColor } from "./chartCore";

const props = defineProps({
  /** `{ label, value, color? }`. Sem cor, sai da paleta categórica em ordem. */
  data: { type: Array, required: true },

  size: { type: Number, default: 184 },
  thickness: { type: Number, default: 22 },

  centerLabel: { type: String, default: "Total" },

  /** Nome de formato do `chartCore` ou função. Ver a nota em `formatValue`. */
  format: { type: [String, Function], default: null },

  legend: {
    type: String,
    default: "right",
    validator: (value) => ["right", "bottom", "none"].includes(value),
  },

  showPercent: { type: Boolean, default: true },

  /** Vão entre fatias, em px de contorno. */
  gap: { type: Number, default: 2 },

  ariaLabel: { type: String, required: true },
});

const hover = ref(null);

const sw = computed(() => props.thickness);
const r = computed(() => (props.size - props.thickness) / 2 - 3);
const c = computed(() => props.size / 2);
const circumference = computed(() => 2 * Math.PI * r.value);

const total = computed(() => props.data.reduce((sum, item) => sum + (item.value || 0), 0));

const segments = computed(() => {
  let acc = 0;

  return props.data.map((item, i) => {
    const frac = total.value ? (item.value || 0) / total.value : 0;
    const len = Math.max(0, frac * circumference.value - (props.data.length > 1 ? props.gap : 0));
    const seg = {
      i,
      label: item.label,
      value: item.value,
      color: seriesColor(i, item.color),
      len,
      off: -acc * circumference.value,
      frac,
    };
    acc += frac;
    return seg;
  });
});

const hovered = computed(() => (hover.value !== null ? segments.value[hover.value] : null));

const percent = (frac) => formatValue(Math.round(frac * 1000) / 10, "percent");

const centerCurrentValue = computed(() => {
  if (hovered.value) {
    return props.showPercent
      ? percent(hovered.value.frac)
      : formatValue(hovered.value.value, props.format);
  }
  return formatValue(total.value, props.format);
});
</script>
