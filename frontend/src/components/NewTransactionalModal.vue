<template>
  <GaModal title="Nova transação" size="lg" @close="closeModal">
    <form id="new-transaction-form" class="newtx__form" @submit.prevent="saveTransaction">
      <TransactionFormFields ref="campos" :form="form" :categories="categories" />

      <p v-if="form.errorMessage.value" class="newtx__error">
        {{ form.errorMessage.value }}
      </p>
    </form>

    <template #footer>
      <GaButton variant="secondary" @click="closeModal">Cancelar</GaButton>
      <!-- Rótulo trocado e botão desabilitado: o estado de carregamento que o
           app já usava. A skill não define nenhum. -->
      <GaButton type="submit" form="new-transaction-form" variant="primary" :disabled="saving">
        {{ saving ? "Salvando..." : "Salvar" }}
      </GaButton>
    </template>
  </GaModal>
</template>

<script setup>
/**
 * MIGRADO para o design system gestaoApp (ROADMAP 1.4).
 *
 * A casca virou `GaModal`: centrada no desktop, folha que sobe no celular — o
 * que a skill pede abaixo de 768px. O `backdrop-blur-[1px]` do fundo saiu, por
 * regra explícita do readme ("desfoque só sobre imagem de marca, nunca no
 * chrome do produto"), e o "×" de texto virou o ícone Lucide `x`.
 *
 * O botão "Salvar" era `bg-lime-400`; ação é cobalt. O "Cancelar" era
 * `bg-slate-100` e virou a variante `secondary`, que é a ação ao lado da
 * principal no sistema.
 *
 * O `form` fica no corpo rolável e os botões no rodapé fixo. O atributo
 * `form="new-transaction-form"` no botão é o que mantém o envio funcionando
 * com os dois em caixas separadas — sem ele, um `type="submit"` fora do
 * `<form>` não envia nada.
 */
import { ref, onMounted, useTemplateRef } from "vue";
import GaButton from "@/design-system/components/GaButton.vue";
import GaModal from "@/design-system/components/GaModal.vue";
import { useTransactions } from "../services/useTransactions";
import { useCategories } from "../stores/categories";
import { useTransactionForm } from "../services/useTransactionForm";
import { todayISO } from "../services/useMonthNavigation";
import TransactionFormFields from "./TransactionFormFields.vue";

const props = defineProps({
  year: Number,
  month: Number,
});

const emit = defineEmits(["close", "transaction-created"]);

const { createNew } = useTransactions();
// Store singleton: a lista é a mesma que a tela por trás do modal enxerga,
// então criar uma categoria lá reflete aqui na hora (bug A6).
const { categories, load: loadCategories } = useCategories();

const form = useTransactionForm();
const saving = ref(false);
const campos = useTemplateRef("campos");

const pad = (num) => String(num).padStart(2, "0");

/**
 * A data que já vem preenchida.
 *
 * Antes era SEMPRE o dia 1º do mês visualizado. No dashboard — que é a tela
 * padrão e passa o mês — quem abria o modal no dia 17 para registrar um café
 * recebia 01/11 e precisava corrigir. Quem não percebesse gravava o gasto
 * dezesseis dias no passado, possivelmente em outra fatura.
 *
 * Agora: mês corrente sugere HOJE, que é o caso de quase todo lançamento.
 * Outro mês continua sugerindo o dia 1º, que é o palpite certo para quem está
 * revisando um mês passado.
 *
 * A comparação usa o calendário local nos dois lados. Na virada do mês o
 * dashboard pode estar em UTC um dia à frente; aí os meses não batem, cai no
 * dia 1º do mês visto e continua coerente com o que está na tela.
 */
function dataSugerida() {
  const hoje = todayISO();

  if (!props.year || !props.month) return hoje;

  const [anoHoje, mesHoje] = hoje.split("-");
  const mesmoMes = Number(anoHoje) === props.year && Number(mesHoje) === props.month;

  return mesmoMes ? hoje : `${props.year}-${pad(props.month)}-01`;
}

onMounted(() => {
  loadCategories();

  /**
   * Sugere o dia 1º do mês que está sendo visualizado.
   *
   * A versão anterior fazia isso com um watch + computed que rodava a cada
   * mudança de props, apenas para preencher um valor inicial. Como o modal é
   * criado e destruído a cada abertura (v-if), definir no onMounted basta.
   */
  form.date.value = dataSugerida();

  /**
   * O valor recebe o foco: é o único campo que todo lançamento digita, e no
   * celular isso já abre o teclado numérico — uma tocada a menos no caminho
   * mais usado do app. Só aqui, não na edição, onde o cursor no valor seria
   * um convite a mexer no que não se queria mexer.
   */
  campos.value?.focusAmount();
});

async function saveTransaction() {
  if (!form.validate()) return;

  saving.value = true;

  try {
    await createNew(form.getCreatePayload());

    /**
     * Antes era necessário inspecionar a resposta em busca de um campo
     * `message` para descobrir se tinha dado erro, porque api.js não checava
     * o status HTTP (bug A1). Agora uma falha simplesmente lança.
     */
    emit("transaction-created");
    form.reset();
    closeModal();
  } catch (error) {
    form.errorMessage.value = error.displayMessage ?? "Erro ao salvar transação.";
  } finally {
    saving.value = false;
  }
}

function closeModal() {
  emit("close");
}
</script>

<style scoped>
.newtx__form {
	display: grid;
	grid-template-columns: 1fr;
	gap: var(--space-4);
}
@media (min-width: 640px) {
	.newtx__form {
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}
}

.newtx__error {
	font: var(--type-small);
	color: var(--feedback-danger);
}
@media (min-width: 640px) {
	.newtx__error {
		grid-column: 1 / -1;
	}
}
</style>
