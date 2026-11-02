<template>
  <GaField v-slot="{ id }" label="Tipo" select>
    <select :id="id" v-model="type">
      <option value="debit">Débito</option>
      <option value="credit">Crédito</option>
      <option value="income">Adicionar saldo</option>
      <option value="savings">Guardar valor</option>
      <option value="withdrawal">Resgatar guardado</option>
    </select>
  </GaField>

  <GaField v-slot="{ id }" label="Data" variant="date">
    <input :id="id" v-model="date" type="date" required />
  </GaField>

  <GaField
    v-if="requiresCategory"
    v-slot="{ id }"
    label="Categoria"
    select
    :hint="categoryHint"
    :tone="categoryHint ? 'warning' : 'default'"
  >
    <select :id="id" v-model="categoryId">
      <option value="">Selecione uma categoria</option>
      <option v-for="category in categories" :key="category._id" :value="category._id">
        {{ category.name }}
      </option>
    </select>
  </GaField>

  <!--
    BUG CORRIGIDO: este campo não existia.

    O payload já mandava `bankCard`, mas nenhuma tela o preenchia, então toda
    compra no crédito era salva sem cartão. Como a fatura é montada filtrando
    pelo cartão, as compras simplesmente não apareciam nela — sem erro, sem
    aviso, só um card de Faturas vazio.
  -->
  <GaField
    v-if="requiresBankCard"
    v-slot="{ id }"
    label="Cartão"
    select
    :hint="cardHint"
    :tone="cardHint ? 'warning' : 'default'"
  >
    <select :id="id" v-model="bankCardId">
      <option value="">Selecione o cartão</option>
      <option v-for="card in creditCards" :key="card._id" :value="card._id">
        {{ card.starred ? "★ " : "" }}{{ card.bank || card.name }}
        <template v-if="card.lastFourDigits">· {{ card.lastFourDigits }}</template>
      </option>
    </select>
  </GaField>

  <!--
    Meta de destino da reserva. Opcional de propósito: o vínculo diz para onde
    o dinheiro foi, mas guardar sem objetivo continua sendo guardar — e o total
    da reserva é o mesmo com ou sem meta.
  -->
  <GaField
    v-if="supportsGoal"
    v-slot="{ id }"
    label="Meta"
    select
    :hint="goalHint"
  >
    <select :id="id" v-model="goalId">
      <option value="">{{ noGoalLabel }}</option>
      <option v-for="goal in goals" :key="goal._id" :value="goal._id">
        {{ goal.name }}
      </option>
    </select>
  </GaField>

  <GaField
    v-if="supportsInstallments"
    v-slot="{ id }"
    label="Parcelas"
    variant="number"
    :disabled="lockInstallments"
    :hint="lockInstallments ? 'O número de parcelas não pode ser alterado após a criação.' : ''"
  >
    <input
      :id="id"
      v-model.number="installments"
      type="number"
      min="1"
      :max="MAX_INSTALLMENTS"
      :disabled="lockInstallments"
    />
  </GaField>

  <GaField
    v-slot="{ id }"
    :label="isInstallmentPurchase ? 'Valor total da compra' : 'Valor'"
    variant="number"
    :hint="installmentHint"
  >
    <input :id="id" v-model="amount" type="number" step="0.01" min="0" />
  </GaField>

  <GaField v-slot="{ id }" class="fields__wide" label="Descrição" variant="area">
    <textarea
      :id="id"
      v-model="description"
      rows="2"
      maxlength="200"
      placeholder="Ex: Mercado da semana"
    ></textarea>
  </GaField>
</template>

<script setup>
/**
 * Campos compartilhados entre o modal de criação e o de edição.
 *
 * MOTIVO: os dois modais tinham o mesmo formulário copiado linha a linha —
 * cerca de 60 linhas de template idênticas. Qualquer campo novo precisava ser
 * adicionado nos dois, e eles já haviam divergido (o de edição tinha perdido a
 * classe cursor-pointer no select de categoria).
 *
 * O rótulo do valor muda conforme o contexto: em compra parcelada fica
 * explícito que se trata do VALOR TOTAL — o ponto exato onde nascia o bug C1.
 *
 * ── MIGRADO para o design system gestaoApp (ROADMAP 1.4) ─────────────────
 *
 * Os oito campos eram `<label>` + controle com `rounded-xl border-slate-200
 * focus:ring-lime-300` repetido em cada um. Agora cada campo é um `GaField`:
 * o rótulo, a caixa, o foco cobalt e a dica vêm do sistema, e o que sobra em
 * cada bloco é só o controle e o que ele tem de próprio.
 *
 * As três dicas em `text-amber-600` ("nenhuma categoria cadastrada", "nenhum
 * cartão cadastrado") viraram `tone="warning"`: laranja é o sinal de atenção
 * do sistema, então continuam laranja — o que muda é que a cor agora vem de
 * `--feedback-warning` e não de um degrau solto do Tailwind. A dica de meta
 * ("o valor vai para a reserva geral") fica neutra, como era: ela não é aviso,
 * é explicação do que vai acontecer.
 *
 * As duas dicas que já eram neutras — parcelas travadas e prévia do valor da
 * parcela — continuam neutras.
 */
