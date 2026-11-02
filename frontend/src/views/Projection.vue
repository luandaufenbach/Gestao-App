<template>
  <div class="proj">
    <header class="proj__head">
      <h1 class="proj__title">Projeção de caixa</h1>
      <p class="proj__subtitle">
        O que já está comprometido daqui para a frente, começando pelo mês atual.
      </p>
    </header>

    <p v-if="loading" class="proj__state">Carregando...</p>

    <p v-else-if="error" class="proj__state proj__state--error">{{ error }}</p>

    <template v-else>
      <!--
        Mesmo ritmo dos cards do dashboard: rótulo pequeno em maiúsculas, o
        número em destaque, detalhes miúdos embaixo.
      -->
      <section class="proj__total">
        <div class="proj__totalHead">
          <span class="proj__label">A sair nos próximos {{ months }} meses</span>
          <span class="proj__labelIcon">
            <GaIcon name="calendar-days" :size="16" />
          </span>
        </div>

        <p class="proj__totalValue">{{ formatCurrency(totalCommittedInCents) }}</p>

        <dl class="proj__lines">
          <div class="proj__line">
            <dt>Faturas de cartão</dt>
            <dd>{{ formatCurrency(totalInvoicesInCents) }}</dd>
          </div>
          <div class="proj__line">
            <dt>Débitos agendados</dt>
            <dd>{{ formatCurrency(totalDebitsInCents) }}</dd>
          </div>
        </dl>

        <!--
          O aviso é a parte mais importante da tela.
          Sem ele o número grande é lido como saldo ou como gasto do mês, e
          aí a projeção passa a informar o contrário do que calcula.
        -->
        <GaNote tone="warning" icon="info">
          Isto é dinheiro que <strong>ainda vai sair</strong>: faturas em aberto e lançamentos no
          débito já marcados para o futuro. Não é o seu saldo, e não é o que você já gastou.
        </GaNote>
      </section>

      <!--
        Estado vazio honesto. A série vem completa e zerada quando não há
        compromisso nenhum, então desenhar as barras daria seis retângulos
        vazios — um gráfico dizendo "zero" sem explicar nada.
      -->
      <section v-if="isEmpty" class="proj__empty">
        <p class="proj__emptyTitle">Nada comprometido nos próximos meses.</p>
        <p class="proj__emptyText">
          Você não tem fatura em aberto nem lançamento no débito com data futura. Compras
          parceladas e faturas aparecem aqui no mês em que vencem.
        </p>
      </section>

      <ul v-else class="proj__list">
        <li v-for="entry in series" :key="entry.month" class="proj__month">
          <!--
            A linha inteira é o botão: a área de clique passa dos 44px de
            altura em qualquer tela, inclusive em volta da seta.
          -->
          <button
            type="button"
            class="proj__row"
            :aria-expanded="isOpen(entry)"
            @click="toggle(entry)"
          >
            <div class="proj__rowTop">
              <span class="proj__monthLabel">
                {{ entry.label }}
                <span v-if="entry.month === currentMonth" class="proj__current">(mês atual)</span>
              </span>

              <span class="proj__rowEnd">
                <span
                  class="proj__amount"
                  :class="{ 'proj__amount--zero': entry.committedInCents === 0 }"
                >
                  {{ formatCurrency(entry.committedInCents) }}
                </span>
                <GaIcon
                  name="chevron-down"
                  :size="16"
                  :class="['proj__chev', { 'proj__chev--open': isOpen(entry) }]"
                />
              </span>
            </div>

            <!-- Barra de proporção: a régua é o mês mais pesado da janela. -->
            <div class="proj__bar">
              <div
                class="proj__barFill"
                :class="{ 'proj__barFill--peak': isPeak(entry) }"
                :style="{ width: barPercent(entry) + '%' }"
              ></div>
            </div>

            <p class="proj__summary">{{ summaryLine(entry) }}</p>
          </button>

          <div v-if="isOpen(entry)" class="proj__detail">
            <section v-if="entry.cards.length">
              <h2 class="proj__sectionTitle">
                <GaIcon name="credit-card" :size="14" />
                Faturas por cartão
              </h2>

              <ul class="proj__cards">
                <li v-for="card in entry.cards" :key="card.cardId" class="proj__card">
                  <div class="proj__cardMain">
                    <!-- A cor é do cartão, escolhida pelo usuário: é dado. O
                         padrão segue o de "Meus cartões" (`--ink-900`). -->
                    <span
                      class="proj__dot"
                      :style="{ background: card.color || 'var(--ink-900)' }"
                    ></span>
                    <div class="proj__cardText">
                      <p class="proj__cardName">
                        {{ card.name }}
                        <span v-if="card.lastFourDigits" class="proj__cardDigits">
                          ····{{ card.lastFourDigits }}
                        </span>
                      </p>
                      <p class="proj__cardMeta">
                        vence {{ formatDate(card.dueDate) }}
                        <template v-if="card.installmentCount > 0">
                          · {{ installmentsLabel(card.installmentCount) }}
                        </template>
                      </p>
                    </div>
                  </div>

                  <div class="proj__cardEnd">
                    <p
                      class="proj__cardValue"
                      :class="{ 'proj__amount--zero': card.committedInCents === 0 }"
                    >
                      {{ formatCurrency(card.committedInCents) }}
                    </p>
                    <!--
                      Fatura quitada chega com committedInCents zero. Ela fica
                      na lista com o selo: some da projeção sem explicação, o
                      usuário procura a fatura que sabe que existe.
                    -->
                    <span v-if="card.committedInCents === 0" class="proj__paid">paga</span>
                    <p v-else-if="card.paidInCents > 0" class="proj__cardMeta">
                      de {{ formatCurrency(card.totalInCents) }}
                    </p>
                  </div>
                </li>
              </ul>
            </section>

            <section v-if="entry.debitsInCents > 0">
              <h2 class="proj__sectionTitle">
                <!-- Mesmo ícone de saída no débito da lista de transações: a
                     `arrow-up` girada meia volta. Ver TransactionRow.vue. -->
                <GaIcon name="arrow-up" :size="14" class="proj__flip" />
                Débitos agendados
              </h2>
              <div class="proj__debits">
                <!--
                  Texto curto de propósito: em 375px a versão longa ocupava
                  três linhas e empurrava o valor para o canto.
                -->
                <p class="proj__debitsText">No débito, com data neste mês e ainda por sair.</p>
                <p class="proj__debitsValue">{{ formatCurrency(entry.debitsInCents) }}</p>
              </div>
            </section>

            <p v-if="!entry.cards.length && entry.debitsInCents === 0" class="proj__nothing">
              Nada comprometido neste mês.
            </p>
          </div>
        </li>
      </ul>
    </template>

    <!--
      O FAB da barra inferior abre "Nova transação" aqui: esta tela não tem ação
      de criar própria, e "Nova transação" é a ação principal do app. Ver
      `stores/pageAction.js`. Sem ano/mês, o modal já sugere a data de hoje —
      que é o certo, porque a projeção começa sempre no mês corrente e não
      obedece a nenhuma navegação de mês.
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
 * Projeção de caixa (ROADMAP 1.1).
 *
 * Tela própria, e não um card no dashboard, por um motivo concreto: o
 * dashboard inteiro é governado pela navegação de mês, e esta série NÃO é —
 * ela começa sempre no mês corrente, pois `GET /dashboard/projection` não
 * aceita year/month. Um card que ignorasse as setas de mês ao lado de cinco
 * que as obedecem pareceria quebrado. Além disso a abertura por mês (faturas
 * por cartão + débitos) precisa de altura, que a grade do dashboard não tem.
 *
 * ── MIGRADA para o design system gestaoApp (ROADMAP 1.4) ─────────────────
 *
 * Nenhuma requisição, nenhum estado e nenhum evento mudou. As cores que
 * COMUNICAM, e de onde vieram:
 *
 *   antes                        depois                      o que diz
 *   bg-amber-500 (barra do pico) --orange-500                o mês mais pesado
 *   bg-amber-300 (demais barras) --orange-100                os outros meses
 *   amber-50/amber-900 (aviso)   GaNote tone="warning"       atenção
 *   text-emerald-700 ("paga")    --feedback-success          concluída
 *   text-slate-300 (valor zero)  --text-tertiary             zero ainda é dado
 *
 * Laranja continua laranja: é o sinal de atenção do sistema, e é o mesmo que o
 * card de faturas usa na barra de "parcial". A escala do sistema não tem
 * `orange-300`, então o degrau claro é o `--orange-100` — a diferença entre as
 * duas barras continua legível porque o trilho é cinza (`--ink-100`), frio, e
 * as duas barras são quentes.
 *
 * O selo "paga" era texto laranja-esverdeado solto em 10px; virou a pílula
 * `.ga-badge--sm` com os mesmos tokens do selo "paga" do card de faturas, que
 * já havia sido migrado. Dois lugares, um desenho.
 *
 * Os cinco ícones saíram do Heroicons para o conjunto Lucide da skill:
 * CalendarDays -> calendar-days, InformationCircle -> info, ChevronDown ->
 * chevron-down, CreditCard -> credit-card. BanknotesIcon não tem equivalente
 * nos 74 ícones da skill; "débito agendado" é a mesma coisa que a saída no
 * débito da lista de transações, então usa o mesmo desenho de lá: a `arrow-up`
 * girada meia volta.
 *
 * ── Esqueleto de navegação ───────────────────────────────────────────────
 *
 * A casca (`div > Navbar + main`) saiu daqui: a navegação e o `<main>` são do
 * `AppShell`.
 *
 * O FAB da barra inferior do celular precisa de uma ação de criar por tela, e
 * esta é a tela que não tem uma: a projeção é leitura de uma série que o
 * backend monta a partir do que já existe. A ação registrada é "Nova
 * transação", a principal do app — ver `stores/pageAction.js`. Criar um débito
 * com data futura MUDA esta série, então o `load()` roda depois de criar; sem
 * ele a tela ficaria mostrando o número velho e pareceria quebrada.
 */
