<template>
  <li
    class="flex items-center justify-between gap-3 rounded-xl border border-slate-100 px-3 py-2.5 hover:bg-slate-50 transition-colors"
  >
    <div class="flex items-center gap-3 min-w-0">
      <div
        class="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
        :class="style.bg"
        :title="formatType(transaction.type)"
      >
        <component :is="style.icon" v-if="style.icon" class="w-4 h-4" aria-hidden="true" />
      </div>
      <div class="min-w-0">
        <p class="font-medium text-slate-800 text-sm truncate">{{ transaction.description }}</p>
        <p class="text-xs text-slate-400 truncate">
          {{ formatDate(transaction.date) }} · {{ formatSource(transaction) }}
          <template v-if="showType"> · {{ formatType(transaction.type) }}</template>
          <span v-if="transaction.installment?.total > 1" class="ml-1 text-blue-600 font-semibold">
            {{ transaction.installment.current }}/{{ transaction.installment.total }}
          </span>
        </p>
      </div>
    </div>

    <div class="flex items-center gap-2 shrink-0">
      <span class="font-semibold text-sm" :class="amountColor(transaction.type)">
        {{ amountSign(transaction.type) }} {{ formatCurrency(transaction.valueInCents) }}
      </span>

      <!--
        Botões "fantasma" de 32px: o ícone continua discreto, mas a área de
        clique deixa de ser os 16px do próprio desenho — que no celular exigia
        mira. O fundo no hover mostra qual dos dois vai ser acionado.
      -->
      <div class="flex items-center">
        <button
          type="button"
          aria-label="Editar transação"
          title="Editar"
          class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
          @click="emit('edit', transaction)"
        >
          <PencilSquareIcon class="h-4 w-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          aria-label="Excluir transação"
          title="Excluir"
          class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
          @click="emit('delete', transaction)"
        >
          <TrashIcon class="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  </li>
</template>

<script setup>
/**
 * Uma linha de transação, do jeito que o dashboard desenha.
 *
 * MOTIVO: a marcação da linha existia duas vezes — no card do dashboard e na
 * página de Transações — e as duas cópias já tinham divergido de escala. A
 * página usava text-xl na descrição e text-3xl no valor, contra text-sm em
 * ambos no dashboard, o que fazia as duas telas parecerem de aplicativos
 * diferentes. Com um componente só, elas não têm como divergir de novo.
 */
import { computed } from "vue";
import {
  ArchiveBoxArrowDownIcon,
  ArrowDownIcon,
  ArrowUpIcon,
  ArrowUturnLeftIcon,
  CreditCardIcon,
  DocumentCheckIcon,
} from "@heroicons/vue/20/solid";
import { PencilSquareIcon, TrashIcon } from "@heroicons/vue/24/outline";
import { useFormatters } from "../services/useFormatters";

const props = defineProps({
  transaction: { type: Object, required: true },
  /**
   * Mostra o tipo na legenda. Ligado na página de Transações, onde a lista
   * mistura todos os tipos; desligado no dashboard, onde o ícone já basta e o
   * espaço é curto.
   */
  showType: { type: Boolean, default: false },
});

const emit = defineEmits(["edit", "delete"]);

const { formatCurrency, formatDate, formatSource, formatType, amountColor, amountSign } =
  useFormatters();

/**
 * Um ícone por tipo, todos do mesmo conjunto (Heroicons, 20px sólido).
 *
 * Antes eram emojis (💳 🏦 🧾) misturados com setas de texto (↑ ↓ ↩). Emoji
 * muda de desenho em cada sistema operacional e não segue a cor definida no
 * CSS; misturado com caracteres de texto, dava à lista cara de protótipo.
 * A lógica de cor foi mantida: verde entra, vermelho sai.
 */
const TYPE_STYLES = {
  income: { icon: ArrowUpIcon, bg: "bg-emerald-50 text-emerald-600" },
  debit: { icon: ArrowDownIcon, bg: "bg-red-50 text-red-600" },
  credit: { icon: CreditCardIcon, bg: "bg-amber-50 text-amber-600" },
  savings: { icon: ArchiveBoxArrowDownIcon, bg: "bg-blue-50 text-blue-600" },
  // O caminho de volta da reserva para a conta.
  withdrawal: { icon: ArrowUturnLeftIcon, bg: "bg-sky-50 text-sky-600" },
  invoice_payment: { icon: DocumentCheckIcon, bg: "bg-amber-50 text-amber-700" },
};

const style = computed(
  () => TYPE_STYLES[props.transaction.type] ?? { icon: null, bg: "bg-slate-100 text-slate-500" }
);
</script>