import { computed, onMounted, watch } from "vue";
import GaField from "@/design-system/components/GaField.vue";
import { useFormatters } from "../services/useFormatters";
import { useGoals } from "../services/useGoals";
import { useBankCards } from "../stores/bankCards";

const props = defineProps({
  /** O objeto retornado por useTransactionForm(). */
  form: { type: Object, required: true },
  categories: { type: Array, default: () => [] },
  /** Na edição, o número de parcelas é somente leitura (ver bug M8). */
  lockInstallments: { type: Boolean, default: false },
});

/**
 * As refs são desestruturadas aqui, no setup, e não acessadas como
 * `form.type` no template: o Vue só desempacota refs automaticamente quando
 * elas são bindings de nível superior do setup. Uma ref aninhada dentro de um
 * objeto chegaria ao v-model como o objeto Ref, não como o valor.
 */
const {
  type,
  description,
  amount,
  date,
  categoryId,
  bankCardId,
  goalId,
  installments,
  MAX_INSTALLMENTS,
} = props.form;

const requiresCategory = props.form.requiresCategory;
const requiresBankCard = props.form.requiresBankCard;
const supportsGoal = props.form.supportsGoal;
const supportsInstallments = props.form.supportsInstallments;

const { creditCards, load: loadCards } = useBankCards();

onMounted(loadCards);

/**
 * Pré-seleciona o cartão quando a escolha é previsível: o favorito, ou o único
 * cartão de crédito. Com vários e nenhum favorito o campo fica em branco —
 * chutar o primeiro lançaria compras no cartão errado sem ninguém perceber.
 *
 * Só age com o campo vazio, então nunca sobrescreve o cartão de uma transação
 * aberta para edição.
 */
watch(
  [requiresBankCard, creditCards],
  () => {
    if (!requiresBankCard.value || bankCardId.value) return;

    const favorite = creditCards.value.find((card) => card.starred);
    const suggestion = favorite ?? (creditCards.value.length === 1 ? creditCards.value[0] : null);

    if (suggestion) {
      bankCardId.value = suggestion._id;
    }
  },
  { immediate: true }
);

/**
 * As metas são buscadas só quando o tipo escolhido aceita uma — quem lança um
 * débito não paga por um GET que o formulário não vai usar. A flag evita
 * repetir a busca a cada ida e volta entre "guardar" e "débito".
 */
const { goals, loadGoals } = useGoals();
let goalsRequested = false;

watch(
  supportsGoal,
  (needed) => {
    if (!needed || goalsRequested) return;
    goalsRequested = true;
    loadGoals();
  },
  { immediate: true }
);

/** No resgate a opção vazia significa a origem, não o destino. */
const noGoalLabel = computed(() =>
  type.value === "withdrawal" ? "Da reserva geral" : "Sem meta — só guardar"
);

const { formatCurrency, parseCurrencyToCents } = useFormatters();

const isInstallmentPurchase = computed(
  () => supportsInstallments.value && Number(installments.value) > 1
);

/** Prévia do valor de cada parcela, para o usuário conferir antes de salvar. */
const perInstallment = computed(() => {
  const totalCents = parseCurrencyToCents(amount.value);
  const count = Number(installments.value);

  if (totalCents === null || !count || count < 1) return "";

  return formatCurrency(Math.floor(totalCents / count));
});

/*
 * As dicas ficam aqui, e não dentro do atributo: três delas têm aspas no meio
 * do texto, e aspas dentro de atributo exigem escape que o Prettier reformata
 * de um jeito diferente a cada passada. Texto longo em expressão de template
 * também não é legível.
 */

/** Vazia quando há categoria; preenchida, o campo fica em tom de atenção. */
const categoryHint = computed(() =>
  props.categories.length ? "" : "Nenhuma categoria cadastrada. Crie uma na tela de Transações."
);

const cardHint = computed(() =>
  creditCards.value.length
    ? ""
    : 'Nenhum cartão de crédito cadastrado. Adicione um no Dashboard, em "Meus cartões".'
);

/** Neutra: não é aviso, é o que vai acontecer com o valor. */
const goalHint = computed(() =>
  goals.value.length ? "" : "Nenhuma meta cadastrada. O valor vai para a reserva geral."
);

const installmentHint = computed(() =>
  isInstallmentPurchase.value && perInstallment.value
    ? `${installments.value}x de aproximadamente ${perInstallment.value}`
    : ""
);
</script>

<style scoped>
/*
 * A descrição ocupa a linha inteira da grade do formulário. A grade é do
 * `<form>` do modal que usa estes campos; o `grid-column` é propriedade do
 * ITEM, então mora aqui, junto do campo que ele afeta.
 */
@media (min-width: 640px) {
	.fields__wide {
		grid-column: 1 / -1;
	}
}
</style>
