<template>
  <div class="dash">
    <div class="dash__head">
      <div class="dash__month">
        <button type="button" aria-label="Mês anterior" class="dash__arrow" @click="previousMonth">
          <GaIcon name="chevron-left" :size="18" />
        </button>
        <span class="dash__monthLabel">{{ monthLabel }}</span>
        <button type="button" aria-label="Próximo mês" class="dash__arrow" @click="nextMonth">
          <GaIcon name="chevron-right" :size="18" />
        </button>
      </div>

      <!--
        No celular o botão é só o "+": com o rótulo inteiro ele não cabia na
        linha da navegação de mês, quebrava para baixo e ficava sozinho e
        desalinhado. O `aria-label` preserva o nome da ação para quem usa
        leitor de tela, já que o texto some.

        O "+" não é mais um círculo escuro dentro de um botão lima: é o ícone
        Lucide `plus` dentro do botão primário do sistema, que já é cobalt.
      -->
      <GaButton
        class="dash__new"
        variant="primary"
        aria-label="Nova transação"
        @click="showModal = true"
      >
        <template #icon>
          <GaIcon name="plus" />
        </template>
        <span class="dash__newLabel">Nova transação</span>
      </GaButton>
    </div>

    <div class="dash__grid">
      <div class="dash__col">
        <div class="dash__stats">
          <MonthlyBalanceCard ref="balanceCard" :year="selectedYear" :month="selectedMonth" />
          <InvoicesCard
            ref="invoicesCard"
            :year="selectedYear"
            :month="selectedMonth"
            @open-invoice="openInvoice"
            @pay-invoice="openPayment"
          />
          <GoalsCard ref="goalsCard" />
        </div>

        <!--
          A altura da linha é ditada pelo card de categorias, que lista todas
          as categorias sem cortar. A lista de transações (fit-to-height) se
          estica junto e preenche essa altura com quantas transações couberem.
        -->
        <div class="dash__pair">
          <TransactionsList
            ref="transactionsList"
            :year="selectedYear"
            :month="selectedMonth"
            :limit="40"
            fit-to-height
            @transaction-deleted="refreshAll"
            @transaction-updated="refreshAll"
          />
          <CategoryPieChart ref="pieChart" :year="selectedYear" :month="selectedMonth" />
        </div>
      </div>

      <!--
        align-self: start — a coluna dos cartões tem altura própria. Sem isso
        ela é esticada até a altura da coluna da esquerda e o card fica com um
        vazio enorme embaixo dos cartões.
      -->
      <div class="dash__side">
        <MyCardsCard />
        <RecurringCard ref="recurringCard" />
      </div>
    </div>

    <NewTransactionalModal
      v-if="showModal"
      :year="selectedYear"
      :month="selectedMonth"
      @transaction-created="handleTransactionCreated"
      @close="showModal = false"
    />

    <InvoiceDetailModal
      v-if="detailTarget"
      :card="detailTarget.card"
      :cycle="detailTarget.cycle"
      @close="detailTarget = null"
      @pay="payFromDetail"
    />

    <PayInvoiceModal
      v-if="paymentTarget"
      :card="paymentTarget.card"
      :invoice="paymentTarget.invoice"
      @close="paymentTarget = null"
      @paid="handleInvoicePaid"
    />
  </div>
</template>

<script setup>
/**
 * Dashboard — primeira tela migrada para o design system gestaoApp
 * (ROADMAP 1.4).
 *
 * O comportamento é o mesmo de antes: nenhuma requisição, nenhum estado e
 * nenhum evento mudou. O que mudou é cor, tipografia, raio, sombra e ícone,
 * todos vindos de token.
 *
 * ── Esqueleto de navegação ───────────────────────────────────────────────
 *
 * A casca (`div > Navbar + main`) saiu daqui: a navegação e o `<main>` são do
 * `AppShell`, montado uma vez acima da `<RouterView>`. Esta tela entrega só o
 * conteúdo. As abas de topo (`AppTabs`) deixaram de existir — sidebar no
 * desktop, `GaTabBar` no celular.
 */
import { ref, useTemplateRef } from "vue";
import GaButton from "../design-system/components/GaButton.vue";
import GaIcon from "../design-system/components/GaIcon.vue";
import MonthlyBalanceCard from "../components/cards/MonthlyBalanceCard.vue";
import InvoicesCard from "../components/cards/InvoicesCard.vue";
import InvoiceDetailModal from "../components/InvoiceDetailModal.vue";
import PayInvoiceModal from "../components/PayInvoiceModal.vue";
import GoalsCard from "../components/cards/GoalsCard.vue";
import CategoryPieChart from "../components/CategoryPieChart.vue";
import MyCardsCard from "../components/cards/MyCardsCard.vue";
import RecurringCard from "../components/cards/RecurringCard.vue";
import TransactionsList from "../components/TransactionsList.vue";
import NewTransactionalModal from "../components/NewTransactionalModal.vue";
import { useMonthNavigation } from "../services/useMonthNavigation";
import { definePageAction } from "../stores/pageAction";

const showModal = ref(false);

// O FAB central da barra inferior abre o mesmo modal do botão do cabeçalho.
definePageAction({ label: "Nova transação", run: () => (showModal.value = true) });

/** { cardId, cycle } da fatura aberta em detalhe, ou null. */
const detailTarget = ref(null);

/** { card, invoice } do pagamento em andamento, ou null. */
const paymentTarget = ref(null);

const transactionsList = useTemplateRef("transactionsList");
const balanceCard = useTemplateRef("balanceCard");
const invoicesCard = useTemplateRef("invoicesCard");
const goalsCard = useTemplateRef("goalsCard");
const recurringCard = useTemplateRef("recurringCard");
const pieChart = useTemplateRef("pieChart");

