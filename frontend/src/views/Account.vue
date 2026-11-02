<template>
  <div class="min-h-screen bg-slate-50">
    <Navbar />

    <!--
      max-w-3xl, e não os max-w-7xl das telas de dados: aqui tudo é texto, e
      linha de aviso com 1200px de largura não se lê.
    -->
    <main class="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      <AppTabs />

      <div>
        <h2 class="text-xl font-semibold text-slate-800">Minha conta</h2>
        <p class="text-sm text-slate-500 mt-0.5">
          <template v-if="user">{{ user.name }} · {{ user.email }}</template>
          <template v-else>Seus dados e o fim da conta.</template>
        </p>
      </div>

      <!-- ── Exportar ────────────────────────────────────────── -->
      <section
        class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col gap-3"
      >
        <div class="flex items-center justify-between gap-3">
          <span class="text-xs font-semibold uppercase tracking-widest text-slate-400">
            Exportar meus dados
          </span>
          <ArrowDownTrayIcon class="h-5 w-5 shrink-0 text-slate-300" aria-hidden="true" />
        </div>

        <p class="text-sm text-slate-600">
          Um arquivo JSON com seu cadastro, suas transações, categorias, metas e cartões — tudo o
          que esta conta guarda.
        </p>

        <div>
          <button
            type="button"
            :disabled="exporting"
            class="inline-flex items-center gap-2 rounded-full border border-lime-300 bg-lime-400 px-5 py-2 font-semibold text-slate-900 shadow-sm transition-all hover:bg-lime-300 hover:border-lime-200 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            @click="handleExport"
          >
            <span
              class="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-900 text-lime-300"
            >
              <ArrowDownTrayIcon class="h-3.5 w-3.5" aria-hidden="true" />
            </span>
            {{ exporting ? "Gerando..." : "Baixar meus dados" }}
          </button>
        </div>

        <!--
          Estado indeterminado, sem porcentagem: a resposta é streaming e não
          traz `Content-Length`, então qualquer barra com número seria inventada.
        -->
        <p v-if="exporting" class="text-xs text-slate-400">
          O arquivo é montado na hora e pode demorar alguns segundos. Não feche esta aba.
        </p>

        <p
          v-else-if="exportedFilename"
          class="flex gap-2 text-xs text-emerald-700 break-all items-start"
        >
          <CheckCircleIcon class="h-4 w-4 shrink-0 mt-px" aria-hidden="true" />
          <span>Arquivo baixado: {{ exportedFilename }}</span>
        </p>

        <p v-if="exportError" class="flex gap-2 text-xs text-red-600 items-start">
          <ExclamationTriangleIcon class="h-4 w-4 shrink-0 mt-px" aria-hidden="true" />
          <span>{{ exportError }}</span>
        </p>
      </section>

      <!-- ── Excluir ─────────────────────────────────────────── -->
      <!-- Borda vermelha: o card inteiro avisa do que se trata antes de qualquer leitura. -->
      <section class="bg-white rounded-2xl border border-red-200 shadow-sm p-5 flex flex-col gap-3">
        <div class="flex items-center justify-between gap-3">
          <span class="text-xs font-semibold uppercase tracking-widest text-red-500">
            Excluir minha conta
          </span>
          <TrashIcon class="h-5 w-5 shrink-0 text-red-300" aria-hidden="true" />
        </div>

        <p class="text-sm text-slate-600">
          Apaga a conta e todo o histórico: transações, categorias, metas e cartões.
          <strong class="font-semibold text-slate-900">Não há como desfazer</strong> e não existe
          cópia de segurança para pedir depois.
        </p>

        <div class="flex gap-2.5 rounded-xl border border-amber-100 bg-amber-50 p-3">
          <InformationCircleIcon class="h-5 w-5 shrink-0 text-amber-600" aria-hidden="true" />
          <p class="text-xs text-amber-900 leading-relaxed">
            Baixe seus dados antes, no card acima. Depois da exclusão não dá mais para exportar
            nada.
          </p>
        </div>

        <!--
          Duas etapas de propósito: o primeiro clique só ABRE o formulário, e a
          exclusão mesmo exige a senha atual digitada. Um botão solto que
          apagasse tudo no primeiro toque é toque errado de dedo em 375px.
        -->
        <div v-if="!confirming">
          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-full border border-red-200 px-5 py-2 font-semibold text-red-600 transition-colors hover:bg-red-50 cursor-pointer"
            @click="startConfirming"
          >
            <TrashIcon class="h-4 w-4 shrink-0" aria-hidden="true" />
            Quero excluir minha conta
          </button>
        </div>

        <form
          v-else
          class="space-y-4 border-t border-slate-100 pt-4"
          @submit.prevent="submitDelete"
        >
          <p class="text-sm font-semibold text-slate-900">
            Confirme com a sua senha atual para excluir.
          </p>

          <div>
            <label for="current-password" class="block text-sm font-medium text-slate-600 mb-1">
              Senha atual
            </label>
            <div class="relative">
              <input
                id="current-password"
                ref="passwordInput"
                v-model="password"
                :type="revealed ? 'text' : 'password'"
                autocomplete="current-password"
                required
                class="w-full rounded-xl border border-slate-200 px-3 py-2.5 pr-12 focus:outline-none focus:ring-2 focus:ring-red-200"
              />
              <!-- Área de clique de 32px (h-8 w-8), maior que o desenho do ícone. -->
              <button
                type="button"
                :aria-label="revealed ? 'Ocultar senha' : 'Mostrar senha'"
                :aria-pressed="revealed"
                class="absolute right-1.5 top-1/2 -translate-y-1/2 inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
                @click="revealed = !revealed"
              >
                <EyeSlashIcon v-if="revealed" class="h-5 w-5" aria-hidden="true" />
                <EyeIcon v-else class="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          </div>

          <p v-if="deleteError" class="flex gap-2 text-sm text-red-600 items-start">
            <ExclamationTriangleIcon class="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
            <span>{{ deleteError }}</span>
          </p>

          <!-- Em 375px os dois botões empilham; "Cancelar" vem por último, mas à mão. -->
          <div class="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <button
              type="button"
              :disabled="deleting"
              class="rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-200 disabled:opacity-60 cursor-pointer"
              @click="cancelConfirming"
            >
              Cancelar
            </button>
            <button
              type="submit"
              :disabled="deleting || !password"
              class="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {{ deleting ? "Excluindo..." : "Excluir conta definitivamente" }}
            </button>
          </div>
        </form>
      </section>
    </main>
  </div>
