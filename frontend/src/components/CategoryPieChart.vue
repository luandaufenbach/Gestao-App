<template>
  <div class="pie">
    <span class="pie__label">Gastos por categoria</span>

    <div v-if="hasData" class="pie__body">
      <div class="pie__canvasWrap">
        <canvas
          ref="chartCanvas"
          class="pie__canvas"
          role="img"
          :aria-label="`Gráfico de gastos por categoria. ${ariaSummary}`"
        ></canvas>
      </div>

      <ul class="pie__legend">
        <li v-for="item in breakdown" :key="item.categoryId ?? item.category" class="pie__item">
          <div class="pie__itemName">
            <span class="pie__dot" :style="{ background: item.color }"></span>
            <span>{{ item.category }}</span>
          </div>
          <span class="pie__itemValue">{{ formatCurrency(item.totalInCents) }}</span>
        </li>
      </ul>
    </div>

    <!--
      O estado vazio mostrava o emoji 🍕 em 30px. A skill é explícita: emoji
      não entra na interface — muda de desenho em cada sistema e não segue a
      cor do CSS. No lugar, o ícone Lucide `chart-column`, que é o que o card
      desenha quando tem dados.
    -->
    <div v-else class="pie__empty">
      <GaIcon name="chart-column" :size="28" />
      {{ error || "Sem transações no período" }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick, onBeforeUnmount } from "vue";
import { Chart, ArcElement, DoughnutController, Tooltip } from "chart.js";
import GaIcon from "@/design-system/components/GaIcon.vue";
import { getCategoryBreakdown } from "@/services/api";
import { useFormatters } from "@/services/useFormatters";

/**
 * Registro apenas dos módulos usados — o `Legend` estava registrado mas
 * desativado nas options (`legend: { display: false }`), já que a legenda é
 * renderizada em HTML logo abaixo. Removê-lo reduz o bundle.
 */
Chart.register(ArcElement, DoughnutController, Tooltip);

const props = defineProps({ year: Number, month: Number });

const { formatCurrency } = useFormatters();

const breakdown = ref([]);
const error = ref("");
const chartCanvas = ref(null);
let chartInstance = null;

const hasData = computed(() => breakdown.value.length > 0);

/**
 * As cores agora vêm sempre do backend, que já aplica um padrão via $ifNull
 * na agregação. O mapa CATEGORY_COLORS local, com nomes fixos em minúsculas
 * ("mercado", "combustivel"), foi removido: ele nunca casava com os nomes
 * reais cadastrados pelo usuário e servia só como fallback morto.
 */
const ariaSummary = computed(() =>
  breakdown.value.map((i) => `${i.category}: ${formatCurrency(i.totalInCents)}`).join(", ")
);

function destroyChart() {
  chartInstance?.destroy();
  chartInstance = null;
}

function buildChart() {
  if (!chartCanvas.value || !hasData.value) return;

  destroyChart();

  chartInstance = new Chart(chartCanvas.value, {
    type: "doughnut",
    data: {
      labels: breakdown.value.map((i) => i.category),
      datasets: [
        {
          data: breakdown.value.map((i) => i.totalInCents),
          backgroundColor: breakdown.value.map((i) => i.color),
          borderWidth: 2,
          // A borda separa as fatias com a cor da superfície do card
          // (`--ink-0`). Vai literal porque o Chart.js desenha em canvas, onde
          // `var(--…)` não é resolvido.
          borderColor: "#ffffff",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "65%",
      animation: { duration: 250 },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            // O dataset está em centavos; formatCurrency faz a conversão.
            label: (ctx) => ` ${formatCurrency(ctx.parsed)}`,
          },
        },
      },
    },
  });
}

async function refetch() {
  error.value = "";

  try {
    const data = await getCategoryBreakdown(props.year, props.month);
    breakdown.value = Array.isArray(data) ? data : [];
  } catch (err) {
    // Antes, esta função não tinha try/catch: uma falha na requisição virava
    // uma promise rejeitada solta e o gráfico ficava congelado no mês anterior.
    error.value = err.displayMessage ?? "Erro ao carregar o gráfico";
    breakdown.value = [];
  }

  if (!hasData.value) {
    destroyChart();
    return;
  }

  await nextTick();
  buildChart();
}

onMounted(refetch);
watch(() => [props.year, props.month], refetch);
onBeforeUnmount(destroyChart);

defineExpose({ refetch });
</script>

<style scoped>
/*
 * MIGRADO para o design system gestaoApp (ROADMAP 1.4). Usado só pelo
 * dashboard, então a casca nova não alcança tela fora do escopo.
 *
 * As cores das fatias NÃO foram tocadas: vêm do backend, de cada categoria
 * cadastrada pelo usuário. Trocá-las por tokens apagaria a correspondência
 * entre a fatia, a bolinha da legenda e a cor que o usuário escolheu na tela
 * de categorias.
 */
.pie {
	position: relative;
	z-index: 0;
	display: flex;
	flex-direction: column;
	gap: var(--space-4);
	min-width: 0;
	overflow: hidden;
	padding: var(--card-pad);
	border: 1px solid var(--border-subtle);
	border-radius: var(--radius-card);
	background: var(--surface-card);
	box-shadow: var(--shadow-xs);
	color: var(--text-primary);
}

.pie__label {
	font: var(--type-label);
	letter-spacing: var(--ls-label);
	text-transform: uppercase;
	color: var(--text-tertiary);
}

.pie__body {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: var(--space-4);
}
.pie__canvasWrap {
	position: relative;
	width: 160px;
	height: 160px;
}
/*
 * O Chart.js escreve width/height inline no canvas a cada redesenho. Era
 * `w-full! h-full!` (o `!important` do Tailwind); em CSS comum o `!important`
 * continua sendo o que vence o atributo de estilo.
 */
.pie__canvas {
	width: 100% !important;
	height: 100% !important;
}

.pie__legend {
	display: flex;
	flex-direction: column;
	gap: var(--space-1-5);
	width: 100%;
	margin: 0;
	padding: 0;
	list-style: none;
}
.pie__item {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: var(--space-3);
	font: var(--type-body);
}
.pie__itemName {
	display: flex;
	align-items: center;
	gap: var(--space-2);
	min-width: 0;
	color: var(--text-secondary);
}
.pie__dot {
	width: 12px;
	height: 12px;
	flex-shrink: 0;
	border-radius: 50%;
}
.pie__itemValue {
	font-weight: var(--fw-medium);
	color: var(--text-secondary);
	font-variant-numeric: tabular-nums;
	white-space: nowrap;
}

.pie__empty {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: var(--space-2);
	padding: var(--space-8) 0;
	font: var(--type-small);
	color: var(--text-tertiary);
	text-align: center;
}
</style>