import { ref, computed, onMounted } from "vue";
import GaIcon from "@/design-system/components/GaIcon.vue";
import GaNote from "@/design-system/components/GaNote.vue";
import NewTransactionalModal from "../components/NewTransactionalModal.vue";
import { useFormatters } from "../services/useFormatters";
import { useProjection } from "../services/useProjection";
import { definePageAction } from "../stores/pageAction";

const { formatCurrency, formatDate } = useFormatters();

const {
  months,
  series,
  loading,
  error,
  load,
  totalCommittedInCents,
  totalInvoicesInCents,
  totalDebitsInCents,
  peakInCents,
  isEmpty,
  barPercent,
} = useProjection();

/** Mês aberto na abertura por cartão, no formato "2026-11", ou "". */
const openMonth = ref("");

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
 * Mês corrente em UTC, no mesmo formato do campo `month` da resposta.
 *
 * Lido em UTC pelo mesmo motivo de sempre: no fuso local, todo dia 1º cai no
 * mês anterior e a marca "(mês atual)" iria para a linha errada.
 */
const currentMonth = computed(() => {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
});

const isOpen = (entry) => openMonth.value === entry.month;

/** O mês mais pesado da janela ganha a barra mais escura. */
const isPeak = (entry) => peakInCents.value > 0 && entry.committedInCents === peakInCents.value;

