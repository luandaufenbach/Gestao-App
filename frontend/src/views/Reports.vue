<template>
  <div class="rep">
    <header class="rep__head">
      <div class="rep__headText">
        <h1 class="rep__title">Relatórios</h1>
        <p class="rep__subtitle">
          Como foram os últimos meses, até o mês atual: evolução, categorias e variação.
        </p>
      </div>

      <!--
        Seletor de janela. `aria-pressed` e não `aria-current`: são botões que
        mudam o conteúdo da própria tela, não links para outro lugar.
      -->
      <div class="rep__windows" role="group" aria-label="Tamanho da janela">
        <button
          v-for="option in REPORT_WINDOWS"
          :key="option"
          type="button"
          class="rep__window"
          :class="{ 'rep__window--active': option === months }"
          :aria-pressed="option === months"
          @click="setMonths(option)"
        >
          {{ option }} meses
        </button>
      </div>
    </header>

    <p v-if="loading" class="rep__state">Carregando...</p>

    <PaywallNotice v-else-if="paywalled" title="Relatórios fazem parte do Pro" :message="error" />

    <p v-else-if="error" class="rep__state rep__state--error">{{ error }}</p>

    <template v-else>
      <!-- Mesmo ritmo dos cards do dashboard: rótulo miúdo em maiúsculas, o
           número em destaque, composição embaixo. -->
      <section class="rep__total">
        <div class="rep__totalHead">
          <span class="rep__label">Nos últimos {{ months }} meses</span>
          <span class="rep__labelIcon">
            <GaIcon name="trending-up" :size="16" />
          </span>
        </div>

        <p class="rep__totalValue" :class="resultClass(totals.netResultInCents)">
          {{ formatCurrency(totals.netResultInCents) }}
        </p>
        <p class="rep__totalCaption">
          resultado do período: receita menos despesa, mês a mês somado
        </p>

        <dl class="rep__lines">
          <div class="rep__line">
            <dt>Receita</dt>
            <dd>{{ formatCurrency(totals.incomeInCents) }}</dd>
          </div>
          <div class="rep__line">
            <dt>Despesa</dt>
            <dd>{{ formatCurrency(totals.expenseInCents) }}</dd>
          </div>
          <div class="rep__line">
            <dt>Despesa média por mês</dt>
            <dd>{{ formatCurrency(totals.averageExpenseInCents) }}</dd>
          </div>
        </dl>

        <!--
          O aviso é o que impede a leitura errada: este número NÃO é saldo em
          conta. A compra no crédito conta no mês em que foi feita, e o
          pagamento da fatura não conta de novo.
        -->
        <GaNote tone="info" icon="info">
          Despesa aqui é por <strong>competência</strong>: a compra no crédito pesa no mês em que
          foi feita, e o pagamento da fatura não conta outra vez. Para saber quando o dinheiro sai
          da conta, veja a projeção.
        </GaNote>
      </section>

      <section v-if="isEmpty" class="rep__empty">
        <p class="rep__emptyTitle">Nenhuma receita ou despesa nos últimos {{ months }} meses.</p>
        <p class="rep__emptyText">
          Lance receitas e despesas para o relatório ter o que comparar. Com dois meses de
          histórico, a variação mês a mês já aparece.
        </p>
      </section>

      <template v-else>
        <!-- ── Evolução por mês ───────────────────────────────────────── -->
        <section class="rep__card">
          <div class="rep__cardHead">
            <span class="rep__label">Evolução por mês</span>
          </div>

          <div class="rep__canvasWrap">
            <canvas
              ref="evolutionCanvas"
              class="rep__canvas"
              role="img"
              :aria-label="`Receita, despesa e resultado de cada mês. ${evolutionSummary}`"
            ></canvas>
          </div>

          <ul class="rep__legend">
            <li class="rep__legendItem">
              <span class="rep__swatch rep__swatch--income"></span>
              Receita
            </li>
            <li class="rep__legendItem">
              <span class="rep__swatch rep__swatch--expense"></span>
              Despesa
            </li>
            <li class="rep__legendItem">
              <span class="rep__swatch rep__swatch--result"></span>
              Resultado
            </li>
          </ul>
        </section>

        <!-- ── Comparativo por categoria ──────────────────────────────── -->
        <section class="rep__card">
          <div class="rep__cardHead">
            <span class="rep__label">Comparativo por categoria</span>
          </div>

          <template v-if="chartCategories.length">
            <div class="rep__canvasWrap">
              <canvas
                ref="categoriesCanvas"
                class="rep__canvas"
                role="img"
                :aria-label="`Despesa por categoria em cada mês. ${categoriesSummary}`"
              ></canvas>
            </div>

            <!-- A legenda é HTML, e não a do Chart.js: ela carrega também o
                 total da janela de cada categoria, que o gráfico não mostra. -->
            <ul class="rep__legend rep__legend--stack">
              <li
                v-for="item in chartCategories"
                :key="item.categoryId ?? item.category"
                class="rep__legendRow"
              >
                <span class="rep__legendName">
                  <!-- A cor é da categoria, escolhida pelo usuário: é dado. -->
                  <span class="rep__dot" :style="{ background: item.color }"></span>
                  <span class="rep__legendText">{{ item.category }}</span>
                </span>
                <span class="rep__legendValue">{{ formatCurrency(item.totalInCents) }}</span>
              </li>
            </ul>
          </template>

          <p v-else class="rep__nothing">Nenhuma despesa com categoria no período.</p>
        </section>

        <!-- ── Variação mês a mês ─────────────────────────────────────── -->
        <section class="rep__card">
          <div class="rep__cardHead">
            <span class="rep__label">Variação mês a mês</span>
          </div>

          <ul class="rep__months">
            <li v-for="item in series" :key="item.month" class="rep__month">
              <div class="rep__monthTop">
                <span class="rep__monthLabel">
                  {{ item.label }}
                  <span v-if="item.month === currentMonth" class="rep__currentTag"
                    >(mês atual)</span
                  >
                </span>

                <span class="rep__monthEnd">
                  <span
                    class="rep__monthValue"
                    :class="{ 'rep__monthValue--zero': item.expenseInCents === 0 }"
                  >
                    {{ formatCurrency(item.expenseInCents) }}
                  </span>
                  <!--
                    Gasto que SUBIU é vermelho e gasto que CAIU é verde: aqui a
                    cor fala do bolso, não do sinal do número.
                  -->
                  <span class="rep__delta" :class="deltaClass(item.change.expenseInCents)">
                    {{ deltaLabel(item.change) }}
                  </span>
                </span>
              </div>

              <!-- Barra de proporção: a régua é o mês de maior despesa. -->
              <div class="rep__bar">
                <div class="rep__barFill" :style="{ width: barPercent(item) + '%' }"></div>
              </div>

              <p class="rep__monthSummary">{{ summaryLine(item) }}</p>
            </li>
          </ul>
        </section>
      </template>
    </template>

    <!--
      O FAB da barra inferior abre "Nova transação": esta tela é de leitura e
      não tem ação de criar própria. Criar um lançamento MUDA a série, então o
      `load()` roda depois — sem ele a tela ficaria mostrando o número velho.
    -->
    <NewTransactionalModal
      v-if="showNewTransaction"
      @close="showNewTransaction = false"
      @transaction-created="handleTransactionCreated"
    />
  </div>
