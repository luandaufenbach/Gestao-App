<script setup>
/**
 * Casca dos modais de formulário (ROADMAP 1.4).
 *
 * Centrada no desktop, folha que sobe a partir da borda de baixo no celular —
 * o que o readme da skill pede abaixo de 768px. O CSS e o raciocínio da
 * composição estão em `./overlays.css`.
 *
 * APENAS APARÊNCIA, de propósito. O componente não adiciona fechar no Esc, nem
 * armadilha de foco, nem travamento da rolagem do fundo: nenhum dos cinco
 * modais tem isso hoje, e a etapa 1.4 é visual. O único comportamento que ele
 * carrega é o que já existia em todos eles — clicar fora fecha, pelo mesmo
 * `@click.self` de antes.
 *
 * O que ele ARRUMA sem mudar comportamento é o `aria-labelledby`: cada modal
 * repetia um id escrito à mão (`new-transaction-title`, `pay-invoice-title`…)
 * e dois modais abertos ao mesmo tempo podiam colidir. Agora o id vem do
 * `useId`.
 */
import { useId } from "vue";
import GaIcon from "./GaIcon.vue";

defineProps({
  title: { type: String, required: true },
  /** Linha miúda embaixo do título (datas da fatura, por exemplo). */
  subtitle: { type: String, default: "" },
  /** Largura máxima no desktop: 420 / 480 / 580 / 680. */
  size: {
    type: String,
    default: "lg",
    validator: (value) => ["sm", "md", "lg", "xl"].includes(value),
  },
});

const emit = defineEmits(["close"]);

const titleId = useId();
</script>

<template>
  <div
    class="ga-modal-wrap"
    role="dialog"
    aria-modal="true"
    :aria-labelledby="titleId"
    @click.self="emit('close')"
  >
    <div class="ga-modal" :class="`ga-modal--${size}`">
      <div class="ga-modal__head">
        <div class="ga-modal__titles">
          <h2 :id="titleId" class="ga-modal__title">{{ title }}</h2>
          <p v-if="subtitle" class="ga-modal__subtitle">{{ subtitle }}</p>
        </div>

        <button type="button" aria-label="Fechar" class="ga-modal__close" @click="emit('close')">
          <GaIcon name="x" :size="18" />
        </button>
      </div>

      <div class="ga-modal__body">
        <slot />
      </div>

      <div v-if="$slots.footer" class="ga-modal__foot">
        <slot name="footer" />
      </div>
    </div>
  </div>
</template>