function toggle(entry) {
  openMonth.value = isOpen(entry) ? "" : entry.month;
}

const installmentsLabel = (count) => `${count} ${count === 1 ? "parcela" : "parcelas"}`;

/** Resumo miúdo da linha: de onde vem o valor daquele mês. */
function summaryLine(entry) {
  const parts = [];

  if (entry.invoicesInCents > 0) parts.push(`faturas ${formatCurrency(entry.invoicesInCents)}`);
  if (entry.debitsInCents > 0) parts.push(`débitos ${formatCurrency(entry.debitsInCents)}`);
  if (entry.installmentCount > 0) parts.push(installmentsLabel(entry.installmentCount));

  if (parts.length > 0) return parts.join(" · ");

  // Mês zerado, mas com fatura já quitada na abertura: dizer "nada
  // comprometido" sem mais nada faria o usuário achar que a fatura sumiu.
  if (entry.cards.length > 0) {
    return entry.cards.length === 1 ? "fatura já paga" : "faturas já pagas";
  }

  return "nada comprometido";
}

onMounted(load);
</script>

<style scoped>
/*
 * A casca saiu: `min-height`, fundo, cor, `max-width`, `margin` e os dois
 * `padding` com breakpoint moram no `AppShell`.
 */
.proj {
	display: flex;
	flex-direction: column;
	gap: var(--space-6);
}