</template>

<script setup>
/**
 * Relatórios de 3 a 12 meses (ROADMAP 1.2).
 *
 * Três perguntas, uma por seção, na ordem em que se olha:
 *
 *   evolução por mês        receita, despesa e resultado de cada mês
 *   comparativo por categoria  para onde o dinheiro foi, mês a mês
 *   variação mês a mês      subiu ou caiu em relação ao mês anterior
 *
 * ── Por que é tela própria, e não card no dashboard ──────────────────────
 *
 * Pelo mesmo motivo da projeção: o dashboard é governado pela navegação de
 * mês, e esta série não é — ela termina sempre no mês corrente, porque
 * `GET /reports/monthly` não aceita year/month. Um card que ignorasse as setas
 * de mês ao lado de cinco que as obedecem pareceria quebrado.
 *
 * ── Competência, não caixa ───────────────────────────────────────────────
 *
 * A despesa de cada mês é a do mês da COMPRA, incluindo o crédito, e o
 * pagamento de fatura não entra. É a pergunta "quanto a minha vida custou em
 * setembro". A projeção responde a outra, "quando o dinheiro sai da conta", e
 * por isso conta a fatura no mês do vencimento. Misturar as duas contaria o
 * mesmo gasto duas vezes — ver o cabeçalho do `reportController.js`.
 *
 * ── Chart.js em canvas: a cor vai literal ────────────────────────────────
 *
 * O Chart.js desenha em canvas, onde `var(--token)` não é resolvido. Os hexes
 * abaixo são os dos tokens do design system, copiados à mão, como já acontece
 * no gráfico de rosca do dashboard (ver CategoryPieChart.vue). As cores das
 * categorias NÃO são daqui: vêm do backend, de cada categoria cadastrada pelo
 * usuário, e por isso casam com a bolinha da legenda.
 */
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from "vue";
import {
  Chart,
  BarController,
  BarElement,
  LineController,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
} from "chart.js";
import GaIcon from "@/design-system/components/GaIcon.vue";
import GaNote from "@/design-system/components/GaNote.vue";
import NewTransactionalModal from "../components/NewTransactionalModal.vue";
import PaywallNotice from "../components/PaywallNotice.vue";
import { useFormatters } from "../services/useFormatters";
import { useReports, REPORT_WINDOWS } from "../services/useReports";
import { definePageAction } from "../stores/pageAction";

