<template>
  <div class="pie">
    <span class="pie__label">Gastos por categoria</span>

    <!--
      A legenda com valor e porcentagem faz parte do `GxDonutChart`, ligada ao
      destaque da fatia nos dois sentidos. A lista que existia aqui saiu: eram
      duas legendas para o mesmo gráfico, e só uma reagia ao ponteiro.
    -->
    <!--
      Duas medidas para o centro caber, porque a fonte dele é fixa em 26px no
      `charts.css` e o furo encolhe junto com o anel:
        - valor compacto ("R$ 2,1 mil") em vez do cheio;
        - tamanho padrão do componente (184), e não 160 — medido, 160 deixa o
          furo em 110px e um compacto de dez caracteres já passa disso.
      A legenda abaixo continua com o valor exato de cada categoria.
    -->
    <GxDonutChart
      v-if="hasData"
      :data="donutItems"
      :format="formatCurrency"
      :center-value="formatCompactCurrency(totalInCents)"
      center-label="Total do mês"
      legend="bottom"
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

const { formatCurrency, formatCompactCurrency } = useFormatters();

const breakdown = ref([]);
const error = ref("");

const hasData = computed(() => breakdown.value.length > 0);

/**
 * A rosca recebe `{ label, value, color }`; o backend devolve outro formato.
 *
 * ── Por que a cauda é agrupada ───────────────────────────────────────────
 *
 * O README da skill limita a rosca a seis fatias e manda juntar o resto em
 * "Outros". Não é regra estética: com onze categorias, as últimas viram
 * fatias de 4% que ninguém distingue, e a legenda cresce mais que o gráfico.
 *
 * O usuário PODE ter uma categoria chamada "Outros" — é comum. Quando tem, a
 * cauda soma nela em vez de criar uma segunda linha com o mesmo nome, e a cor
 * escolhida por ele é preservada.
 */
const MAX_SLICES = 6;

const donutItems = computed(() => {
  const ordered = [...breakdown.value].sort((a, b) => b.totalInCents - a.totalInCents);

  const toItem = (item) => ({
    label: item.category,
    value: item.totalInCents,
    color: item.color,
  });

  if (ordered.length <= MAX_SLICES) return ordered.map(toItem);

  const head = ordered.slice(0, MAX_SLICES - 1).map(toItem);
  const tail = ordered.slice(MAX_SLICES - 1);
  const tailTotal = tail.reduce((sum, item) => sum + item.totalInCents, 0);

  // Já existe uma categoria "Outros"? Então a cauda entra nela.
  const existing = head.find((item) => item.label.trim().toLowerCase() === "outros");
  if (existing) {
    existing.value += tailTotal;
    return head;
  }

  return [
    ...head,
    {
      label: "Outros",
      value: tailTotal,
      // Cinza do sistema: "Outros" não é uma categoria, é o resto.
      color: "var(--chart-8)",
    },
  ];
});

/** Soma de tudo, inclusive o que foi agrupado. */
const totalInCents = computed(() =>
  breakdown.value.reduce((sum, item) => sum + item.totalInCents, 0)
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