.proj__head {
	display: flex;
	flex-direction: column;
	gap: var(--space-1);
}
.proj__title {
	font: var(--type-page-title);
	letter-spacing: var(--ls-heading);
}
.proj__subtitle {
	font: var(--type-small);
	color: var(--text-secondary);
}

.proj__state {
	padding: var(--space-10) 0;
	text-align: center;
	font: var(--type-small);
	color: var(--text-tertiary);
}
.proj__state--error {
	color: var(--feedback-danger);
}

/* ── Card do total ─────────────────────────────────────────────────────── */
/* `.ga-card` da skill, como os cards do dashboard. */
.proj__total,
.proj__empty {
	padding: var(--card-pad);
	border: 1px solid var(--border-subtle);
	border-radius: var(--radius-card);
	background: var(--surface-card);
	box-shadow: var(--shadow-xs);
}
.proj__total {
	display: flex;
	flex-direction: column;
	gap: var(--space-3);
}

.proj__totalHead {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: var(--space-3);
}
.proj__label {
	font: var(--type-label);
	letter-spacing: var(--ls-label);
	text-transform: uppercase;
	color: var(--text-tertiary);
}
/* Quadradinho tingido do padrão `.ga-stat__icon`. */
.proj__labelIcon {
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

/* O número é um stat: tinta, não sinal. Ele não diz entra nem sai sozinho —
   quem diz é o aviso logo abaixo. */
.proj__totalValue {
	font: var(--fw-medium) 28px / 1 var(--font-display);
	letter-spacing: -0.02em;
	font-variant-numeric: tabular-nums;
}

.proj__lines {
	display: flex;
	flex-direction: column;
	gap: var(--space-0-5);
	font: var(--type-caption);
	color: var(--text-secondary);
}
.proj__line {
	display: flex;
	justify-content: space-between;
	gap: var(--space-3);
}
.proj__line dd {
	font-weight: var(--fw-medium);
	font-variant-numeric: tabular-nums;
}

/* ── Estado vazio ──────────────────────────────────────────────────────── */
.proj__empty {
	padding: var(--space-8) var(--card-pad);
	text-align: center;
}
.proj__emptyTitle {
	font: var(--type-body-strong);
	color: var(--text-primary);
}
.proj__emptyText {
	max-width: 44ch;
	margin: var(--space-2) auto 0;
	font: var(--type-small);
	color: var(--text-tertiary);
}

/* ── Lista de meses ────────────────────────────────────────────────────── */
.proj__list {
	display: flex;
	flex-direction: column;
	gap: var(--space-3);
	margin: 0;
	padding: 0;
	list-style: none;
}

.proj__month {
	border: 1px solid var(--border-subtle);
	border-radius: var(--radius-card);
	background: var(--surface-card);
	box-shadow: var(--shadow-xs);
	overflow: hidden;
}

.proj__row {
	display: block;
	width: 100%;
	padding: var(--space-3) var(--space-4);
	border: 0;
	background: transparent;
	text-align: left;
	cursor: pointer;
	transition: background var(--dur-fast) var(--ease-out);
}
.proj__row:hover {
	background: var(--surface-hover);
}
/*
 * Anel de foco PARA DENTRO: o `<li>` tem `overflow: hidden` — é o que mantém o
 * canto arredondado quando a abertura aparece embaixo —, e um anel para fora
 * seria cortado nos quatro lados. Mesmo token, desenhado por dentro.
 */
.proj__row:focus-visible {
	outline: none;
	box-shadow: inset var(--ring-focus);
}

.proj__rowTop {
	display: flex;
	align-items: baseline;
	justify-content: space-between;
	gap: var(--space-3);
}

.proj__monthLabel {
	min-width: 0;
	font: var(--type-body-strong);
	color: var(--text-primary);
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}
/*
 * `::first-letter`, e não a classe `capitalize`: o rótulo é "novembro de 2026"
 * e `capitalize` maiusculiza CADA palavra — viraria "Novembro De 2026".
 */
.proj__monthLabel::first-letter {
	text-transform: uppercase;
}
.proj__current {
	font: var(--type-caption);
	color: var(--text-tertiary);
}

.proj__rowEnd {
	display: flex;
	flex-shrink: 0;
	align-items: center;
	gap: var(--space-1-5);
}
.proj__amount {
	font: var(--fw-semibold) var(--fs-body-lg) / 1.3 var(--font-ui);
	color: var(--text-primary);
	font-variant-numeric: tabular-nums;
}
/* Zero continua sendo informação, só não é o assunto: tertiary, não disabled. */
.proj__amount--zero {
	color: var(--text-tertiary);
}
.proj__chev {
	color: var(--text-tertiary);
	transition: transform var(--dur-fast) var(--ease-out);
}
.proj__chev--open {
	transform: rotate(180deg);
}

/* `.ga-progress` da skill. A cor é sinal — ver o comentário do script. */
.proj__bar {
	width: 100%;
	height: 8px;
	margin-top: var(--space-2);
	border-radius: var(--radius-pill);
	background: var(--ink-100);
	overflow: hidden;
}
.proj__barFill {
	height: 100%;
	border-radius: inherit;
	background: var(--orange-100);
	transition: width var(--dur-slow) var(--ease-out);
}
.proj__barFill--peak {
	background: var(--orange-500);
}

.proj__summary {
	margin-top: var(--space-1-5);
	font: var(--type-caption);
	color: var(--text-tertiary);
}

/* ── Abertura do mês ───────────────────────────────────────────────────── */
.proj__detail {
	display: flex;
	flex-direction: column;
	gap: var(--space-5);
	padding: var(--space-4);
	border-top: 1px solid var(--border-subtle);
}

.proj__sectionTitle {
	display: flex;
	align-items: center;
	gap: var(--space-1-5);
	margin-bottom: var(--space-2);
	font: var(--type-label);
	letter-spacing: var(--ls-label);
	text-transform: uppercase;
	color: var(--text-tertiary);
}
.proj__flip {
	transform: rotate(180deg);
}

.proj__cards {
	display: flex;
	flex-direction: column;
	gap: var(--space-2-5);
	margin: 0;
	padding: 0;
	list-style: none;
}
.proj__card {
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: var(--space-3);
}
.proj__cardMain {
	display: flex;
	align-items: flex-start;
	gap: var(--space-2);
	min-width: 0;
}
.proj__dot {
	width: 12px;
	height: 12px;
	margin-top: 4px;
	flex-shrink: 0;
	border-radius: 50%;
}
.proj__cardText {
	min-width: 0;
}
.proj__cardName {
	font: var(--type-body);
	color: var(--text-primary);
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}
.proj__cardDigits,
.proj__cardMeta {
	font: var(--type-caption);
	color: var(--text-tertiary);
}

.proj__cardEnd {
	flex-shrink: 0;
	text-align: right;
}
.proj__cardValue {
	font: var(--fw-semibold) var(--fs-body) / 1.45 var(--font-ui);
	color: var(--text-primary);
	font-variant-numeric: tabular-nums;
}

/* `.ga-badge--sm` da skill, com os tokens do selo "paga" do card de faturas. */
.proj__paid {
	display: inline-flex;
	align-items: center;
	height: 18px;
	margin-top: var(--space-0-5);
	padding: 0 var(--space-1-5);
	border-radius: var(--radius-pill);
	background: var(--feedback-success-bg);
	color: var(--feedback-success);
	font: var(--type-micro);
	letter-spacing: var(--ls-label);
	text-transform: uppercase;
}

.proj__debits {
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: var(--space-3);
}
.proj__debitsText {
	font: var(--type-body);
	color: var(--text-secondary);
}
.proj__debitsValue {
	flex-shrink: 0;
	font: var(--fw-semibold) var(--fs-body) / 1.45 var(--font-ui);
	color: var(--text-primary);
	font-variant-numeric: tabular-nums;
}

.proj__nothing {
	font: var(--type-small);
	color: var(--text-tertiary);
}
</style>
