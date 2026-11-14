<template>
  <div class="plans">
    <header class="plans__head">
      <h1 class="plans__title">Plano</h1>
      <p class="plans__subtitle">
        Grátis é o presente; pago é o futuro e o passado. Lançar, categorizar, cartões e metas nunca
        deixam de ser gratuitos.
      </p>
    </header>

    <p v-if="loading && !state" class="plans__state">Carregando...</p>

    <template v-else>
      <GaNote v-if="hasPaidAccess" tone="success" icon="check">
        Plano Pro ativo até {{ formatDate(validUntil) }}.
        <template v-if="status === 'canceled'">
          A renovação foi cancelada, e o acesso vale até essa data.
        </template>
      </GaNote>

      <GaNote v-else-if="isAwaitingPayment" tone="warning" icon="clock">
        Cobrança criada e ainda não paga. O acesso abre assim que o Pix for compensado — costuma
        levar poucos minutos.
      </GaNote>

      <!-- Comparação antes do preço: quem não entende o que ganha não assina. -->
      <section class="plans__grid">
        <article class="plans__card">
          <span class="plans__label">Grátis</span>
          <p class="plans__price">R$ 0</p>
          <ul class="plans__list">
            <li v-for="item in FREE_FEATURES" :key="item">
              <GaIcon name="check" :size="16" />
              {{ item }}
            </li>
          </ul>
        </article>

        <article class="plans__card plans__card--pro">
          <span class="plans__label plans__label--pro">{{ catalog?.name ?? "Pro" }}</span>
          <p class="plans__price">
            {{ priceLabel }}
            <span class="plans__per">por mês</span>
          </p>
          <ul class="plans__list">
            <li v-for="item in PRO_FEATURES" :key="item">
              <GaIcon name="check" :size="16" />
              {{ item }}
            </li>
          </ul>

          <GaButton
            v-if="hasPaidAccess || isAwaitingPayment"
            variant="secondary"
            block
            :disabled="busy"
            @click="askCancel"
          >
            Cancelar assinatura
          </GaButton>
          <GaButton v-else variant="primary" block @click="showForm = true">
            Assinar com Pix
          </GaButton>
        </article>
      </section>

      <!--
        O CPF é exigência da API do provedor, não nossa. Dizer isso na tela
        evita a leitura de que estamos coletando documento por capricho.
      -->
      <section v-if="showForm && !hasPaidAccess" class="plans__form">
        <h2 class="plans__formTitle">Dados para a cobrança</h2>

        <GaField
          v-slot="{ id }"
          label="CPF ou CNPJ"
          :tone="formError ? 'error' : 'default'"
          :hint="
            formError || 'Exigido pelo Asaas para emitir a cobrança. Não fica guardado conosco.'
          "
        >
          <input
            :id="id"
            v-model="cpfCnpj"
            type="text"
            inputmode="numeric"
            placeholder="000.000.000-00"
            @keyup.enter="submit"
          />
        </GaField>

        <GaButton variant="primary" :disabled="busy" @click="submit">
          {{ busy ? "Gerando cobrança..." : "Gerar Pix" }}
        </GaButton>
      </section>

      <GaNote v-if="invoiceUrl" tone="info" icon="external-link">
        Cobrança criada.
        <a class="plans__link" :href="invoiceUrl" target="_blank" rel="noopener noreferrer">
          Abrir a página de pagamento
        </a>
        — o acesso abre sozinho quando o Pix for compensado.
      </GaNote>

      <p v-if="error" class="plans__state plans__state--error">{{ error }}</p>
    </template>

    <ConfirmDialog
      :open="confirmingCancel"
      :busy="busy"
      title="Cancelar assinatura"
      :message="cancelMessage"
      confirm-label="Cancelar assinatura"
      @confirm="doCancel"
      @cancel="confirmingCancel = false"
    />
  </div>
</template>

<script setup>
/**
 * Tela de planos (ROADMAP 2.2 e 2.3).
 *
 * É o destino do `PaywallNotice`: sem ela, a recusa de um recurso pago não
 * tinha para onde apontar e o paywall virava beco sem saída.
 *
 * O preço NÃO está escrito aqui. Vem de `catalog`, que o backend devolve a
 * partir de `config/plans.js` — número de preço em duas fontes diverge no dia
 * em que uma das duas muda, e quem descobre é o cliente.
 */
import { ref, computed, onMounted } from "vue";
import GaNote from "@/design-system/components/GaNote.vue";
import GaButton from "@/design-system/components/GaButton.vue";
import GaField from "@/design-system/components/GaField.vue";
import GaIcon from "@/design-system/components/GaIcon.vue";
import ConfirmDialog from "../components/ConfirmDialog.vue";
import { useSubscription } from "../stores/subscription";
import { useFormatters } from "../services/useFormatters";

