<template>
  <div class="min-h-screen bg-slate-50 flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <div class="flex items-center justify-center gap-3 mb-8">
        <div class="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
          <span class="text-slate-900 font-bold">G</span>
        </div>
        <span class="text-2xl font-semibold text-slate-900">Gestão Financeira</span>
      </div>

      <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
        <h1 class="text-xl font-semibold text-slate-900 mb-1">
          {{ isRegister ? "Criar conta" : "Entrar" }}
        </h1>
        <p class="text-sm text-slate-500 mb-6">
          {{ isRegister ? "Comece a organizar suas finanças." : "Bem-vindo de volta." }}
        </p>

        <!--
          Aviso de volta da troca de senha. Sem ele a pessoa cai no login sem
          saber se a troca deu certo — e tenta trocar de novo com um token que
          já foi consumido.
        -->
        <div
          v-if="passwordWasReset"
          class="flex gap-3 rounded-xl border border-emerald-100 bg-emerald-50 p-3 mb-5"
        >
          <CheckCircleIcon class="h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
          <p class="text-sm text-emerald-800">Senha trocada. Entre com a senha nova.</p>
        </div>

        <!--
          Volta da exclusão da conta. Sem o aviso, quem acabou de apagar a conta
          cai numa tela de login idêntica à de sempre e não sabe se a exclusão
          aconteceu — e tenta entrar de novo com a conta que já não existe.
        -->
        <div
          v-if="accountWasDeleted"
          class="flex gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 mb-5"
        >
          <CheckCircleIcon class="h-5 w-5 shrink-0 text-slate-500" aria-hidden="true" />
          <p class="text-sm text-slate-700">
            Conta excluída. Seus dados foram apagados e este e-mail está livre para um cadastro
            novo.
          </p>
        </div>

        <form class="space-y-4" @submit.prevent="submit">
          <div v-if="isRegister">
            <label for="name" class="block text-sm font-medium text-slate-600 mb-1">Nome</label>
            <input
              id="name"
              v-model="form.name"
              type="text"
              autocomplete="name"
              required
              class="w-full rounded-xl border border-slate-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-lime-300"
            />
          </div>

          <div>
            <label for="email" class="block text-sm font-medium text-slate-600 mb-1">E-mail</label>
            <input
              id="email"
              v-model="form.email"
              type="email"
              autocomplete="email"
              required
              class="w-full rounded-xl border border-slate-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-lime-300"
            />
          </div>

          <div>
            <label for="password" class="block text-sm font-medium text-slate-600 mb-1"
              >Senha</label
            >
            <input
              id="password"
              v-model="form.password"
              type="password"
              :autocomplete="isRegister ? 'new-password' : 'current-password'"
              required
              class="w-full rounded-xl border border-slate-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-lime-300"
            />
            <p v-if="isRegister" class="text-xs text-slate-400 mt-1">
              Mínimo de 8 caracteres, com pelo menos uma letra e um número.
            </p>
            <!--
              O link só aparece no modo de entrar: quem está criando a conta
              ainda não tem senha para esquecer.
            -->
            <p v-else class="mt-1.5 text-right">
              <RouterLink
                to="/forgot-password"
                class="text-xs font-semibold text-emerald-600 hover:text-emerald-700 cursor-pointer"
              >
                Esqueci minha senha
              </RouterLink>
            </p>
          </div>

          <p v-if="errorMessage" class="text-sm text-red-600">{{ errorMessage }}</p>

          <button
            type="submit"
            :disabled="loading"
            class="w-full rounded-xl bg-lime-400 px-4 py-2.5 font-semibold text-slate-900 hover:bg-lime-300 transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            {{ loading ? "Aguarde..." : isRegister ? "Criar conta" : "Entrar" }}
          </button>
        </form>

        <p class="text-sm text-slate-500 text-center mt-6">
          {{ isRegister ? "Já tem uma conta?" : "Ainda não tem conta?" }}
          <button
            type="button"
            class="font-semibold text-emerald-600 hover:text-emerald-700 cursor-pointer"
            @click="toggleMode"
          >
            {{ isRegister ? "Entrar" : "Criar conta" }}
          </button>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from "vue";
import { RouterLink, useRouter, useRoute } from "vue-router";
import { CheckCircleIcon } from "@heroicons/vue/24/outline";
import { useAuth } from "../stores/auth";

const router = useRouter();
const route = useRoute();
const { login, register, loading } = useAuth();

const mode = ref("login");
const errorMessage = ref("");

const isRegister = computed(() => mode.value === "register");

/** `?reset=1` é posto por ResetPassword.vue depois de trocar a senha. */
const passwordWasReset = computed(() => route.query.reset === "1");

/** `?deleted=1` é posto por Account.vue depois de excluir a conta. */
const accountWasDeleted = computed(() => route.query.deleted === "1");

const form = reactive({ name: "", email: "", password: "" });

function toggleMode() {
  mode.value = isRegister.value ? "login" : "register";
  errorMessage.value = "";
}

async function submit() {
  errorMessage.value = "";

  try {
    if (isRegister.value) {
      await register({ name: form.name, email: form.email, password: form.password });
    } else {
      await login({ email: form.email, password: form.password });
    }

    // Volta para onde o usuário tentou ir antes de ser barrado pelo guard.
    const redirect = typeof route.query.redirect === "string" ? route.query.redirect : "/dashboard";
    router.replace(redirect);
  } catch (error) {
    // displayMessage já concatena os detalhes de validação vindos do Zod.
    errorMessage.value = error.displayMessage ?? "Não foi possível concluir. Tente novamente.";
  }
}
</script>
