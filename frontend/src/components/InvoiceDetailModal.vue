<template>
  <GaModal
    :title="`Fatura de ${invoice?.label ?? '...'}`"
    :subtitle="invoice ? `fecha ${formatDate(invoice.closingDate)} · vence ${formatDate(invoice.dueDate)}` : ''"
    size="xl"
    @close="emit('close')"
  >
    <p v-if="loading" class="inv__state">Carregando...</p>

    <p v-else-if="error" class="inv__state inv__state--error">{{ error }}</p>

    <div v-else-if="invoice" class="inv__content">
      <div class="inv__total">
        <div class="inv__totalTop">
          <div>
            <p class="inv__label">Total</p>
            <p class="inv__totalValue">{{ formatCurrency(invoice.totalInCents) }}</p>
          </div>
          <span class="inv__badge" :class="`inv__badge--${invoice.status}`">
            {{ STATUS_LABELS[invoice.status] }}
          </span>
        </div>

        <dl v-if="invoice.paidInCents > 0" class="inv__split">
          <div class="inv__splitLine">
            <dt>Pago</dt>
            <dd class="inv__paid">{{ formatCurrency(invoice.paidInCents) }}</dd>
          </div>
          <div v-if="invoice.remainingInCents > 0" class="inv__splitLine">
            <dt>Falta</dt>
            <dd class="inv__remaining">{{ formatCurrency(invoice.remainingInCents) }}</dd>
          </div>
        </dl>
      </div>

      <!--
        O agrupamento por categoria é o que diferencia esta tela de um filtro
        na lista de transações: responde "do que é feita a minha fatura?".
      -->
      <section v-if="invoice.categories.length">
        <h3 class="inv__sectionTitle">Por categoria</h3>
        <ul class="inv__rows">
          <li
            v-for="item in invoice.categories"
            :key="item.categoryId ?? item.category"
            class="inv__row"
          >
            <div class="inv__rowMain">
              <!-- A cor é da categoria, escolhida pelo usuário: é dado. -->
              <span class="inv__dot" :style="{ background: item.color }"></span>
              <span class="inv__rowName">{{ item.category }}</span>
              <span class="inv__rowCount">
                {{ item.count }} {{ item.count === 1 ? "compra" : "compras" }}
              </span>
            </div>
            <span class="inv__rowValue">{{ formatCurrency(item.totalInCents) }}</span>
          </li>
        </ul>
      </section>

      <section v-if="invoice.transactions.length">
        <h3 class="inv__sectionTitle">Compras</h3>
        <ul class="inv__rows inv__rows--divided">
          <li v-for="t in invoice.transactions" :key="t._id" class="inv__row">
            <div class="inv__rowText">
              <p class="inv__rowName">{{ t.description }}</p>
              <p class="inv__rowMeta">
                {{ formatDate(t.date) }} · {{ formatCategory(t.category) }}
                <span v-if="t.installment?.total > 1" class="inv__installment">
                  {{ t.installment.current }}/{{ t.installment.total }}
                </span>
              </p>
            </div>
            <span class="inv__rowValue">{{ formatCurrency(t.valueInCents) }}</span>
          </li>
        </ul>
      </section>

      <section v-if="invoice.payments.length">
        <h3 class="inv__sectionTitle">Pagamentos</h3>
        <ul class="inv__rows">
          <li v-for="p in invoice.payments" :key="p._id" class="inv__row">
            <div class="inv__rowText">
              <p class="inv__rowName">{{ p.description }}</p>
              <p class="inv__rowMeta">{{ formatDate(p.date) }}</p>
            </div>
            <span class="inv__rowValue inv__rowValue--paid">
              {{ formatCurrency(p.valueInCents) }}
            </span>
          </li>
        </ul>
      </section>

      <p v-if="!invoice.transactions.length" class="inv__state">Nenhuma compra nesta fatura.</p>
    </div>

    <template #footer>
      <GaButton variant="secondary" @click="emit('close')">Fechar</GaButton>
      <GaButton
        v-if="invoice && invoice.remainingInCents > 0"
        variant="primary"
        @click="emit('pay', invoice)"
      >
        Registrar pagamento
      </GaButton>
    </template>
  </GaModal>
</template>

<script setup>
/**
 * MIGRADO para o design system gestaoApp (ROADMAP 1.4). A casca é o `GaModal`
 * — ver NewTransactionalModal.vue, que explica a troca.
 *
 * ── O selo de status segue o card de faturas, não um mapa novo ───────────
 *
 * O `STATUS_STYLES` daqui era um segundo mapa de classes Tailwind, paralelo ao
 * do `InvoicesCard`, com os MESMOS cinco estados e as mesmas cinco cores
 * escritas de novo. O card já foi migrado na primeira metade da etapa; aqui o
 * mapa vira só os rótulos, e a cor sai da mesma tabela de tokens que lá:
 *
 *   aberta   --feedback-info     (cobalt)  em curso, nada a fazer ainda
 *   parcial  --feedback-warning  (orange)  pago pela metade, falta algo
 *   paga     --feedback-success  (green)   concluída
 *   vencida  --feedback-danger   (red)     passou do vencimento
 *   vazia    --status-todo-bg    (neutro)  sem compras, sem estado
 *
 * As outras duas cores que comunicam nesta tela:
 *
 * - "Pago" era `text-emerald-600` e continua verde (`--feedback-success`): é
 *   dinheiro que já saiu e quitou parte da fatura, conclusão.
 * - "Falta" era `text-amber-600` e continua laranja (`--feedback-warning`):
 *   é o mesmo sinal do selo "parcial" e da barra de progresso do card de
 *   faturas. As três marcas dizem a mesma coisa e precisam da mesma cor.
 * - O contador de parcela era `text-blue-600`: destaque, não sinal. Virou
 *   `--text-brand`, igual ao da linha de transação já migrada.
 */
