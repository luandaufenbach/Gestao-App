<template>
  <section class="paywall">
    <span class="paywall__icon">
      <GaIcon name="lock" :size="20" />
    </span>

    <h2 class="paywall__title">{{ title }}</h2>

    <p class="paywall__text">{{ message }}</p>

    <p class="paywall__kept">
      Seus lançamentos, categorias, cartões e metas continuam liberados, e nada do que você já
      registrou deixa de aparecer.
    </p>

    <GaButton variant="primary" @click="router.push('/plans')">
      {{ priceLabel ? `Assinar por ${priceLabel} por mês` : "Ver o plano" }}
    </GaButton>
  </section>
</template>

<script setup>
/**
 * Recurso do plano pago (ROADMAP 2.3).
 *
 * MOTIVO DE EXISTIR: sem isto, ligar `PAYWALL_ENABLED` transformava Projeção e
 * Relatórios numa linha de erro vermelha sem saída — o 402 caía no mesmo lugar
 * que "falha ao carregar", e quem quisesse pagar não tinha para onde clicar.
 *
 * Mostra o que está liberado, e não só o que está bloqueado: a recusa ganha o
 * mesmo tom da mensagem do backend, que faz questão de dizer que o histórico
 * continua acessível. Paywall que parece perda de dados gera cancelamento, não
 * conversão.
 */
import { computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import GaIcon from "@/design-system/components/GaIcon.vue";
import GaButton from "@/design-system/components/GaButton.vue";
import { useSubscription } from "../stores/subscription";
import { useFormatters } from "../services/useFormatters";

defineProps({
  title: { type: String, default: "Recurso do plano Pro" },
  /** A recusa vinda do backend, que já explica o que continua liberado. */
  message: { type: String, required: true },
});

const router = useRouter();
const { formatCurrency } = useFormatters();
const { catalog, load } = useSubscription();

// O preço vem do backend para não existir em dois lugares: um número escrito
// aqui envelheceria calado no dia em que o plano mudasse de valor.
onMounted(() => load().catch(() => {}));

const priceLabel = computed(() =>
  catalog.value?.priceInCents ? formatCurrency(catalog.value.priceInCents) : ""
);
</script>

<style scoped>
.paywall {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-8) var(--space-6);
  text-align: center;
  background: var(--surface-raised);
  border: 1px solid var(--ink-100);
  border-radius: var(--radius-lg);
}

.paywall__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: var(--radius-pill);
  background: var(--cobalt-50);
  color: var(--cobalt-500);
}

.paywall__title {
  font: var(--type-title);
  color: var(--text-primary);
}

.paywall__text {
  max-width: 46ch;
  font: var(--type-body);
  color: var(--text-secondary);
}

.paywall__kept {
  max-width: 46ch;
  font: var(--type-small);
  color: var(--text-tertiary);
}
</style>