</template>

<script setup>
/**
 * Minha conta: exportação e exclusão de dados (ROADMAP 0.6, LGPD).
 *
 * Tela própria, alcançada pelo ícone de conta na navbar e não por uma quinta
 * aba: as quatro abas atuais já somam 348px contra 342px de espaço em 375px
 * (ver AppTabs.vue). Uma quinta aba criaria rolagem horizontal permanente nas
 * abas — e isto não é uma tela de uso diário, é uma tela que se visita uma vez.
 */
import { ref, nextTick } from "vue";
import { useRouter } from "vue-router";
import {
  ArrowDownTrayIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
} from "@heroicons/vue/24/outline";
import Navbar from "../components/navbar.vue";
import AppTabs from "../components/AppTabs.vue";
import { useAuth } from "../stores/auth";
import { useAccount } from "../services/useAccount";

const router = useRouter();
const { user, logout } = useAuth();

const {
  exporting,
  exportError,
  exportedFilename,
  downloadExport,
  deleting,
  deleteError,
  removeAccount,
} = useAccount();

const confirming = ref(false);
const password = ref("");
const revealed = ref(false);
// Mesmo padrão do ConfirmDialog.vue: ref(null) com o nome igual ao do template.
const passwordInput = ref(null);

const handleExport = () => downloadExport();

async function startConfirming() {
  confirming.value = true;
  // O formulário só existe depois do v-if; o foco precisa do tick.
  await nextTick();
  passwordInput.value?.focus();
}

function cancelConfirming() {
  confirming.value = false;
  password.value = "";
  revealed.value = false;
  deleteError.value = "";
}

async function submitDelete() {
  const removed = await removeAccount(password.value);

  // Senha errada volta aqui: a conta está intacta e o usuário fica na tela com
  // a mensagem do servidor. Nada de sessão derrubada (ver logoutOn401 em api.js).
  if (!removed) {
    password.value = "";
    return;
  }

  /**
   * O token já morreu no servidor. Sem descartar a sessão local, ele ficaria no
   * localStorage e a próxima tela quebraria com 401 — inclusive o guard de
   * rota, que revalida o token guardado ao abrir a aplicação.
   */
  logout();
  router.replace({ path: "/login", query: { deleted: "1" } });
}
</script>
