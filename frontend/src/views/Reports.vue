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

    <PaywallNotice
      v-else-if="paywalled"
      title="Relatórios fazem parte do Pro"
      feature="relatorios"
      :message="error"
    />

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
        <!--
          ── Evolução por mês ─────────────────────────────────────────────

          A moldura é a do sistema (`gx-card`), e não um card inventado aqui:
          título como PERGUNTA em sentence case, subtítulo com período e
          escopo, legenda acima do gráfico — a anatomia que o README da camada
          `graficos/` define. O `gx-card` também declara `container-type`, que
          é o que faz as consultas `@container` do `charts.css` valerem.
        -->
        <section class="gx-card" aria-label="Receita e despesa por mês">
          <div class="gx-card__head">
            <div class="gx-card__titles">
              <h2 class="gx-card__title">Receita e despesa por mês</h2>
              <p class="gx-card__sub">últimos {{ months }} meses · por competência</p>
            </div>
          </div>

          <!--
            Legenda clicável: esconde a série sem tirá-la da legenda, que é o
            comportamento que o sistema especifica. Com receita e despesa na
            mesma escala, isolar uma das duas é o jeito de ler o mês em que a
            despesa encostou na receita.
          -->
          <div class="gx-card__legend">
            <div class="gx-legend">
              <button
                v-for="item in evolutionSeries"
                :key="item.key"
                type="button"
                class="gx-legend__item"
                :aria-pressed="!evolutionHidden.includes(item.key)"
                @click="toggle(evolutionHidden, item.key)"
              >
                <span class="gx-legend__sw" :style="{ '--c': item.color }"></span>
                <span class="gx-legend__label">{{ item.label }}</span>
              </button>
            </div>
          </div>

          <div class="gx-card__body">
            <GxColumnChart
              :data="evolutionRows"
              :series="evolutionSeries"
              :hidden="evolutionHidden"
              mode="grouped"
              :y-format="formatCompactCurrency"
              :aria-label="`Receita e despesa de cada mês. ${evolutionSummary}`"
            />
          </div>
        </section>

        <!-- ── Comparativo por categoria ──────────────────────────────── -->
        <section class="gx-card" aria-label="Para onde o dinheiro foi">
          <div class="gx-card__head">
            <div class="gx-card__titles">
              <h2 class="gx-card__title">Para onde o dinheiro foi</h2>
              <p class="gx-card__sub">despesa por categoria, mês a mês</p>
            </div>
          </div>

          <template v-if="chartCategories.length">
            <!-- Esta legenda carrega também o total da janela de cada
                 categoria, que o gráfico não mostra — é o `gx-legend__val`. -->
            <div class="gx-card__legend">
              <div class="gx-legend">
                <button
                  v-for="item in categorySeries"
                  :key="item.key"
                  type="button"
                  class="gx-legend__item"
                  :aria-pressed="!categoryHidden.includes(item.key)"
                  @click="toggle(categoryHidden, item.key)"
                >
                  <!-- A cor é da categoria, escolhida pelo usuário: é dado. -->
                  <span class="gx-legend__sw" :style="{ '--c': item.color }"></span>
                  <span class="gx-legend__label">{{ item.label }}</span>
                  <span class="gx-legend__val">{{ formatCurrency(item.totalInCents) }}</span>
                </button>
              </div>
            </div>

            <div class="gx-card__body">
              <GxColumnChart
                :data="categoryRows"
                :series="categorySeries"
                :hidden="categoryHidden"
                mode="stacked"
                :y-format="formatCompactCurrency"
                :aria-label="`Despesa por categoria em cada mês. ${categoriesSummary}`"
              />
            </div>
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
 * ── Os gráficos saíram do canvas ─────────────────────────────────────────
 *
 * Os dois eram Chart.js em canvas, e canvas não resolve `var(--token)`: seis
 * cores do design system estavam copiadas à mão como hexa aqui dentro. Agora
 * são `GxColumnChart`, da camada `graficos/` do design system, em SVG — o
 * token vale direto e o tema escuro vem junto.
 *
 * ── O resultado deixou de ser linha no gráfico ────────────────────────────
 *
 * A evolução mostrava receita e despesa em barras e o resultado numa linha por
 * cima. O `ColumnChart` da skill não tem série de linha, e o `ComboChart`, que
 * tem, é para volume × TAXA com dois eixos — não é o caso de um resultado em
 * reais no mesmo eixo das barras.
 *
 * O número não se perdeu: ele é o valor grande do card do topo e aparece mês a
 * mês na linha de resumo da seção "Variação mês a mês".
 *
 * As cores das CATEGORIAS continuam não sendo token: vêm do backend, de cada
 * categoria cadastrada pelo usuário, e é isso que casa a faixa da barra com a
 * bolinha da legenda.
 */
