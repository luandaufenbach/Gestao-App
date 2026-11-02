<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="ga-dialog-wrap"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="titleId"
      @click.self="emit('cancel')"
    >
      <div class="ga-dialog ga-dialog--danger">
        <span class="ga-dialog__icon">
          <GaIcon name="trash-2" :size="20" />
        </span>

        <div>
          <h3 :id="titleId" class="ga-dialog__title">{{ title }}</h3>
          <p class="ga-dialog__desc">
            <slot>{{ message }}</slot>
          </p>
        </div>

        <div class="ga-dialog__actions">
          <GaButton variant="ghost" @click="emit('cancel')">{{ cancelLabel }}</GaButton>
          <GaButton ref="confirmButton" variant="danger" :disabled="busy" @click="emit('confirm')">
            {{ busy ? "Aguarde..." : confirmLabel }}
          </GaButton>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
/**
 * Diálogo de confirmação reutilizável.
 *
 * MOTIVO (M2): este mesmo bloco estava copiado em quatro arquivos — Goals.vue,
 * Transactions.vue, TransactionsList.vue e CategoriesModal.vue — apesar de já
 * existir o composable useDeleteConfirmation, usado em apenas dois deles.
 *
 * De quebra, a versão duplicada não tinha nenhum tratamento de acessibilidade:
 * sem role/aria, sem foco inicial e sem fechar no Esc.
 *
 * ── MIGRADO para o design system gestaoApp (ROADMAP 1.4) ─────────────────
 *
 * Este é o `Dialog` da skill, ponto por ponto, e não uma casca nova: o
 * `.ga-dialog` com `tone="danger"` de `components/overlays/`. O que isso traz,
 * e por que cada peça está aqui:
 *
 * - O quadradinho vermelho com a lixeira é o `.ga-dialog--danger
 *   .ga-dialog__icon`. É ele que carrega o peso de "isto não volta atrás".
 * - Os botões seguem o `Dialog.prompt.md` ao pé da letra: `ghost` no cancelar
 *   e `danger` no confirmar. O `danger` do sistema é VAZADO — fio vermelho
 *   sobre branco —, então o botão destrutivo ficou menos chamativo que o
 *   `bg-red-600` de antes, não mais. A gravidade passou para o ícone, o título
 *   e o texto, que é onde a skill a coloca.
 *
 * O `z-index` do `.ga-dialog-wrap` fica acima do dos modais, porque este
 * diálogo abre por cima do modal de categorias (ver overlays.css).
 *
 * O comportamento é o mesmo de antes: Esc cancela, o foco vai para o botão de
 * confirmar ao abrir, clicar fora cancela.
 */
import { ref, watch, nextTick, useId } from "vue";
import GaButton from "@/design-system/components/GaButton.vue";
import GaIcon from "@/design-system/components/GaIcon.vue";

const props = defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, default: "Confirmar exclusão" },
  message: { type: String, default: "Esta ação não pode ser desfeita." },
  confirmLabel: { type: String, default: "Excluir" },
  cancelLabel: { type: String, default: "Cancelar" },
  busy: { type: Boolean, default: false },
});

const emit = defineEmits(["confirm", "cancel"]);

const titleId = useId();
const confirmButton = ref(null);

function onKeydown(event) {
  if (event.key === "Escape") emit("cancel");
}

watch(
  () => props.open,
  async (isOpen) => {
    if (isOpen) {
      window.addEventListener("keydown", onKeydown);
      await nextTick();
      /**
       * `$el`, e não o próprio ref: `confirmButton` agora aponta para a
       * INSTÂNCIA do GaButton, não para o `<button>` do DOM, e instância de
       * componente não tem `.focus()`. `$el` é o elemento raiz dela, que é o
       * botão.
       */
      confirmButton.value?.$el?.focus();
    } else {
      window.removeEventListener("keydown", onKeydown);
    }
  }
);
</script>
