<template>
  <div class="min-h-screen bg-slate-50">
    <Navbar />

    <main class="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      <AppTabs />

      <div>
        <h2 class="text-xl font-semibold text-slate-800">Projeção de caixa</h2>
        <p class="text-sm text-slate-500 mt-0.5">
          O que já está comprometido daqui para a frente, começando pelo mês atual.
        </p>
      </div>

      <p v-if="loading" class="text-slate-400 text-sm text-center py-10">Carregando...</p>

      <p v-else-if="error" class="text-red-600 text-sm text-center py-10">{{ error }}</p>

      <template v-else>
        <!--
          Mesmo ritmo dos cards do dashboard: rótulo pequeno em maiúsculas, o
          número em destaque, detalhes miúdos embaixo.
        -->
        <section
          class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col gap-3"
        >
          <div class="flex items-center justify-between gap-3">
            <span class="text-xs font-semibold uppercase tracking-widest text-slate-400">
              A sair nos próximos {{ months }} meses
            </span>
            <CalendarDaysIcon class="h-5 w-5 shrink-0 text-slate-300" aria-hidden="true" />
          </div>

          <p class="text-2xl font-bold text-slate-900">
            {{ formatCurrency(totalCommittedInCents) }}
          </p>

          <dl class="space-y-0.5 text-xs">
            <div class="flex justify-between text-slate-500">
              <dt>Faturas de cartão</dt>
              <dd class="font-medium">{{ formatCurrency(totalInvoicesInCents) }}</dd>
            </div>
            <div class="flex justify-between text-slate-500">
              <dt>Débitos agendados</dt>
              <dd class="font-medium">{{ formatCurrency(totalDebitsInCents) }}</dd>
            </div>
          </dl>

          <!--
            O aviso é a parte mais importante da tela.
            Sem ele o número grande é lido como saldo ou como gasto do mês, e
            aí a projeção passa a informar o contrário do que calcula.
          -->
          <div class="flex gap-2.5 rounded-xl border border-amber-100 bg-amber-50 p-3">
            <InformationCircleIcon class="h-5 w-5 shrink-0 text-amber-600" aria-hidden="true" />
            <p class="text-xs text-amber-900 leading-relaxed">
              Isto é dinheiro que <strong class="font-semibold">ainda vai sair</strong>: faturas em
              aberto e lançamentos no débito já marcados para o futuro. Não é o seu saldo, e não é o
              que você já gastou.
            </p>
          </div>
        </section>

        <!--
          Estado vazio honesto. A série vem completa e zerada quando não há
          compromisso nenhum, então desenhar as barras daria seis retângulos
          vazios — um gráfico dizendo "zero" sem explicar nada.
        -->
        <section
          v-if="isEmpty"
          class="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 text-center"
        >
          <p class="text-slate-700 font-medium">Nada comprometido nos próximos meses.</p>
          <p class="text-sm text-slate-400 mt-2 max-w-md mx-auto">
            Você não tem fatura em aberto nem lançamento no débito com data futura. Compras
            parceladas e faturas aparecem aqui no mês em que vencem.
          </p>
        </section>

        <ul v-else class="space-y-3">
          <li
            v-for="entry in series"
            :key="entry.month"
            class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
          >
            <!--
              A linha inteira é o botão: px-4 py-3 dá área de clique bem acima
              dos 32px, inclusive em volta da seta.
            -->
            <button
              type="button"
              class="w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors cursor-pointer"
              :aria-expanded="isOpen(entry)"
              @click="toggle(entry)"
            >
              <div class="flex items-baseline justify-between gap-3">
                <!--
                  `first-letter:uppercase` em vez de `capitalize`: a classe do
                  Tailwind maiusculiza CADA palavra e "novembro de 2026"
                  viraria "Novembro De 2026".
                -->
                <span class="text-sm font-semibold text-slate-800 truncate first-letter:uppercase">
                  {{ entry.label }}
                  <span
                    v-if="entry.month === currentMonth"
                    class="text-xs font-normal text-slate-400"
                  >
                    (mês atual)
                  </span>
                </span>

                <span class="flex shrink-0 items-center gap-1.5">
                  <span
                    class="text-base font-bold"
                    :class="entry.committedInCents > 0 ? 'text-slate-900' : 'text-slate-300'"
                  >
                    {{ formatCurrency(entry.committedInCents) }}
                  </span>
                  <ChevronDownIcon
                    class="h-4 w-4 text-slate-400 transition-transform"
                    :class="{ 'rotate-180': isOpen(entry) }"
                    aria-hidden="true"
                  />
                </span>
              </div>

              <!-- Barra de proporção: a régua é o mês mais pesado da janela. -->
              <div class="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  class="h-full rounded-full transition-all"
                  :class="isPeak(entry) ? 'bg-amber-500' : 'bg-amber-300'"
                  :style="{ width: barPercent(entry) + '%' }"
                ></div>
              </div>

              <p class="mt-1.5 text-xs text-slate-400">{{ summaryLine(entry) }}</p>
            </button>

            <div v-if="isOpen(entry)" class="border-t border-slate-100 px-4 py-4 space-y-5">
              <section v-if="entry.cards.length">
                <h3
                  class="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-slate-400"
                >
                  <CreditCardIcon class="h-4 w-4" aria-hidden="true" />
                  Faturas por cartão
                </h3>

                <ul class="space-y-2.5">
                  <li
                    v-for="card in entry.cards"
                    :key="card.cardId"
                    class="flex items-start justify-between gap-3"
                  >
                    <div class="flex min-w-0 items-start gap-2">
                      <span
                        class="mt-1 h-3 w-3 shrink-0 rounded-full"
                        :style="{ backgroundColor: card.color || '#1e293b' }"
                      ></span>
                      <div class="min-w-0">
                        <p class="truncate text-sm text-slate-800">
                          {{ card.name }}
                          <span v-if="card.lastFourDigits" class="text-xs text-slate-400">
                            ····{{ card.lastFourDigits }}
                          </span>
                        </p>
                        <p class="text-xs text-slate-400">
                          vence {{ formatDate(card.dueDate) }}
                          <template v-if="card.installmentCount > 0">
                            · {{ installmentsLabel(card.installmentCount) }}
                          </template>
                        </p>
                      </div>
                    </div>

                    <div class="shrink-0 text-right">
                      <p
                        class="text-sm font-semibold"
                        :class="card.committedInCents > 0 ? 'text-slate-900' : 'text-slate-300'"
                      >
                        {{ formatCurrency(card.committedInCents) }}
                      </p>
                      <!--
                        Fatura quitada chega com committedInCents zero. Ela fica
                        na lista com o selo: some da projeção sem explicação, o
                        usuário procura a fatura que sabe que existe.
                      -->
                      <p
                        v-if="card.committedInCents === 0"
                        class="text-[10px] font-bold uppercase tracking-wide text-emerald-700"
                      >
                        paga
                      </p>
                      <p v-else-if="card.paidInCents > 0" class="text-xs text-slate-400">
                        de {{ formatCurrency(card.totalInCents) }}
                      </p>
                    </div>
                  </li>
                </ul>
              </section>

              <section v-if="entry.debitsInCents > 0">
                <h3
                  class="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-slate-400"
                >
                  <BanknotesIcon class="h-4 w-4" aria-hidden="true" />
                  Débitos agendados
                </h3>
                <div class="flex items-start justify-between gap-3">
                  <!--
                    Texto curto de propósito: em 375px a versão longa ocupava
                    três linhas e empurrava o valor para o canto.
                  -->
                  <p class="text-sm text-slate-600">
                    No débito, com data neste mês e ainda por sair.
                  </p>
                  <p class="shrink-0 text-sm font-semibold text-slate-900">
                    {{ formatCurrency(entry.debitsInCents) }}
                  </p>
                </div>
              </section>

              <p
                v-if="!entry.cards.length && entry.debitsInCents === 0"
                class="text-sm text-slate-400"
              >
                Nada comprometido neste mês.
              </p>
            </div>
          </li>
        </ul>
      </template>
    </main>
  </div>