/**
 * BUG CORRIGIDO (A5 — requisições duplicadas):
 *
 * Antes, previousMonth/nextMonth chamavam refreshAll() logo depois de mudar o
 * mês. Só que os cards JÁ observam as props year/month e recarregam sozinhos
 * (ver useCardFetch). Resultado: cada clique de navegação disparava DUAS
 * requisições por card — cinco cards, dez requisições por clique.
 *
 * Agora a troca de mês apenas altera o estado; os filhos reagem via props.
 * O refreshAll() ficou reservado para o que as props não cobrem: uma
 * transação criada ou excluída, que muda os totais sem mudar o mês.
 */
const { selectedYear, selectedMonth, monthLabel, previousMonth, nextMonth } = useMonthNavigation();

function refreshAll() {
  transactionsList.value?.loadTransactions();
  balanceCard.value?.refetch();
  invoicesCard.value?.refetch();
  goalsCard.value?.refetch();
  // Um lançamento novo pode fechar o terceiro mês de uma assinatura.
  recurringCard.value?.refetch();
  pieChart.value?.refetch();
}

function handleTransactionCreated() {
  showModal.value = false;
  refreshAll();
}

function openInvoice(target) {
  detailTarget.value = target;
}

function openPayment({ card, invoice }) {
  paymentTarget.value = { card, invoice };
}

/** Vindo do detalhe: fecha o detalhe e abre o pagamento no lugar. */
function payFromDetail(invoice) {
  const { card } = detailTarget.value;
  detailTarget.value = null;
  paymentTarget.value = { card, invoice };
}

function handleInvoicePaid() {
  paymentTarget.value = null;
  detailTarget.value = null;
  refreshAll();
}
</script>

<style scoped>
/*
 * A casca saiu: `min-height`, fundo, cor, `max-width`, `margin` e os dois
 * `padding` com breakpoint eram iguais em cinco telas e agora moram no
 * `AppShell`. O que sobra aqui é o conteúdo do dashboard.
 */
/*
 * O `margin-bottom: var(--space-8)` que separava o cabeçalho da grade virou o
 * `gap` daqui — mesmos 32px, agora no container, como nas outras telas.
 */
.dash {
	display: flex;
	flex-direction: column;
	gap: var(--space-8);
}

.dash__head {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	justify-content: space-between;
	gap: var(--space-3);
}

.dash__month {
	display: flex;
	align-items: center;
	gap: var(--space-3);
}

/* `.ga-iconbtn--outline` da skill. */
.dash__arrow {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: var(--control-md);
	height: var(--control-md);
	flex-shrink: 0;
	border: 1px solid var(--border-default);
	border-radius: var(--radius-md);
	background: var(--surface-card);
	color: var(--text-primary);
	box-shadow: var(--shadow-xs);
	cursor: pointer;
	transition:
		background var(--dur-fast) var(--ease-out),
		border-color var(--dur-fast) var(--ease-out),
		transform var(--dur-fast) var(--ease-out);
}
.dash__arrow:hover {
	background: var(--surface-hover);
	border-color: var(--border-strong);
}
.dash__arrow:active {
	transform: scale(0.94);
}
.dash__arrow:focus-visible {
	outline: none;
	border-color: var(--border-focus);
	box-shadow: var(--ring-focus);
}
/* Alvo mínimo de 44px no celular. Cabe: 44 + 112 + 44 + dois espaços de 12
   somam 224 dos 343px da linha, e o botão de nova transação leva 44. */
@media (max-width: 767px) {
	.dash__arrow {
		width: var(--hit-min);
		height: var(--hit-min);
	}
}

.dash__monthLabel {
	min-width: 112px;
	text-align: center;
	font: var(--type-title);
	letter-spacing: var(--ls-title);
	color: var(--text-primary);
}
/*
 * `::first-letter`, e não a classe `capitalize`: o rótulo é "novembro 2026" e
 * `capitalize` maiusculiza CADA palavra. Com mês de duas palavras no futuro —
 * ou com o ano escrito — viraria "Novembro De 2026".
 */
.dash__monthLabel::first-letter {
	text-transform: uppercase;
}
@media (min-width: 640px) {
	.dash__monthLabel {
		min-width: 128px;
	}
}

.dash__new {
	margin-left: auto;
}
/*
 * Abaixo de 640px o botão primário fica só com o ícone. `gap: 0` junto do
 * `padding: 0`: sem zerar o gap, o espaço de 8px que separaria o ícone do
 * rótulo continuaria contando no centro do botão e o "+" ficaria 4px à
 * esquerda do meio.
 */
@media (max-width: 639px) {
	.dash__newLabel {
		display: none;
	}
	.dash__new {
		gap: 0;
		padding: 0;
		min-width: var(--hit-min);
	}
}

.dash__grid {
	display: grid;
	grid-template-columns: 1fr;
	gap: var(--space-6);
}
@media (min-width: 1280px) {
	.dash__grid {
		grid-template-columns: repeat(4, minmax(0, 1fr));
	}
	.dash__col {
		grid-column: span 3;
	}
}

.dash__col {
	display: flex;
	flex-direction: column;
	gap: var(--space-6);
	min-width: 0;
}

.dash__stats,
.dash__pair {
	display: grid;
	grid-template-columns: 1fr;
	gap: var(--grid-gap);
}
@media (min-width: 768px) {
	.dash__stats {
		grid-template-columns: repeat(3, minmax(0, 1fr));
	}
	.dash__pair {
		grid-template-columns: repeat(2, minmax(0, 1fr));
		align-items: stretch;
	}
}

.dash__side {
	align-self: start;
	min-width: 0;
}
</style>