/**
 * Só os módulos usados. `Legend` fica de fora porque as duas legendas são
 * HTML: a de categorias precisa mostrar o total da janela ao lado do nome, e
 * a do Chart.js não tem onde pôr isso.
 */
Chart.register(
  BarController,
  BarElement,
  LineController,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip
);

/** Hexes dos tokens — ver o comentário sobre canvas no cabeçalho. */
const COLOR_INCOME = "#22A355"; // --green-500
const COLOR_EXPENSE = "#E5484D"; // --red-500
const COLOR_RESULT = "#2E44F0"; // --cobalt-500
const COLOR_GRID = "#ECEEF3"; // --ink-100
const COLOR_TICK = "#9DA2AE"; // --ink-400
const COLOR_SURFACE = "#FFFFFF"; // --ink-0

const { formatCurrency, formatCompactCurrency } = useFormatters();

const {
  months,
  series,
  totals,
  chartCategories,
  loading,
  error,
  paywalled,
  isEmpty,
  peakExpenseInCents,
  load,
  setMonths,
} = useReports();

const evolutionCanvas = ref(null);
const categoriesCanvas = ref(null);
let evolutionChart = null;
let categoriesChart = null;

/** Modal de "Nova transação", aberto só pelo FAB da barra inferior. */
const showNewTransaction = ref(false);

definePageAction({
  label: "Nova transação",
  run: () => (showNewTransaction.value = true),
});

function handleTransactionCreated() {
  showNewTransaction.value = false;
  load();
}

/**
 * Mês corrente em UTC, no formato do campo `month` da resposta.
 *
 * Em UTC pelo motivo de sempre: no fuso local todo dia 1º cai no mês anterior
 * e a marca "(mês atual)" iria para a linha errada.
 */
const currentMonth = computed(() => {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
});

/**
 * Rótulo curto do eixo: "nov/26".
 *
 * O `label` que vem do backend é "novembro de 2026" — com doze meses no eixo,
 * o Chart.js o gira na diagonal e o gráfico perde metade da altura.
 */
