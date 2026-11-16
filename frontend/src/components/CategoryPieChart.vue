<template>
  <div class="pie">
    <span class="pie__label">Gastos por categoria</span>

    <!--
      A legenda com valor e porcentagem faz parte do `GxDonutChart`, ligada ao
      destaque da fatia nos dois sentidos. A lista que existia aqui saiu: eram
      duas legendas para o mesmo gráfico, e só uma reagia ao ponteiro.
    -->
    <GxDonutChart
      v-if="hasData"
      :data="donutItems"
      :format="formatCurrency"
      legend="bottom"
      :size="160"
      :aria-label="`Gastos por categoria. ${ariaSummary}`"
    />

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
import GxDonutChart from "@/design-system/graficos/GxDonutChart.vue";
import { getCategoryBreakdown } from "@/services/api";
import { useFormatters } from "@/services/useFormatters";

/**
 * O GRÁFICO saiu daqui para `GxDonutChart`, na camada `graficos/` do design
 * system. O que sobrou é o que não é gráfico: a casca do card, a busca no
 * backend e o estado vazio.
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
	/*
	 * As consultas `@container` do `charts.css` medem o card. No sistema quem
	 * declara o container é o `.gx-card`; aqui o card é este, então a
	 * declaração vem para cá — sem ela a rosca não empilha no celular.
	 */
	container-type: inline-size;
}

.pie__label {
	font: var(--type-label);
	letter-spacing: var(--ls-label);
	text-transform: uppercase;
	color: var(--text-tertiary);
}

/*
 * O desenho da rosca, o tamanho e a legenda com valor e porcentagem são todos
 * do `GxDonutChart`, e vêm de `graficos/charts.css`. Não há mais nada de
 * gráfico neste arquivo.
 */

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
