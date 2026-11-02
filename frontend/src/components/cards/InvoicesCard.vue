<template>
  <div class="inv">
    <div class="inv__head">
      <span class="inv__label">Faturas</span>

      <!--
        Seletor de cartão. Com um cartão só ele fica escondido. O favorito vem
        primeiro e marcado com estrela, e é o selecionado por padrão.
      -->
      <select v-if="creditCards.length > 1" v-model="selectedCardId" aria-label="Cartão" class="inv__select">
        <option v-for="card in creditCards" :key="card._id" :value="card._id">
          {{ card.starred ? "★ " : "" }}{{ card.bank || card.name }}
        </option>
      </select>
      <span v-else-if="currentCard" class="inv__cardName">
        {{ currentCard.bank || currentCard.name }}
      </span>
    </div>

    <p v-if="loading" class="inv__empty">Carregando...</p>

    <!--
      Sem cartão de crédito, ou com o ciclo não configurado, o card explica o
      que fazer em vez de mostrar uma lista vazia sem motivo aparente.
    -->
    <div v-else-if="!creditCards.length" class="inv__empty">
      Nenhum cartão de crédito cadastrado.
    </div>

    <div v-else-if="needsCycleSetup" class="inv__setup">
      <p>Para montar as faturas, informe quando o cartão fecha e quando vence.</p>
      <p class="inv__setupHint">Você configura isso no cartão, em "Meus cartões".</p>
    </div>

    <p v-else-if="error" class="inv__error">{{ error }}</p>

    <ul v-else class="inv__list">
      <li v-for="invoice in visibleInvoices" :key="invoice.cycle">
        <button
          type="button"
          class="inv__row"
          @click="emit('open-invoice', { card: currentCard, cycle: invoice.cycle })"
        >
          <div class="inv__rowTop">
            <span class="inv__month">{{ shortLabel(invoice) }}</span>
            <span class="inv__total">{{ formatCurrency(invoice.totalInCents) }}</span>
          </div>

          <div class="inv__rowBottom">
            <span class="inv__dates">{{ datesLabel(invoice) }}</span>
            <span class="inv__badge" :class="`inv__badge--${invoice.status}`">
              {{ STATUS_LABELS[invoice.status] }}
            </span>
          </div>

          <!-- Barra de progresso do pagamento, só quando há algo pago a menos. -->
          <div v-if="invoice.status === 'parcial'" class="inv__progressWrap">
            <div class="inv__progress">
              <div class="inv__progressFill" :style="{ width: paidPercent(invoice) + '%' }"></div>
            </div>
            <p class="inv__progressText">
              {{ formatCurrency(invoice.paidInCents) }} pagos · faltam
              {{ formatCurrency(invoice.remainingInCents) }}
            </p>
          </div>
        </button>
      </li>
    </ul>

    <GaButton
      v-if="openInvoice && !needsCycleSetup"
      variant="primary"
      block
      @click="emit('pay-invoice', { card: currentCard, invoice: openInvoice })"
    >
      Registrar pagamento
    </GaButton>
  </div>
</template>

<script setup>
/**
 * Card de faturas do cartão de crédito.
 *
 * SUBSTITUI o antigo CreditCardInvoiceCard, que mostrava um único número — a
 * soma das compras de crédito do mês do calendário. Aquele número nunca batia
 * com o do banco, porque a fatura real segue o ciclo de FECHAMENTO, não o mês.
 * Além disso não tinha status nem como ver o que havia dentro.
 *
 * MIGRADO para o design system gestaoApp (ROADMAP 1.4). Os selos de status são
 * o ponto sensível: a cor deles é INFORMAÇÃO. O mapa de classes Tailwind virou
 * `STATUS_LABELS` + uma classe por status, resolvida em CSS por token:
 *
 *   status    antes                           depois                     por quê
 *   aberta    bg-sky-100   / text-sky-700     --feedback-info   (cobalt)  em curso, nada a fazer ainda
 *   parcial   bg-amber-100 / text-amber-700   --feedback-warning (orange) pago pela metade, falta algo
 *   paga      bg-emerald-100/text-emerald-700 --feedback-success (green)  concluída
 *   vencida   bg-red-100   / text-red-700     --feedback-danger  (red)    passou do vencimento
 *   vazia     bg-slate-100 / text-slate-500   --status-todo (neutro Ink)  sem compras, sem estado
 *
 * Os três que já eram sinal (laranja, verde, vermelho) continuam na mesma
 * família, agora nas cores do sistema. "Aberta" era azul-céu, cor sem papel
 * definido no sistema; virou cobalt, que é o `--feedback-info` e também o
 * `--status-progress` da skill — "em andamento". "Vazia" continua neutra, na
 * escala Ink em vez de slate.
 */
import { ref, computed, watch, onMounted } from "vue";
import GaButton from "@/design-system/components/GaButton.vue";
import { getCardInvoices } from "@/services/api";
import { useBankCards } from "@/stores/bankCards";
import { useFormatters } from "@/services/useFormatters";

const emit = defineEmits(["open-invoice", "pay-invoice"]);