const MONTH_ABBR = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
];

function shortLabel(month) {
  const [year, monthNumber] = String(month).split("-");
  return `${MONTH_ABBR[Number(monthNumber) - 1] ?? month}/${year.slice(2)}`;
}

const axisLabels = computed(() => series.value.map((item) => shortLabel(item.month)));

const evolutionSummary = computed(() =>
  series.value
    .map(
      (item) =>
        `${item.label}: receita ${formatCurrency(item.incomeInCents)}, despesa ${formatCurrency(
          item.expenseInCents
        )}, resultado ${formatCurrency(item.netResultInCents)}`
    )
    .join(". ")
);

const categoriesSummary = computed(() =>
  chartCategories.value
    .map((item) => `${item.category}: ${formatCurrency(item.totalInCents)} no período`)
    .join(", ")
);

/** Eixo de valor: mesmas opções nos dois gráficos. */
const valueAxis = (stacked = false) => ({
  stacked,
  beginAtZero: true,
  border: { display: false },
  grid: { color: COLOR_GRID },
  ticks: {
    color: COLOR_TICK,
    font: { size: 11 },
    // O eixo recebe centavos; a conversão é do formatador, como sempre.
    callback: (value) => formatCompactCurrency(value),
  },
});

const monthAxis = (stacked = false) => ({
  stacked,
  grid: { display: false },
  border: { display: false },
  ticks: { color: COLOR_TICK, font: { size: 11 } },
});

const currencyTooltip = {
  callbacks: {
    label: (ctx) => ` ${ctx.dataset.label}: ${formatCurrency(ctx.parsed.y)}`,
  },
};

function destroyCharts() {
  evolutionChart?.destroy();
  evolutionChart = null;
  categoriesChart?.destroy();
  categoriesChart = null;
}

function buildEvolutionChart() {
  if (!evolutionCanvas.value) return;

  evolutionChart?.destroy();

  evolutionChart = new Chart(evolutionCanvas.value, {
    type: "bar",
    data: {
      labels: axisLabels.value,
      datasets: [
        {
          label: "Receita",
          data: series.value.map((item) => item.incomeInCents),
          backgroundColor: COLOR_INCOME,
          borderRadius: 4,
          // `order` maior desenha ANTES: as barras ficam atrás da linha.
          order: 2,
        },
        {
          label: "Despesa",
          data: series.value.map((item) => item.expenseInCents),
          backgroundColor: COLOR_EXPENSE,
          borderRadius: 4,
          order: 2,
        },
        {
          /**
           * O resultado é linha, e não uma terceira barra: ele pode ser
           * negativo, e barra negativa ao lado de duas positivas se lê como
           * "gastei menos", quando significa o contrário.
           */
          type: "line",
          label: "Resultado",
          data: series.value.map((item) => item.netResultInCents),
          borderColor: COLOR_RESULT,
          backgroundColor: COLOR_SURFACE,
          borderWidth: 2,
          pointRadius: 3,
          pointBackgroundColor: COLOR_RESULT,
          tension: 0.25,
          order: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 250 },
      interaction: { mode: "index", intersect: false },
      scales: { x: monthAxis(), y: valueAxis() },
      plugins: { legend: { display: false }, tooltip: currencyTooltip },
    },
  });
}

function buildCategoriesChart() {
  if (!categoriesCanvas.value || chartCategories.value.length === 0) return;

  categoriesChart?.destroy();

  categoriesChart = new Chart(categoriesCanvas.value, {
    type: "bar",
    data: {
      labels: axisLabels.value,
      /**
       * Barras EMPILHADAS: a altura da coluna é a despesa total do mês, e cada
       * faixa é uma categoria. Lado a lado, doze meses × seis categorias dariam
       * 72 barras de dois pixels em 375px.
       *
       * `monthlyInCents` já vem alinhado posição por posição com a série, então
       * o dataset vai direto, sem procurar mês por chave.
       */
      datasets: chartCategories.value.map((item) => ({
        label: item.category,
        data: item.monthlyInCents,
        backgroundColor: item.color,
        borderRadius: 2,
      })),
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 250 },
      scales: { x: monthAxis(true), y: valueAxis(true) },
      plugins: {
        legend: { display: false },
        tooltip: {
          ...currencyTooltip,
          // Categoria com zero no mês não vira linha de tooltip: com seis
          // categorias, a caixa viraria uma lista de zeros.
          filter: (ctx) => ctx.parsed.y > 0,
        },
      },
    },
  });
}

