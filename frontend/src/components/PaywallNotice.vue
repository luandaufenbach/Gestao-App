<template>
  <section class="paywall">
    <span class="paywall__icon">
      <GaIcon name="lock" :size="20" />
    </span>

    <h2 class="paywall__title">{{ title }}</h2>

    <p class="paywall__text">{{ message }}</p>

    <GaButton variant="primary" @click="router.push('/plans')">
      {{ priceLabel ? `Assinar a partir de ${priceLabel} por mês` : "Ver o plano" }}
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
import { trackEvent } from "../services/analytics";

const props = defineProps({
  title: { type: String, default: "Recurso do plano Pro" },
  /** A recusa vinda do backend, que já explica o que continua liberado. */
  message: { type: String, required: true },
  /**
   * Qual recurso foi recusado, para o funil. É um rótulo nosso, curto e sem
   * dado nenhum da pessoa — serve para saber QUAL porta fechada leva mais
   * gente a assinar, que é o que decide onde vale apertar o paywall.
   */
  feature: { type: String, default: "desconhecido" },
});

const router = useRouter();
const { formatCurrency } = useFormatters();
const { catalog, load } = useSubscription();

// O preço vem do backend para não existir em dois lugares: um número escrito
// aqui envelheceria calado no dia em que o plano mudasse de valor.
onMounted(() => {
  load().catch(() => {});

  /**
   * O passo do funil que faltava.
   *
   * Cadastro e primeira transação já eram medidos, mas não o momento em que
   * alguém QUER o recurso pago. Sem ele não dá para saber se a conversão
   * falha por falta de desejo ou por causa do preço — e são problemas opostos.
   */
  trackEvent("paywall_visto", { recurso: props.feature });
});

/**
 * O menor preço mensal equivalente do catálogo.
 *
 * Com dois ciclos, citar um valor só ficou ambíguo: "R$ 179" assusta sem o
 * contexto do ano, e "R$ 24,90" esconde que existe opção mais barata. O ciclo
 * longo dito em mensalidade é o número honesto mais atraente — e sai da
 * aritmética dos preços do backend, não de texto escrito aqui.
 */
const priceLabel = computed(() => {
  const mensais = catalog.value.map((plano) =>
    plano.cycle === "YEARLY" ? Math.round(plano.priceInCents / 12) : plano.priceInCents
  );

  return mensais.length ? formatCurrency(Math.min(...mensais)) : "";
});
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

</style>
