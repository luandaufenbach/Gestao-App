<template>
  <GaModal title="Registrar pagamento" size="md" @close="emit('close')">
    <div class="pay__summary">
      <p class="pay__summaryTitle">Fatura de {{ invoice.label }}</p>
      <p class="pay__summaryLine">
        Total {{ formatCurrency(invoice.totalInCents) }} · vence {{ formatDate(invoice.dueDate) }}
      </p>
      <p v-if="invoice.paidInCents > 0" class="pay__summaryLine">
        Já pago {{ formatCurrency(invoice.paidInCents) }} · falta
        {{ formatCurrency(invoice.remainingInCents) }}
      </p>
    </div>

    <form id="pay-invoice-form" class="pay__form" @submit.prevent="submit">
      <div class="pay__amount">
        <GaField v-slot="{ id }" label="Valor" variant="number">
          <input :id="id" v-model="amount" type="number" step="0.01" min="0" required />
        </GaField>

        <!--
          O pagamento parcial/antecipado é um caso de uso real, não um erro:
          adiantar um pedaço da fatura para "não misturar" com o resto.
          Por isso o valor vem preenchido com o que falta, mas é editável.
        -->
        <div>
          <GaButton
            variant="secondary"
            size="sm"
            @click="amount = centsToInputValue(invoice.remainingInCents)"
          >
            Valor total ({{ formatCurrency(invoice.remainingInCents) }})
          </GaButton>
        </div>
      </div>

      <GaField v-slot="{ id }" label="Data do pagamento" variant="date">
        <input :id="id" v-model="date" type="date" required />
      </GaField>

      <GaField v-slot="{ id }" label="Descrição">
        <input :id="id" v-model="description" type="text" maxlength="200" />
      </GaField>

      <p class="pay__hint">
        O pagamento sai do seu saldo disponível, mas não conta como despesa — ela já foi registrada
        em cada compra do cartão.
      </p>

      <p v-if="errorMessage" class="pay__error">{{ errorMessage }}</p>
    </form>

    <template #footer>
      <GaButton variant="secondary" @click="emit('close')">Cancelar</GaButton>
      <!-- Rótulo trocado e botão desabilitado: o estado de carregamento que o
           app já usava. A skill não define nenhum. -->
      <GaButton type="submit" form="pay-invoice-form" variant="primary" :disabled="saving">
        {{ saving ? "Salvando..." : "Registrar" }}
      </GaButton>
    </template>
  </GaModal>
</template>

<script setup>
/**
 * MIGRADO para o design system gestaoApp (ROADMAP 1.4). A casca é o `GaModal`
 * — ver NewTransactionalModal.vue, que explica a troca. O que é só daqui:
 *
 * - O resumo da fatura era `bg-slate-50 border-slate-200`; virou
 *   `--surface-sunken` com `--border-subtle`, que é o `.ga-card--sunken` da
 *   skill.
 * - O atalho "Valor total" era um botãozinho `text-emerald-700` sobre
 *   `bg-emerald-50`. Verde no sistema quer dizer entrada ou conclusão, e isto
 *   não é nenhum dos dois: é um atalho de preenchimento. Virou o `GaButton`
 *   `secondary` no tamanho `sm`, que é a forma que o sistema dá para ação de
 *   apoio.
 * - "Registrar" era `bg-lime-400`; ação é cobalt.
 */
import { ref } from "vue";
import GaButton from "@/design-system/components/GaButton.vue";
import GaField from "@/design-system/components/GaField.vue";
import GaModal from "@/design-system/components/GaModal.vue";
import { createTransaction } from "@/services/api";
import { useFormatters } from "@/services/useFormatters";

const props = defineProps({
  card: { type: Object, required: true },
  invoice: { type: Object, required: true },
});

const emit = defineEmits(["close", "paid"]);

const { formatCurrency, formatDate, parseCurrencyToCents, centsToInputValue } = useFormatters();

// Sugere o que falta pagar e a data de hoje — os valores mais prováveis.
const amount = ref(centsToInputValue(props.invoice.remainingInCents));
const date = ref(new Date().toISOString().slice(0, 10));
// O banco identifica melhor o lançamento do que o apelido do cartão: na lista
// de transações, "Fatura Nubank" diz o que "Fatura Luan D Oliveira" não dizia.
// O apelido só entra se o cartão não tiver banco preenchido (o campo é opcional).
const description = ref(`Fatura ${props.card.bank || props.card.name}`);

const saving = ref(false);
const errorMessage = ref("");

async function submit() {
  errorMessage.value = "";

  const cents = parseCurrencyToCents(amount.value);

  if (cents === null || cents <= 0) {
    errorMessage.value = "Informe um valor maior que zero.";
    return;
  }

  saving.value = true;

  try {
    await createTransaction({
      type: "invoice_payment",
      description: description.value.trim() || "Pagamento da fatura",
      totalValueInCents: cents,
      date: date.value,
      bankCard: props.card._id,
      invoiceCycle: props.invoice.cycle,
    });

    emit("paid");
  } catch (error) {
    errorMessage.value = error.displayMessage ?? "Erro ao registrar o pagamento.";
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
/* `.ga-card--sunken` da skill: superfície rebaixada, sem sombra. */
.pay__summary {
	margin-bottom: var(--space-4);
	padding: var(--space-2-5) var(--space-3);
	border: 1px solid var(--border-subtle);
	border-radius: var(--radius-md);
	background: var(--surface-sunken);
}
.pay__summaryTitle {
	font: var(--type-body-strong);
	color: var(--text-primary);
}
.pay__summaryLine {
	margin-top: var(--space-0-5);
	font: var(--type-caption);
	color: var(--text-secondary);
	font-variant-numeric: tabular-nums;
}

.pay__form {
	display: flex;
	flex-direction: column;
	gap: var(--space-4);
}

.pay__amount {
	display: flex;
	flex-direction: column;
	gap: var(--space-2);
}

.pay__hint {
	font: var(--type-caption);
	color: var(--text-tertiary);
}

.pay__error {
	font: var(--type-small);
	color: var(--feedback-danger);
}
</style>
