<template>
  <Teleport to="body">
    <div
      v-if="transaction"
      class="ga-dialog-wrap"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="titleId"
      @click.self="emit('cancel')"
    >
      <div class="ga-dialog ga-dialog--danger deltx">
        <span class="ga-dialog__icon">
          <GaIcon name="trash-2" :size="20" />
        </span>

        <div>
          <h3 :id="titleId" class="ga-dialog__title">Confirmar exclusão</h3>
          <p class="ga-dialog__desc">
            <template v-if="isInstallment">
              <strong>{{ transaction.description }}</strong> é a parcela
              {{ transaction.installment.current }} de {{ transaction.installment.total }}. O que
              você quer excluir?
            </template>
            <template v-else>
              Deseja realmente excluir <strong>{{ transaction.description }}</strong
              >?
            </template>
          </p>
        </div>

        <!--
          BUG CORRIGIDO (C3): antes este diálogo perguntava apenas "Deseja
          realmente excluir esta transação?" — e o backend apagava TODAS as
          parcelas do grupo. O usuário perdia 12 lançamentos achando que
          apagava um. Agora a escolha é explícita e o padrão é a opção menos
          destrutiva.
        -->
        <fieldset v-if="isInstallment" class="deltx__scope">
          <label class="ga-check ga-radio deltx__option">
            <input v-model="scope" type="radio" value="single" />
            <span class="ga-check__box"></span>
            <span class="ga-check__text">
              <span class="deltx__optionLabel">Somente esta parcela</span>
              <span class="ga-check__desc">
                As outras {{ transaction.installment.total - 1 }} continuam registradas.
              </span>
            </span>
          </label>

          <label class="ga-check ga-radio deltx__option">
            <input v-model="scope" type="radio" value="group" />
            <span class="ga-check__box"></span>
            <span class="ga-check__text">
              <span class="deltx__optionLabel">A compra inteira</span>
              <span class="ga-check__desc">
                Exclui as {{ transaction.installment.total }} parcelas de uma vez.
              </span>
            </span>
          </label>
        </fieldset>

        <p v-if="error" class="deltx__error">{{ error }}</p>

        <div class="ga-dialog__actions">
          <GaButton variant="ghost" @click="emit('cancel')">Cancelar</GaButton>
          <GaButton variant="danger" :disabled="busy" @click="emit('confirm', scope)">
            {{ busy ? "Excluindo..." : "Excluir" }}
          </GaButton>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
/**
 * MIGRADO para o design system gestaoApp (ROADMAP 1.4).
 *
 * É o mesmo `Dialog` de tom `danger` do `ConfirmDialog.vue`, que explica a
 * escolha dos botões e do quadradinho vermelho. O que é só daqui:
 *
 * - Os dois rádios eram `<input type="radio">` nativo com `class="mt-1"`. O
 *   nativo não segue cor nem tamanho definidos em CSS e tem desenho diferente
 *   em cada sistema. Agora são o `.ga-check.ga-radio` da skill: o input fica
 *   escondido e o círculo é desenhado em CSS, com o cobalt de seleção e o anel
 *   de foco do sistema.
 * - O rótulo continua sendo o `<label>` INTEIRO, que é o que dá a área de
 *   toque: a linha toda tem mais de 44px de altura em 375px, bem acima do
 *   círculo de 18px do desenho.
 *
 * O padrão continua "somente esta parcela", a opção menos destrutiva, e
 * continua voltando a ela a cada abertura.
 */
import { ref, computed, watch, useId } from "vue";
import GaButton from "@/design-system/components/GaButton.vue";
import GaIcon from "@/design-system/components/GaIcon.vue";

const props = defineProps({
  /** A transação a excluir, ou null quando o diálogo está fechado. */
  transaction: { type: Object, default: null },
  busy: { type: Boolean, default: false },
  error: { type: String, default: "" },
});

const emit = defineEmits(["confirm", "cancel"]);

const titleId = useId();
const scope = ref("single");

const isInstallment = computed(() => (props.transaction?.installment?.total ?? 1) > 1);

// Volta sempre ao padrão conservador ao abrir para outra transação.
watch(
  () => props.transaction,
  () => {
    scope.value = "single";
  }
);
</script>

<style scoped>
/* O diálogo da parcela tem rádios e texto: 480px lê melhor que os 440 do
   `.ga-dialog`, e é a mesma largura do `.ga-modal--md`. */
.deltx {
	width: min(480px, 100%);
}

.deltx__scope {
	display: flex;
	flex-direction: column;
	gap: var(--space-2);
	margin: 0;
	padding: 0;
	border: 0;
}

/*
 * A área de toque é o `<label>` inteiro. Em 375px cada opção mede 56px de
 * altura com as duas linhas de texto — acima dos 44px da regra.
 */
.deltx__option {
	padding: var(--space-2) var(--space-2-5);
	border: 1px solid var(--border-subtle);
	border-radius: var(--radius-md);
	transition: border-color var(--dur-fast) var(--ease-out);
}
.deltx__option:hover {
	border-color: var(--border-default);
}
/* `:has` para marcar a opção escolhida: o fio fica cobalt, como no
   `.ga-task--selected` da skill. */
.deltx__option:has(input:checked) {
	border-color: var(--cobalt-300);
	background: var(--surface-selected);
}

.deltx__optionLabel {
	font-weight: var(--fw-medium);
	color: var(--text-primary);
}

.deltx__error {
	font: var(--type-small);
	color: var(--feedback-danger);
}
</style>
