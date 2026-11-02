<template>
  <GaModal title="Editar transação" size="lg" @close="closeModal">
    <GaNote v-if="isInstallment" tone="warning" icon="info" class="edittx__note">
      Esta é a parcela {{ transaction.installment.current }} de
      {{ transaction.installment.total }}. Alterações são aplicadas a
      <strong>todas as parcelas</strong> da compra, e o valor total é redistribuído entre elas.
    </GaNote>

    <form id="edit-transaction-form" class="edittx__form" @submit.prevent="saveTransaction">
      <TransactionFormFields :form="form" :categories="categories" :lock-installments="true" />

      <p v-if="form.errorMessage.value" class="edittx__error">
        {{ form.errorMessage.value }}
      </p>
    </form>

    <template #footer>
      <GaButton variant="secondary" @click="closeModal">Cancelar</GaButton>
      <!-- Rótulo trocado e botão desabilitado: o estado de carregamento que o
           app já usava. A skill não define nenhum. -->
      <GaButton type="submit" form="edit-transaction-form" variant="primary" :disabled="saving">
        {{ saving ? "Atualizando..." : "Atualizar" }}
      </GaButton>
    </template>
  </GaModal>
</template>

<script setup>
/**
 * MIGRADO para o design system gestaoApp (ROADMAP 1.4), igual ao modal de
 * criação — ver NewTransactionalModal.vue, que explica a casca, o botão e o
 * atributo `form` do envio.
 *
 * O que é só daqui: o aviso de parcela era `bg-amber-50`/`border-amber-200`/
 * `text-amber-800` e virou `GaNote` de tom `warning`. Continua laranja porque
 * laranja é o sinal de atenção do sistema, e aqui ele avisa de um efeito
 * colateral que o usuário não pediu — mexer numa parcela mexe nas doze.
 */
import { ref, computed, onMounted } from "vue";
import GaButton from "@/design-system/components/GaButton.vue";
import GaModal from "@/design-system/components/GaModal.vue";
import GaNote from "@/design-system/components/GaNote.vue";
import { useTransactions } from "../services/useTransactions";
import { useCategories } from "../stores/categories";
import { useTransactionForm } from "../services/useTransactionForm";
import TransactionFormFields from "./TransactionFormFields.vue";

const props = defineProps({
  transaction: { type: Object, required: true },
});

const emit = defineEmits(["close", "transaction-updated"]);

const { update } = useTransactions();
const { categories, load: loadCategories } = useCategories();

// O formulário reconstrói o VALOR TOTAL a partir da parcela (ver bug C1).
const form = useTransactionForm(props.transaction);
const saving = ref(false);

const isInstallment = computed(() => (props.transaction.installment?.total ?? 1) > 1);

onMounted(loadCategories);

async function saveTransaction() {
  if (!form.validate()) return;

  saving.value = true;

  try {
    await update(props.transaction._id, form.getUpdatePayload());
    emit("transaction-updated");
    closeModal();
  } catch (error) {
    form.errorMessage.value = error.displayMessage ?? "Erro ao atualizar transação.";
  } finally {
    saving.value = false;
  }
}

function closeModal() {
  emit("close");
}
</script>

<style scoped>
.edittx__note {
	margin-bottom: var(--space-4);
}

.edittx__form {
	display: grid;
	grid-template-columns: 1fr;
	gap: var(--space-4);
}
@media (min-width: 640px) {
	.edittx__form {
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}
}

.edittx__error {
	font: var(--type-small);
	color: var(--feedback-danger);
}
@media (min-width: 640px) {
	.edittx__error {
		grid-column: 1 / -1;
	}
}
</style>
