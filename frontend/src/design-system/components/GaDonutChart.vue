<template>
  <div class="ga-donut" :style="{ '--ga-donut-size': `${size}px` }">
    <canvas ref="canvasEl" class="ga-donut__canvas" role="img" :aria-label="ariaLabel"></canvas>
  </div>
</template>

<script setup>
/**
 * Rosca — o único gráfico que continua em Chart.js.
 *
 * ACRESCENTADO À SKILL. Ver o cabeçalho de `charts.css` para a proveniência do
 * conjunto; o Lumen não tem rosca, então aqui não há estrutura dele a portar.
 * O que veio de lá é o tratamento do tooltip, igual ao do `GaBarChart`.
 *
 * ── Por que esta ficou em canvas e as barras não ──────────────────────────
 *
 * Barra é um retângulo com altura em porcentagem: em HTML sai mais simples e,
 * principalmente, lê `var(--token)` direto. Arco não — `conic-gradient` desenha
 * o anel, mas não dá fatia com tooltip por fatia nem buraco com borda, e
 * reimplementar isso em SVG seria reescrever o que o Chart.js já faz.
 *
 * ── Como as cores de token chegam ao canvas ───────────────────────────────
 *
 * Canvas não resolve `var(--token)`: o Chart.js recebe string de cor pronta.
 * Em vez de copiar hexa à mão — era o que `CategoryPieChart.vue` fazia com
 * `borderColor: "#ffffff"` —, os tokens são LIDOS do elemento em tempo de
 * execução com `getComputedStyle`. Assim existe uma fonte só, e o tema escuro
 * passa a valer: a borda entre fatias acompanha `--surface-card`.
 *
 * A leitura acontece a cada construção do gráfico. Se um dia houver botão de
 * tema, trocar o tema precisa redesenhar — hoje `data-theme` não é alterado em
 * lugar nenhum do app, então não há o que observar.
 *
 * As cores das FATIAS não saem de token: vêm de `items[].color`, que é a cor
 * que o usuário escolheu para a categoria. É dado, e é o que casa a fatia com
 * a bolinha da legenda.
 */
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from "vue";
import { Chart, ArcElement, DoughnutController, Tooltip } from "chart.js";

/** Só os módulos usados: a legenda é HTML, nas telas que usam o componente. */
Chart.register(ArcElement, DoughnutController, Tooltip);

const props = defineProps({
  /** `{ label, value, color }` por fatia. `value` em centavos, como sempre. */
  items: { type: Array, required: true },

  /** Formata o valor do tooltip. */
  format: { type: Function, required: true },

  /** Lado do quadrado, em px. */
  size: { type: Number, default: 160 },

  /** Tamanho do buraco. */
  cutout: { type: String, default: "65%" },

  ariaLabel: { type: String, required: true },
});

const canvasEl = ref(null);
let chart = null;

const hasData = computed(() => props.items.length > 0);

/** Lê um token do próprio elemento. Ver o cabeçalho. */
function token(name, fallback) {
  if (!canvasEl.value) return fallback;
  const value = getComputedStyle(canvasEl.value).getPropertyValue(name).trim();
  return value || fallback;
}

function destroy() {
  chart?.destroy();
  chart = null;
}

function build() {
  if (!canvasEl.value || !hasData.value) return;

  destroy();

  const surface = token("--surface-card", "#ffffff");

  chart = new Chart(canvasEl.value, {
    type: "doughnut",
    data: {
      labels: props.items.map((item) => item.label),
      datasets: [
        {
          data: props.items.map((item) => item.value),
          backgroundColor: props.items.map((item) => item.color),
          borderWidth: 2,
          // A borda separa as fatias com a cor da superfície do card.
          borderColor: surface,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: props.cutout,
      animation: { duration: 250 },
      plugins: {
        legend: { display: false },
        tooltip: {
          // Mesma pastilha escura do tooltip do GaBarChart.
          backgroundColor: token("--surface-inverse", "#0B0D14"),
          bodyColor: token("--text-inverse", "#ffffff"),
          padding: 8,
          cornerRadius: 6,
          displayColors: false,
          callbacks: {
            label: (ctx) => ` ${props.format(ctx.parsed)}`,
          },
        },
      },
    },
  });
}

/**
 * O canvas só existe quando há dados, então a construção espera o `nextTick`
 * da renderização — construir antes acertaria um `null`.
 */
async function redraw() {
  if (!hasData.value) {
    destroy();
    return;
  }

  await nextTick();
  build();
}

onMounted(redraw);
watch(() => props.items, redraw, { deep: true });
onBeforeUnmount(destroy);
</script>

<style scoped>
.ga-donut {
  position: relative;
  width: var(--ga-donut-size);
  height: var(--ga-donut-size);
  flex-shrink: 0;
}
/*
 * O Chart.js escreve width/height inline no canvas a cada redesenho; em CSS
 * comum o `!important` é o que vence o atributo de estilo.
 */
.ga-donut__canvas {
  width: 100% !important;
  height: 100% !important;
}
</style>