/**
 * O card acompanha o mês do dashboard.
 *
 * Antes a lista era ancorada em "hoje", então navegar para novembro continuava
 * mostrando a fatura de outubro. Como as parcelas de uma compra já nascem
 * gravadas nos meses futuros, ancorar no mês selecionado é o que revela quanto
 * o cartão já tem comprometido lá na frente.
 */
const props = defineProps({ year: Number, month: Number });

const { formatCurrency, formatDate } = useFormatters();

// Mesma lista dos outros dois lugares que mostram cartões: um GET atende os
// três, e um cartão cadastrado em "Meus cartões" já aparece aqui.
const { creditCards, load: loadBankCards } = useBankCards();

const invoices = ref([]);
const selectedCardId = ref("");
const loading = ref(false);
const error = ref("");

const STATUS_LABELS = {
  aberta: "aberta",
  parcial: "parcial",
  paga: "paga",
  vencida: "vencida",
  vazia: "sem compras",
};

const currentCard = computed(
  () => creditCards.value.find((card) => card._id === selectedCardId.value) ?? null
);

/** O favorito entre os cartões de crédito, se houver. */
const favoriteCardId = computed(() => creditCards.value.find((card) => card.starred)?._id ?? "");

/** O cartão existe mas ainda não tem os dias de fechamento/vencimento. */
const needsCycleSetup = computed(
  () => Boolean(currentCard.value) && (!currentCard.value.closingDay || !currentCard.value.dueDay)
);

/**
 * Quantas faturas o card mostra. Empilhar o histórico inteiro estica o card e
 * afoga o que interessa, que são as faturas recentes. A lista completa fica
 * para uma tela dedicada.
 */
const VISIBLE_INVOICES = 3;

/**
 * Faturas vazias do futuro não interessam — só poluem a lista. Mas a fatura
 * aberta atual aparece mesmo sem compras, para o usuário ver que está zerada.
 *
 * O corte vem DEPOIS do filtro, e a busca traz mais que VISIBLE_INVOICES de
 * propósito: cortando antes, um ciclo vazio no meio gastaria uma das três
 * vagas e o card mostraria menos faturas do que cabe.
 */
const visibleInvoices = computed(() =>
  invoices.value
    .filter((invoice, index) => index === 0 || invoice.status !== "vazia")
    .slice(0, VISIBLE_INVOICES)
);

/** A fatura que ainda pode receber pagamento (a mais recente não quitada). */
const openInvoice = computed(() =>
  invoices.value.find((invoice) => ["aberta", "parcial", "vencida"].includes(invoice.status))
);

const paidPercent = (invoice) =>
  invoice.totalInCents > 0
    ? Math.min(100, Math.round((invoice.paidInCents / invoice.totalInCents) * 100))
    : 0;

/** "agosto de 2026" -> "agosto" quando é do ano corrente. */
function shortLabel(invoice) {
  const currentYear = new Date().getUTCFullYear();
  const invoiceYear = Number(invoice.cycle.slice(0, 4));
  return invoiceYear === currentYear ? invoice.label.replace(/ de \d{4}$/, "") : invoice.label;
}

function datesLabel(invoice) {
  const closing = formatDate(invoice.closingDate).slice(0, 5);
  const due = formatDate(invoice.dueDate).slice(0, 5);
  return `fecha ${closing} · vence ${due}`;
}

async function loadCards() {
  await loadBankCards();

  // Mantém a escolha enquanto o cartão existir; senão, o favorito ou o primeiro.
  if (!currentCard.value && creditCards.value.length > 0) {
    selectedCardId.value = favoriteCardId.value || creditCards.value[0]._id;
  }
}

async function loadInvoices() {
  if (!selectedCardId.value || needsCycleSetup.value) {
    invoices.value = [];
    return;
  }

  error.value = "";

  try {
    const data = await getCardInvoices(selectedCardId.value, {
      limit: 6,
      year: props.year,
      month: props.month,
    });
    invoices.value = data.invoices ?? [];
  } catch (err) {
    error.value = err.displayMessage ?? "Erro ao carregar faturas";
    invoices.value = [];
  }
}

async function refetch() {
  loading.value = true;
  try {
    await loadCards();
    await loadInvoices();
  } catch (err) {
    error.value = err.displayMessage ?? "Erro ao carregar cartões";
  } finally {
    loading.value = false;
  }
}

/**
 * Marcar a estrela em outro cartão troca as faturas exibidas na hora, sem
 * precisar mexer no seletor: o favorito é, por definição, o que se quer ver.
 */
watch(favoriteCardId, (id) => {
  if (id) selectedCardId.value = id;
});

watch(selectedCardId, loadInvoices);
watch(() => [props.year, props.month], loadInvoices);
onMounted(refetch);

defineExpose({ refetch });
</script>

<style scoped>
.inv {
	display: flex;
	flex-direction: column;
	gap: var(--space-4);
	min-width: 0;
	padding: var(--card-pad);
	border: 1px solid var(--border-subtle);
	border-radius: var(--radius-card);
	background: var(--surface-card);
	box-shadow: var(--shadow-xs);
	color: var(--text-primary);
}