const FREE_FEATURES = [
  "Lançamentos sem limite",
  "Categorias, cartões e metas",
  "Dashboard do mês corrente",
  "Fatura do ciclo atual",
  "Exportar e excluir seus dados",
];

const PRO_FEATURES = [
  "Tudo do grátis",
  "Projeção de caixa dos próximos meses",
  "Relatórios de 3 a 12 meses",
  "Faturas de ciclos futuros",
];

const { formatCurrency, formatDate } = useFormatters();
const {
  state,
  loading,
  error,
  hasPaidAccess,
  status,
  validUntil,
  catalog,
  isAwaitingPayment,
  load,
  subscribe,
  cancel,
} = useSubscription();

const showForm = ref(false);
const cpfCnpj = ref("");
const formError = ref("");
const busy = ref(false);
const invoiceUrl = ref("");
const confirmingCancel = ref(false);

onMounted(() => load({ force: true }).catch(() => {}));

const priceLabel = computed(() =>
  catalog.value?.priceInCents ? formatCurrency(catalog.value.priceInCents) : "—"
);

/**
 * O cancelamento preserva o período já pago, e a mensagem precisa dizer isso:
 * quem acha que perde o mês desiste de cancelar e pede estorno, o que é pior
 * para os dois lados.
 */
const cancelMessage = computed(() =>
  hasPaidAccess.value
    ? `Seu acesso continua até ${formatDate(validUntil.value)}. Depois disso, a conta volta ao plano grátis sem perder nenhum dado.`
    : "A cobrança em aberto deixa de existir. Nenhum dado é apagado."
);

async function submit() {
  formError.value = "";

  if (!cpfCnpj.value.trim()) {
    formError.value = "Informe o CPF ou CNPJ.";
    return;
  }

  busy.value = true;

  try {
    const charge = await subscribe(cpfCnpj.value);
    invoiceUrl.value = charge.invoiceUrl ?? "";
    showForm.value = false;
    cpfCnpj.value = "";
  } catch (err) {
    formError.value = err.displayMessage ?? "Não foi possível criar a cobrança.";
  } finally {
    busy.value = false;
  }
}

function askCancel() {
  confirmingCancel.value = true;
}

async function doCancel() {
  busy.value = true;

  try {
    await cancel();
    invoiceUrl.value = "";
    confirmingCancel.value = false;
  } catch (err) {
    formError.value = err.displayMessage ?? "Não foi possível cancelar.";
  } finally {
    busy.value = false;
  }
}
</script>

<style scoped>
.plans {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.plans__head {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.plans__title {
  font: var(--type-page-title);
  letter-spacing: var(--ls-heading);
}

.plans__subtitle {
  max-width: 60ch;
  font: var(--type-small);
  color: var(--text-secondary);
}

.plans__state {
  font: var(--type-small);
  color: var(--text-tertiary);
  text-align: center;
  padding: var(--space-6) 0;
}

.plans__state--error {
  color: var(--feedback-danger);
}

.plans__grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-4);
}

/* Duas colunas só quando cada card ainda tem largura para a lista respirar. */
@media (min-width: 720px) {
  .plans__grid {
    grid-template-columns: 1fr 1fr;
  }
}

.plans__card {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-6);
  background: var(--surface-raised);
  border: 1px solid var(--ink-100);
  border-radius: var(--radius-card);
}

/* A borda cobalt é o que diz qual dos dois é a oferta, sem precisar de selo. */
.plans__card--pro {
  border-color: var(--cobalt-500);
}

.plans__label {
  font: var(--type-label);
  letter-spacing: var(--ls-label);
  text-transform: uppercase;
  color: var(--text-tertiary);
}

.plans__label--pro {
  color: var(--cobalt-500);
}

.plans__price {
  font: var(--type-stat);
  color: var(--text-primary);
}

.plans__per {
  font: var(--type-small);
  color: var(--text-tertiary);
}

.plans__list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin-block-end: var(--space-2);
}

.plans__list li {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font: var(--type-body);
  color: var(--text-secondary);
}

.plans__list svg {
  color: var(--feedback-success);
  flex-shrink: 0;
}

.plans__form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-6);
  background: var(--surface-raised);
  border: 1px solid var(--ink-100);
  border-radius: var(--radius-card);
}

.plans__formTitle {
  font: var(--type-title);
}

.plans__link {
  color: var(--text-link);
  text-decoration: underline;
}
</style>
