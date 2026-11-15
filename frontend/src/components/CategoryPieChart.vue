<template>
  <div class="pie">
    <span class="pie__label">Gastos por categoria</span>

    <div v-if="hasData" class="pie__body">
      <GaDonutChart
        :items="donutItems"
        :format="formatCurrency"
        :aria-label="`Gráfico de gastos por categoria. ${ariaSummary}`"
      />

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
import { ref, computed, onMounted, watch } from "vue";
import GaIcon from "@/design-system/components/GaIcon.vue";
import GaDonutChart from "@/design-system/components/GaDonutChart.vue";
import { getCategoryBreakdown } from "@/services/api";
import { useFormatters } from "@/services/useFormatters";

/**
 * O DESENHO da rosca saiu daqui para `GaDonutChart`, no design system. O que
 * sobrou neste arquivo é o que não é gráfico: a casca do card, a busca no
 * backend, o estado vazio e a legenda com o valor de cada categoria.
 *
 * A separação é o que mantém o design system apresentacional — um componente
 * de lá não busca dados.
 */
const props = defineProps({ year: Number, month: Number });

const { formatCurrency } = useFormatters();

const breakdown = ref([]);
const error = ref("");

const hasData = computed(() => breakdown.value.length > 0);

/** A rosca recebe `{ label, value, color }`; o backend devolve outro formato. */
const donutItems = computed(() =>
  breakdown.value.map((item) => ({
    label: item.category,
    value: item.totalInCents,
    color: item.color,
  }))
);

/**
 * As cores agora vêm sempre do backend, que já aplica um padrão via $ifNull
 * na agregação. O mapa CATEGORY_COLORS local, com nomes fixos em minúsculas
 * ("mercado", "combustivel"), foi removido: ele nunca casava com os nomes
 * reais cadastrados pelo usuário e servia só como fallback morto.
 */
const ariaSummary = computed(() =>
  breakdown.value.map((i) => `${i.category}: ${formatCurrency(i.totalInCents)}`).join(", ")
);

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
}

onMounted(refetch);
watch(() => [props.year, props.month], refetch);

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
/* O tamanho da rosca e o truque de `!important` contra o estilo inline que o
   Chart.js escreve moram agora em `GaDonutChart`. */

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
