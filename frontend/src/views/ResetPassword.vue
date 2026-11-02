<template>
  <div class="min-h-screen bg-slate-50 flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <div class="flex items-center justify-center gap-3 mb-8">
        <div class="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
          <span class="text-slate-900 font-bold">G</span>
        </div>
        <span class="text-2xl font-semibold text-slate-900">Gestão Financeira</span>
      </div>

      <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <!--
          Sem token na URL não existe formulário possível: enviar a troca sem
          token só renderia um 400 depois de o usuário digitar duas senhas. O
          caminho honesto é explicar e oferecer um link novo.
        -->
        <div v-if="!token">
          <div class="flex gap-3 rounded-xl border border-amber-100 bg-amber-50 p-4">
            <ExclamationTriangleIcon class="h-5 w-5 shrink-0 text-amber-600" aria-hidden="true" />
            <div class="text-sm text-amber-900">
              <p class="font-semibold">Link incompleto</p>
              <p class="mt-1">
                Este endereço chegou sem o código de recuperação. Alguns programas de e-mail cortam
                o link em duas linhas — abra o link inteiro ou peça outro.
              </p>
            </div>
          </div>

          <RouterLink
            to="/forgot-password"
            class="mt-5 block w-full rounded-xl bg-lime-400 px-4 py-2.5 text-center font-semibold text-slate-900 hover:bg-lime-300 transition-colors cursor-pointer"
          >
            Pedir um link novo
          </RouterLink>
        </div>

        <template v-else>
          <h1 class="text-xl font-semibold text-slate-900 mb-1">Criar uma senha nova</h1>
          <p class="text-sm text-slate-500 mb-6">
            Depois de trocar, você entra na conta com a senha nova.
          </p>

          <form class="space-y-4" @submit.prevent="submit">
            <div>
              <label for="password" class="block text-sm font-medium text-slate-600 mb-1">
                Nova senha
              </label>
              <div class="relative">
                <input
                  id="password"
                  v-model="password"
                  :type="revealed ? 'text' : 'password'"
                  autocomplete="new-password"
                  required
                  class="w-full rounded-xl border border-slate-200 px-3 py-2.5 pr-12 focus:outline-none focus:ring-2 focus:ring-lime-300"
                />
                <!--
                  Área de clique de 32px (h-8 w-8), maior que o desenho do
                  ícone: digitar senha às cegas no celular é o que mais gera
                  erro de confirmação.
                -->
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
              <!-- A mesma regra do cadastro: ver backend/src/validators/authValidators.js. -->
              <p class="text-xs text-slate-400 mt-1">
                Mínimo de 8 caracteres, com pelo menos uma letra e um número.
              </p>
            </div>

            <div>
              <label for="confirmation" class="block text-sm font-medium text-slate-600 mb-1">
                Repita a nova senha
              </label>
              <input
                id="confirmation"
                v-model="confirmation"
                :type="revealed ? 'text' : 'password'"
                autocomplete="new-password"
                required
                class="w-full rounded-xl border border-slate-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-lime-300"
              />
            </div>

            <p v-if="errorMessage" class="text-sm text-red-600">{{ errorMessage }}</p>

            <button
              type="submit"
              :disabled="loading"
              class="w-full rounded-xl bg-lime-400 px-4 py-2.5 font-semibold text-slate-900 hover:bg-lime-300 transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {{ loading ? "Trocando..." : "Trocar senha" }}
            </button>
          </form>

          <p class="text-sm text-slate-500 text-center mt-6">
            Link expirado?
            <RouterLink
              to="/forgot-password"
              class="font-semibold text-emerald-600 hover:text-emerald-700 cursor-pointer"
            >
              Peça outro
            </RouterLink>
          </p>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import { EyeIcon, EyeSlashIcon, ExclamationTriangleIcon } from "@heroicons/vue/24/outline";
import { resetPassword } from "@/services/api";
import { useAuth } from "../stores/auth";

const route = useRoute();
const router = useRouter();
const { isAuthenticated, logout } = useAuth();

/**
 * O token vem na query, como o mailer monta o link:
 * `${APP_URL}/reset-password?token=...`.
 *
 * `route.query.token` pode ser um array quando o parâmetro aparece duas vezes
 * na URL; aí o token não é confiável e a tela trata como ausente.
 */
const token = computed(() => (typeof route.query.token === "string" ? route.query.token : ""));

const password = ref("");
const confirmation = ref("");
const revealed = ref(false);
const loading = ref(false);
const errorMessage = ref("");

async function submit() {
  errorMessage.value = "";

  // A conferência das duas senhas é só daqui: o backend não recebe a repetição.
  if (password.value !== confirmation.value) {
    errorMessage.value = "As duas senhas não são iguais.";
    return;
  }

  loading.value = true;

  try {
    await resetPassword({ token: token.value, password: password.value });

    /**
     * A rota não devolve sessão — o login com a senha nova é que prova quem é.
     *
     * Se havia uma sessão antiga nesta aba, ela é derrubada aqui. Sem isso o
     * guard veria o usuário logado, mandaria /login de volta para /dashboard e
     * o aviso de senha trocada nunca apareceria.
     */
    if (isAuthenticated.value) logout();

    router.replace({ path: "/login", query: { reset: "1" } });
  } catch (error) {
    // Token inválido, expirado ou já usado chegam com a mesma mensagem.
    errorMessage.value = error.displayMessage ?? "Não foi possível trocar a senha.";
  } finally {
    loading.value = false;
  }
}
</script>