import { ref, computed, onMounted } from "vue";
import GaIcon from "@/design-system/components/GaIcon.vue";
import GaNote from "@/design-system/components/GaNote.vue";
import GxColumnChart from "@/design-system/graficos/GxColumnChart.vue";
import NewTransactionalModal from "../components/NewTransactionalModal.vue";
import PaywallNotice from "../components/PaywallNotice.vue";
import { useFormatters } from "../services/useFormatters";
import { useReports, REPORT_WINDOWS } from "../services/useReports";
import { definePageAction } from "../stores/pageAction";

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
 * O `label` que vem do backend é "novembro de 2026" — doze desses no eixo não
 * cabem em 375px de jeito nenhum. Mesmo abreviado, o `GxColumnChart` desenha um
 * rótulo a cada dois no celular quando a janela passa de seis meses.
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

/* O rótulo do eixo agora vai dentro de cada linha de dados, em `label` — o
   `GxColumnChart` lê do próprio dado, não de uma lista paralela. */

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

/**
 * ── Formatação dos eixos ──────────────────────────────────────────────────
 *
 * Os formatos nomeados do `chartCore` (`currency`, `currencyCompact`) esperam
 * REAIS, e aqui tudo trafega em centavos. Por isso vão funções: a divisão por
 * 100 continua acontecendo num lugar só, no `useFormatters`.
 *
 * O eixo usa o compacto e o tooltip o valor cheio — o `GxColumnChart` aceita
 * um formato por série justamente para isso.
 */
const evolutionRows = computed(() =>
  series.value.map((item) => ({
    label: shortLabel(item.month),
    receita: item.incomeInCents,
    despesa: item.expenseInCents,
  }))
);

/**
 * Verde e vermelho aqui significam BOM e RUIM, não direção — é a regra de
 * cores semânticas da skill. Receita que entra é positiva, despesa é negativa,
 * e por isso os tokens são `--chart-positive` e `--chart-negative`, e não duas
 * cores da paleta categórica.
 */
const evolutionSeries = [
  { key: "receita", label: "Receita", color: "var(--chart-positive)", format: formatCurrency },
  { key: "despesa", label: "Despesa", color: "var(--chart-negative)", format: formatCurrency },
];

/**
 * Comparativo por categoria, EMPILHADO: a altura da coluna é a despesa total
 * do mês, e cada faixa é uma categoria. Lado a lado, doze meses × seis
 * categorias dariam 72 barras de dois pixels em 375px.
 *
 * As chaves são posicionais (`c0`, `c1`…) porque o nome da categoria pode
 * conter qualquer coisa e viraria chave de objeto frágil.
 */
const categorySeries = computed(() =>
  chartCategories.value.map((item, index) => ({
    key: `c${index}`,
    label: item.category,
    // Cor da categoria, escolhida pelo usuário: é dado, não token da paleta.
    color: item.color,
    format: formatCurrency,
    // Só a legenda usa: é o total da categoria na janela inteira, que o
    // gráfico não mostra porque lá cada faixa é de um mês.
    totalInCents: item.totalInCents,
  }))
);

/**
 * Séries escondidas pela legenda, uma lista por gráfico.
 *
 * Ficam aqui e não dentro do `GxColumnChart` porque a legenda é da TELA — o
 * componente recebe `hidden` e desenha o que sobrou, sem saber quem clicou.
 * É o mesmo contrato do `ColumnChart` da skill.
 */
const evolutionHidden = ref([]);
const categoryHidden = ref([]);

/**
 * Recebe o ARRAY, não o ref: no template o ref já chega desembrulhado, e
 * `list.value` seria `undefined`. Mutar o array direto é reativo, porque o
 * `ref` embrulha o conteúdo também.
 */
function toggle(list, key) {
  const index = list.indexOf(key);
  if (index >= 0) list.splice(index, 1);
  else list.push(key);
}

const categoryRows = computed(() =>
  series.value.map((item, monthIndex) => {
    const row = { label: shortLabel(item.month) };

    // `monthlyInCents` já vem alinhado posição por posição com a série, então
    // o índice do mês serve direto, sem procurar por chave.
    chartCategories.value.forEach((category, index) => {
      row[`c${index}`] = category.monthlyInCents[monthIndex] ?? 0;
    });

    return row;
  })
);

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

onMounted(load);
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
  /* Sem isto, o gráfico alarga o card no celular em vez de caber nele. */
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

/*
 * As legendas dos dois gráficos agora são as do sistema (`gx-legend`), que
 * vêm de `graficos/charts.css` e já tratam o estado clicado com
 * `aria-pressed`. As classes `.rep__legend*`, `.rep__swatch*` e `.rep__dot`
 * que existiam aqui saíram junto com a marcação que as usava.
 *
 * A altura do gráfico mora no `GxColumnChart` (240px, prop `height`) e a
 * largura ele mede sozinho com ResizeObserver.
 */

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