</template>

<script setup>
/**
 * Projeção de caixa (ROADMAP 1.1).
 *
 * Tela própria, e não um card no dashboard, por um motivo concreto: o
 * dashboard inteiro é governado pela navegação de mês, e esta série NÃO é —
 * ela começa sempre no mês corrente, pois `GET /dashboard/projection` não
 * aceita year/month. Um card que ignorasse as setas de mês ao lado de cinco
 * que as obedecem pareceria quebrado. Além disso a abertura por mês (faturas
 * por cartão + débitos) precisa de altura, que a grade do dashboard não tem.
 */
import { ref, computed, onMounted } from "vue";
import {
  CalendarDaysIcon,
  InformationCircleIcon,
  ChevronDownIcon,
  CreditCardIcon,
  BanknotesIcon,
} from "@heroicons/vue/24/outline";
import Navbar from "../components/navbar.vue";
import AppTabs from "../components/AppTabs.vue";
import { useFormatters } from "../services/useFormatters";
import { useProjection } from "../services/useProjection";

const { formatCurrency, formatDate } = useFormatters();

const {
  months,
  series,
  loading,
  error,
  load,
  totalCommittedInCents,
  totalInvoicesInCents,
  totalDebitsInCents,
  peakInCents,
  isEmpty,
  barPercent,
} = useProjection();

/** Mês aberto na abertura por cartão, no formato "2026-11", ou "". */
const openMonth = ref("");

/**
 * Mês corrente em UTC, no mesmo formato do campo `month` da resposta.
 *
 * Lido em UTC pelo mesmo motivo de sempre: no fuso local, todo dia 1º cai no
 * mês anterior e a marca "(mês atual)" iria para a linha errada.
 */
const currentMonth = computed(() => {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
});

const isOpen = (entry) => openMonth.value === entry.month;

/** O mês mais pesado da janela ganha a barra mais escura. */
const isPeak = (entry) => peakInCents.value > 0 && entry.committedInCents === peakInCents.value;

function toggle(entry) {
  openMonth.value = isOpen(entry) ? "" : entry.month;
}

const installmentsLabel = (count) => `${count} ${count === 1 ? "parcela" : "parcelas"}`;

/** Resumo miúdo da linha: de onde vem o valor daquele mês. */
function summaryLine(entry) {
  const parts = [];

  if (entry.invoicesInCents > 0) parts.push(`faturas ${formatCurrency(entry.invoicesInCents)}`);
  if (entry.debitsInCents > 0) parts.push(`débitos ${formatCurrency(entry.debitsInCents)}`);
  if (entry.installmentCount > 0) parts.push(installmentsLabel(entry.installmentCount));

  if (parts.length > 0) return parts.join(" · ");

  // Mês zerado, mas com fatura já quitada na abertura: dizer "nada
  // comprometido" sem mais nada faria o usuário achar que a fatura sumiu.
  if (entry.cards.length > 0) {
    return entry.cards.length === 1 ? "fatura já paga" : "faturas já pagas";
  }

  return "nada comprometido";
}

onMounted(load);
</script>
