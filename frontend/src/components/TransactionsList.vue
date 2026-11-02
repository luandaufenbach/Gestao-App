<template>
  <section ref="root" class="tlist">
    <div class="tlist__head">
      <span class="tlist__label">Últimas transações</span>
    </div>

    <p v-if="loading" class="tlist__state">Carregando...</p>

    <p v-else-if="error" class="tlist__state tlist__state--error">{{ error }}</p>

    <p v-else-if="!transactions.length" class="tlist__state">Nenhuma transação encontrada.</p>

    <!--
      A partir de 768px: flex-1 + min-height 0 + overflow hidden fazem a lista
      ocupar a altura que sobra do card (ditada pelo card de categorias ao
      lado) sem nunca esticá-lo; quantos itens cabem ali é medido em runtime.
      Abaixo disso os cards ficam empilhados e a altura vem do conteúdo — aí
      não há "altura disponível" para preencher, e a lista volta a ser comum.
    -->
    <ul v-else ref="list" class="tlist__items">
      <TransactionRow
        v-for="t in visibleTransactions"
        :key="t._id"
        :transaction="t"
        @edit="editTransaction"
        @delete="askDelete"
      />
    </ul>

    <DeleteTransactionDialog
      :transaction="pendingDelete"
      :busy="deleting"
      :error="deleteError"
      @confirm="confirmDelete"
      @cancel="pendingDelete = null"
    />

    <EditTransactionModal
      v-if="editingTransaction"
      :transaction="editingTransaction"
      @close="editingTransaction = null"
      @transaction-updated="handleUpdated"
    />
  </section>
</template>

<script setup>
/**
 * Card de últimas transações do dashboard.
 *
 * MIGRADO para o design system gestaoApp (ROADMAP 1.4). É usado só pelo
 * dashboard — a tela de Transações monta a própria lista com o TransactionRow
 * direto —, então migrar a casca aqui não alcança nenhuma tela fora do escopo
 * desta etapa.
 */
import { ref, computed, onMounted, watch, useTemplateRef } from "vue";
import TransactionRow from "./TransactionRow.vue";
import EditTransactionModal from "./EditTransactionModal.vue";
import DeleteTransactionDialog from "./DeleteTransactionDialog.vue";
import { getTransactions, deleteTransaction } from "../services/api";
import { useFitToHeight } from "../services/useFitToHeight";

const emit = defineEmits(["transaction-deleted", "transaction-updated"]);

const props = defineProps({
  year: Number,
  month: Number,
  /** Teto de itens buscados no backend. Com fitToHeight, é só o teto: o que
   *  aparece de fato é o que couber na altura do card. */
  limit: { type: Number, default: 8 },
  /** Ajusta a quantidade de itens à altura disponível, em vez de mostrar um
   *  número fixo. Usado no dashboard, onde o card divide a linha do grid com
   *  o de categorias e precisa preencher a mesma altura. */
  fitToHeight: { type: Boolean, default: false },
});

const transactions = ref([]);
const loading = ref(false);
const error = ref("");

const editingTransaction = ref(null);
const pendingDelete = ref(null);
const deleting = ref(false);
const deleteError = ref("");

const rootEl = useTemplateRef("root");
const listEl = useTemplateRef("list");

const { capacity, remeasure } = useFitToHeight(rootEl, listEl, {
  enabled: () => props.fitToHeight,
  fallbackRowHeight: 58,
});

const visibleTransactions = computed(() =>
  props.fitToHeight ? transactions.value.slice(0, capacity.value) : transactions.value
);

async function loadTransactions() {
  loading.value = true;
  error.value = "";

  try {
    // O limite agora é aplicado pelo backend, não com um .slice() depois de
    // baixar a coleção inteira.
    transactions.value = await getTransactions({
      year: props.year,
      month: props.month,
      limit: props.limit,
    });
  } catch (err) {
    error.value = err.displayMessage ?? "Falha ao buscar transações.";
    transactions.value = [];
  } finally {
    loading.value = false;
  }
}

function editTransaction(transaction) {
  editingTransaction.value = transaction;
}

function askDelete(transaction) {
  deleteError.value = "";
  pendingDelete.value = transaction;
}

/** @param {"single"|"group"} scope */
async function confirmDelete(scope) {
  deleting.value = true;
  deleteError.value = "";

  try {
    await deleteTransaction(pendingDelete.value._id, scope);
    pendingDelete.value = null;
    await loadTransactions();
    emit("transaction-deleted");
  } catch (err) {
    deleteError.value = err.displayMessage ?? "Erro ao excluir transação.";
  } finally {
    deleting.value = false;
  }
}

async function handleUpdated() {
  editingTransaction.value = null;
  await loadTransactions();
  emit("transaction-updated");
}

onMounted(loadTransactions);

watch(() => [props.year, props.month], loadTransactions);

// A cada recarga o <ul> é recriado (passa pelo estado de "Carregando..."),
// então a medição precisa refazer com o DOM já atualizado.
watch(transactions, remeasure);

defineExpose({ loadTransactions });
</script>

<style scoped>
.tlist {
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
@media (min-width: 768px) {
	.tlist {
		height: 100%;
	}
}

.tlist__head {
	display: flex;
	align-items: center;
	justify-content: space-between;
}
.tlist__label {
	font: var(--type-label);
	letter-spacing: var(--ls-label);
	text-transform: uppercase;
	color: var(--text-tertiary);
}

.tlist__state {
	margin: 0;
	padding: var(--space-4) 0;
	text-align: center;
	font: var(--type-small);
	color: var(--text-tertiary);
}
.tlist__state--error {
	color: var(--feedback-danger);
}

.tlist__items {
	display: flex;
	flex-direction: column;
	gap: var(--space-2);
	margin: 0;
	padding: 0;
	list-style: none;
}
@media (min-width: 768px) {
	.tlist__items {
		flex: 1;
		min-height: 0;
		overflow: hidden;
	}
}
</style>