/** Largura da barra do mês, de 0 a 100, relativa ao mês de maior despesa. */
function barPercent(item) {
  const expense = item?.expenseInCents ?? 0;
  if (peakExpenseInCents.value <= 0 || expense <= 0) return 0;

  // Piso de 2%: sem ele, um mês pequeno ao lado de um mês muito grande
  // arredonda para largura zero, visualmente igual a "não gastei nada".
  return Math.max(2, Math.round((expense / peakExpenseInCents.value) * 100));
}

const resultClass = (value) => (value > 0 ? "rep__value--up" : value < 0 ? "rep__value--down" : "");

/** Gasto que subiu é ruim; gasto que caiu é bom. */
const deltaClass = (value) =>
  value > 0 ? "rep__delta--worse" : value < 0 ? "rep__delta--better" : "rep__delta--flat";

/**
 * Rótulo da variação da despesa.
 *
 * O percentual vem `null` quando o mês anterior foi zero — não existe
 * percentual a partir de zero. Nesse caso mostramos o valor, que é o dado que
 * existe, em vez de um "+100%" inventado.
 */
function deltaLabel(change) {
  const value = change?.expenseInCents ?? 0;

  if (value === 0) return "sem mudança";

  const signal = value > 0 ? "+" : "−";
  const percent = change?.expensePercent;

  if (percent === null || percent === undefined) {
    return `${signal}${formatCurrency(Math.abs(value))}`;
  }

  return `${signal}${Math.abs(percent).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
}

/** Resumo miúdo da linha: de onde veio o número daquele mês. */
function summaryLine(item) {
  const parts = [`receita ${formatCurrency(item.incomeInCents)}`];

  if (item.creditExpenseInCents > 0) {
    parts.push(`crédito ${formatCurrency(item.creditExpenseInCents)}`);
  }
  if (item.debitExpenseInCents > 0) {
    parts.push(`débito ${formatCurrency(item.debitExpenseInCents)}`);
  }

  parts.push(`resultado ${formatCurrency(item.netResultInCents)}`);

  return parts.join(" · ");
}

/**
 * Os gráficos são construídos DEPOIS do `nextTick`: o canvas só existe no DOM
 * quando a série já tem dados (`v-if`), e construir antes acertaria um `null`.
 */
async function drawCharts() {
  if (isEmpty.value || series.value.length === 0) {
    destroyCharts();
    return;
  }

  await nextTick();
  buildEvolutionChart();
  buildCategoriesChart();
}

/**
 * Um `watch` só, e nenhum desenho no `onMounted`: a série muda uma vez por
 * carregamento (primeira carga e troca de janela), e é essa mudança que manda
 * redesenhar. Desenhar também no `onMounted` construiria o gráfico duas vezes
 * na abertura — a primeira sobre um canvas que ainda não existe.
 */
watch([series, chartCategories], drawCharts);

onMounted(load);

onBeforeUnmount(destroyCharts);
</script>

<style scoped>
/*
 * Tela nova, já no design system gestaoApp: os tokens, os cards e o ritmo
 * vieram da Projeção, que é a vizinha mais próxima — mesma casca (`AppShell`),
 * mesmo cabeçalho, mesmo card de total, mesma barra de proporção.
 */
.rep {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

/* ── Cabeçalho e seletor de janela ─────────────────────────────────────── */
.rep__head {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}
@media (min-width: 768px) {
  .rep__head {
    flex-direction: row;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--space-6);
  }
}

.rep__headText {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}
.rep__title {
  font: var(--type-page-title);
  letter-spacing: var(--ls-heading);
}
.rep__subtitle {
  font: var(--type-small);
  color: var(--text-secondary);
}

/* Controle segmentado. Em 375px os três botões dividem a largura inteira. */
.rep__windows {
  display: flex;
  flex-shrink: 0;
  gap: var(--space-1);
  padding: var(--space-1);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-pill);
  background: var(--surface-card);
}
.rep__window {
  flex: 1;
  /* 36px de alvo mínimo; com o padding do grupo a linha passa dos 44. */
  min-height: 36px;
  padding: 0 var(--space-3);
  border: 0;
  border-radius: var(--radius-pill);
  background: transparent;
  color: var(--text-secondary);
  font: var(--type-small);
  white-space: nowrap;
  cursor: pointer;
  transition:
    background var(--dur-fast) var(--ease-out),
    color var(--dur-fast) var(--ease-out);
}
.rep__window:hover {
  background: var(--surface-hover);
}
.rep__window:focus-visible {
  outline: none;
  box-shadow: var(--ring-focus);
}
.rep__window--active {
  background: var(--brand-primary);
  color: var(--text-on-brand);
  font-weight: var(--fw-medium);
}
.rep__window--active:hover {
  background: var(--brand-primary-hover);
}

.rep__state {
  padding: var(--space-10) 0;
  text-align: center;
  font: var(--type-small);
  color: var(--text-tertiary);
}
.rep__state--error {
  color: var(--feedback-danger);
}

/* ── Cards ─────────────────────────────────────────────────────────────── */
.rep__total,
.rep__empty,
.rep__card {
  padding: var(--card-pad);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-card);
  background: var(--surface-card);
  box-shadow: var(--shadow-xs);
}
.rep__total {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}
.rep__card {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  /* Sem isto, o canvas do Chart.js alarga o card no celular. */
  min-width: 0;
}

.rep__totalHead,
.rep__cardHead {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}
.rep__label {
  font: var(--type-label);
  letter-spacing: var(--ls-label);
  text-transform: uppercase;
  color: var(--text-tertiary);
}
/* Quadradinho tingido do padrão `.ga-stat__icon`. */
.rep__labelIcon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  border-radius: var(--radius-sm);
  background: var(--brand-primary-soft);
  color: var(--brand-primary);
}

.rep__totalValue {
  font: var(--fw-medium) 28px / 1 var(--font-display);
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
}
/* Resultado é o único número da tela que tem sinal: sobrou ou faltou. */
.rep__value--up {
  color: var(--feedback-success);
}
.rep__value--down {
  color: var(--feedback-danger);
}
.rep__totalCaption {
  font: var(--type-caption);
  color: var(--text-tertiary);
}

.rep__lines {
  display: flex;
  flex-direction: column;
  gap: var(--space-0-5);
  font: var(--type-caption);
  color: var(--text-secondary);
}
.rep__line {
  display: flex;
  justify-content: space-between;
  gap: var(--space-3);
}
.rep__line dd {
  font-weight: var(--fw-medium);
  font-variant-numeric: tabular-nums;
}

/* ── Estado vazio ──────────────────────────────────────────────────────── */
.rep__empty {
  padding: var(--space-8) var(--card-pad);
  text-align: center;
}
.rep__emptyTitle {
  font: var(--type-body-strong);
  color: var(--text-primary);
}
.rep__emptyText {
  max-width: 44ch;
  margin: var(--space-2) auto 0;
  font: var(--type-small);
  color: var(--text-tertiary);
}

/* ── Gráficos ──────────────────────────────────────────────────────────── */
/*
 * Altura fixa no envoltório, e não no canvas: com `maintainAspectRatio: false`
 * o Chart.js escreve width/height inline no canvas a cada redesenho, e sem uma
 * altura de referência o gráfico cresce a cada resize.
 */
.rep__canvasWrap {
  position: relative;
  width: 100%;
  height: 220px;
}
@media (min-width: 768px) {
  .rep__canvasWrap {
    height: 280px;
  }
}
.rep__canvas {
  width: 100% !important;
  height: 100% !important;
}

.rep__legend {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2) var(--space-4);
  margin: 0;
  padding: 0;
  list-style: none;
  font: var(--type-caption);
  color: var(--text-secondary);
}
.rep__legendItem {
  display: flex;
  align-items: center;
  gap: var(--space-1-5);
}
.rep__swatch {
  width: 12px;
  height: 12px;
  flex-shrink: 0;
  border-radius: var(--radius-xs);
}
.rep__swatch--income {
  background: var(--green-500);
}
.rep__swatch--expense {
  background: var(--red-500);
}
/* O resultado é linha no gráfico, então a amostra também é uma linha. */
.rep__swatch--result {
  height: 3px;
  border-radius: var(--radius-pill);
  background: var(--brand-primary);
}

.rep__legend--stack {
  flex-direction: column;
  gap: var(--space-1-5);
}
.rep__legendRow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  min-width: 0;
}
.rep__legendName {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  min-width: 0;
}
.rep__legendText {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.rep__dot {
  width: 12px;
  height: 12px;
  flex-shrink: 0;
  border-radius: 50%;
}
.rep__legendValue {
  flex-shrink: 0;
  font-weight: var(--fw-medium);
  font-variant-numeric: tabular-nums;
}

/* ── Variação mês a mês ────────────────────────────────────────────────── */
.rep__months {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  margin: 0;
  padding: 0;
  list-style: none;
}
.rep__monthTop {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-3);
}
.rep__monthLabel {
  min-width: 0;
  font: var(--type-body-strong);
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
/* `::first-letter` e não `capitalize`: o rótulo é "novembro de 2026", e
   `capitalize` maiusculiza cada palavra — viraria "Novembro De 2026". */
.rep__monthLabel::first-letter {
  text-transform: uppercase;
}
.rep__currentTag {
  font: var(--type-caption);
  color: var(--text-tertiary);
}

.rep__monthEnd {
  display: flex;
  flex-shrink: 0;
  align-items: baseline;
  gap: var(--space-2);
}
.rep__monthValue {
  font: var(--fw-semibold) var(--fs-body-lg) / 1.3 var(--font-ui);
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
}
/* Zero continua sendo informação, só não é o assunto. */
.rep__monthValue--zero {
  color: var(--text-tertiary);
}

/* `.ga-badge--sm` da skill. */
.rep__delta {
  display: inline-flex;
  align-items: center;
  height: 18px;
  padding: 0 var(--space-1-5);
  border-radius: var(--radius-pill);
  font: var(--type-micro);
  letter-spacing: var(--ls-label);
  white-space: nowrap;
}
.rep__delta--worse {
  background: var(--feedback-danger-bg);
  color: var(--feedback-danger);
}
.rep__delta--better {
  background: var(--feedback-success-bg);
  color: var(--feedback-success);
}
.rep__delta--flat {
  background: var(--status-todo-bg);
  color: var(--text-tertiary);
}

/* `.ga-progress` da skill, na cor do gasto. */
.rep__bar {
  width: 100%;
  height: 8px;
  margin-top: var(--space-2);
  border-radius: var(--radius-pill);
  background: var(--ink-100);
  overflow: hidden;
}
.rep__barFill {
  height: 100%;
  border-radius: inherit;
  background: var(--red-500);
  transition: width var(--dur-slow) var(--ease-out);
}

.rep__monthSummary {
  margin-top: var(--space-1-5);
  font: var(--type-caption);
  color: var(--text-tertiary);
}

.rep__nothing {
  font: var(--type-small);
  color: var(--text-tertiary);
}
</style>