.inv__head {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: var(--space-3);
}
.inv__label {
	font: var(--type-label);
	letter-spacing: var(--ls-label);
	text-transform: uppercase;
	color: var(--text-tertiary);
}

.inv__select {
	max-width: 50%;
	padding: var(--space-1) var(--space-2);
	border: 1px solid var(--border-default);
	border-radius: var(--radius-sm);
	background: var(--surface-card);
	font: var(--type-caption);
	color: var(--text-secondary);
	cursor: pointer;
}
.inv__select:focus-visible {
	outline: none;
	border-color: var(--border-focus);
	box-shadow: var(--ring-focus);
}
.inv__cardName {
	font: var(--fw-medium) var(--fs-caption) / 1.4 var(--font-ui);
	color: var(--text-secondary);
}

.inv__empty,
.inv__setup,
.inv__error {
	margin: 0;
	font: var(--type-small);
}
.inv__empty {
	padding: var(--space-6) 0;
	text-align: center;
	color: var(--text-tertiary);
}
.inv__setup {
	display: flex;
	flex-direction: column;
	gap: var(--space-2);
	padding: var(--space-4) 0;
	color: var(--text-secondary);
}
.inv__setup p {
	margin: 0;
}
.inv__setupHint {
	font: var(--type-caption);
	color: var(--text-tertiary);
}
.inv__error {
	padding: var(--space-6) 0;
	text-align: center;
	color: var(--feedback-danger);
}

.inv__list {
	display: flex;
	flex-direction: column;
	gap: var(--space-2);
	margin: 0;
	padding: 0;
	list-style: none;
}

/* Linha clicável, no padrão `.ga-task` da skill: raio 12 e fio que escurece no
   hover, em vez de fundo cinza. */
.inv__row {
	display: block;
	width: 100%;
	padding: var(--space-2-5) var(--space-3);
	border: 1px solid var(--border-subtle);
	border-radius: 12px;
	background: var(--surface-card);
	text-align: left;
	cursor: pointer;
	transition:
		border-color var(--dur-fast) var(--ease-out),
		box-shadow var(--dur-fast) var(--ease-out);
}
.inv__row:hover {
	border-color: var(--border-default);
	box-shadow: var(--shadow-sm);
}
.inv__row:focus-visible {
	outline: none;
	border-color: var(--border-focus);
	box-shadow: var(--ring-focus);
}

.inv__rowTop,
.inv__rowBottom {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: var(--space-2);
}
.inv__rowBottom {
	margin-top: var(--space-1);
}

.inv__month {
	font: var(--type-body-strong);
	color: var(--text-primary);
	min-width: 0;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}
.inv__month::first-letter {
	text-transform: uppercase;
}
.inv__total {
	font: var(--fw-semibold) var(--fs-body) / 1.45 var(--font-ui);
	color: var(--text-primary);
	font-variant-numeric: tabular-nums;
	white-space: nowrap;
}
.inv__dates {
	font: var(--type-caption);
	color: var(--text-tertiary);
}

/* `.ga-badge--sm` da skill: pílula de 18px, 11px de texto. A caixa alta e o
   tracking de +8% são a regra de micro-rótulo. */
.inv__badge {
	display: inline-flex;
	align-items: center;
	height: 18px;
	padding: 0 var(--space-1-5);
	flex-shrink: 0;
	border-radius: var(--radius-pill);
	font: var(--type-micro);
	letter-spacing: var(--ls-label);
	text-transform: uppercase;
	white-space: nowrap;
}
/* ── Cor que comunica: um sinal por estado de fatura ───────────────────── */
.inv__badge--aberta {
	background: var(--feedback-info-bg);
	color: var(--feedback-info);
}
.inv__badge--parcial {
	background: var(--feedback-warning-bg);
	color: var(--feedback-warning);
}
.inv__badge--paga {
	background: var(--feedback-success-bg);
	color: var(--feedback-success);
}
.inv__badge--vencida {
	background: var(--feedback-danger-bg);
	color: var(--feedback-danger);
}
.inv__badge--vazia {
	background: var(--status-todo-bg);
	color: var(--text-secondary);
}

.inv__progressWrap {
	margin-top: var(--space-2);
}
/* `.ga-progress` da skill. */
.inv__progress {
	width: 100%;
	height: 6px;
	border-radius: var(--radius-pill);
	background: var(--ink-100);
	overflow: hidden;
}
/*
 * O preenchimento fica laranja, igual ao selo "parcial": a barra só aparece
 * nesse estado, e as duas marcas precisam dizer a mesma coisa. Era
 * `bg-amber-400`.
 */
.inv__progressFill {
	height: 100%;
	border-radius: inherit;
	background: var(--orange-500);
	transition: width var(--dur-slow) var(--ease-out);
}
.inv__progressText {
	margin: var(--space-1) 0 0;
	font: var(--type-caption);
	color: var(--text-tertiary);
	font-variant-numeric: tabular-nums;
}
</style>