import { ref, onMounted } from "vue";
import GaButton from "@/design-system/components/GaButton.vue";
import GaModal from "@/design-system/components/GaModal.vue";
import { getCardInvoice } from "@/services/api";
import { useFormatters } from "@/services/useFormatters";

const props = defineProps({
  /** O cartão inteiro, não só o id — o modal de pagamento precisa do nome. */
  card: { type: Object, required: true },
  cycle: { type: String, required: true },
});

const emit = defineEmits(["close", "pay"]);

const { formatCurrency, formatDate, formatCategory } = useFormatters();

const invoice = ref(null);
const loading = ref(true);
const error = ref("");

const STATUS_LABELS = {
  aberta: "aberta",
  parcial: "parcial",
  paga: "paga",
  vencida: "vencida",
  vazia: "sem compras",
};

onMounted(async () => {
  try {
    invoice.value = await getCardInvoice(props.card._id, props.cycle);
  } catch (err) {
    error.value = err.displayMessage ?? "Erro ao carregar a fatura";
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.inv__state {
	padding: var(--space-10) 0;
	text-align: center;
	font: var(--type-small);
	color: var(--text-tertiary);
}
.inv__state--error {
	color: var(--feedback-danger);
}

.inv__content {
	display: flex;
	flex-direction: column;
	gap: var(--space-5);
}

/* ── Bloco do total ────────────────────────────────────────────────────── */
/* `.ga-card--sunken` da skill. */
.inv__total {
	padding: var(--card-pad-sm);
	border: 1px solid var(--border-subtle);
	border-radius: var(--radius-card);
	background: var(--surface-sunken);
}
.inv__totalTop {
	display: flex;
	align-items: flex-end;
	justify-content: space-between;
	gap: var(--space-3);
}
.inv__label {
	font: var(--type-label);
	letter-spacing: var(--ls-label);
	text-transform: uppercase;
	color: var(--text-tertiary);
}
/* O total é um stat: tinta, não sinal. `--type-stat` da skill. */
.inv__totalValue {
	margin-top: var(--space-1);
	font: var(--type-stat);
	letter-spacing: -0.02em;
	color: var(--text-primary);
	font-variant-numeric: tabular-nums;
}

/* `.ga-badge--sm` da skill — o mesmo selo do card de faturas. */
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

.inv__split {
	margin-top: var(--space-3);
	padding-top: var(--space-3);
	border-top: 1px solid var(--border-default);
}
.inv__splitLine {
	display: flex;
	justify-content: space-between;
	gap: var(--space-3);
	font: var(--type-body);
	color: var(--text-secondary);
}
.inv__splitLine + .inv__splitLine {
	margin-top: var(--space-0-5);
}
/* Pago é conclusão (verde); falta é atenção (laranja). Ver o script. */
.inv__paid {
	font-weight: var(--fw-medium);
	color: var(--feedback-success);
	font-variant-numeric: tabular-nums;
}
.inv__remaining {
	font-weight: var(--fw-medium);
	color: var(--feedback-warning);
	font-variant-numeric: tabular-nums;
}

/* ── Listas ────────────────────────────────────────────────────────────── */
.inv__sectionTitle {
	margin-bottom: var(--space-2);
	font: var(--type-label);
	letter-spacing: var(--ls-label);
	text-transform: uppercase;
	color: var(--text-tertiary);
}

.inv__rows {
	display: flex;
	flex-direction: column;
	gap: var(--space-1-5);
	margin: 0;
	padding: 0;
	list-style: none;
}
.inv__rows--divided {
	gap: 0;
}
.inv__rows--divided .inv__row {
	padding: var(--space-1-5) 0;
	border-bottom: 1px solid var(--border-subtle);
}
.inv__rows--divided .inv__row:last-child {
	border-bottom: 0;
}

.inv__row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: var(--space-3);
}
.inv__rowMain {
	display: flex;
	align-items: center;
	gap: var(--space-2);
	min-width: 0;
}
.inv__rowText {
	min-width: 0;
}
.inv__dot {
	width: 12px;
	height: 12px;
	flex-shrink: 0;
	border-radius: 50%;
}
.inv__rowName {
	min-width: 0;
	font: var(--type-body);
	color: var(--text-primary);
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}
.inv__rowCount,
.inv__rowMeta {
	font: var(--type-caption);
	color: var(--text-tertiary);
	white-space: nowrap;
}
.inv__rowValue {
	flex-shrink: 0;
	font: var(--fw-medium) var(--fs-body) / 1.45 var(--font-ui);
	color: var(--text-secondary);
	font-variant-numeric: tabular-nums;
}
/* Depois de `.inv__rowValue`, e não junto do `.inv__paid` lá de cima: as duas
   classes têm a mesma especificidade, então quem vence é a última escrita. */
.inv__rowValue--paid {
	color: var(--feedback-success);
}

/* Destaque, não sinal: a parcela diz "esta compra tem continuação". Mesmo
   token da linha de transação. */
.inv__installment {
	margin-left: var(--space-1);
	font-weight: var(--fw-semibold);
	color: var(--text-brand);
	font-variant-numeric: tabular-nums;
}
</style>
