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
        <h1 class="text-xl font-semibold text-slate-900 mb-1">Esqueci minha senha</h1>
        <p class="text-sm text-slate-500 mb-6">
          Informe o e-mail da conta e enviamos um link para criar uma senha nova.
        </p>

        <!--
          Estado de enviado.

          A mensagem exibida é a que o backend devolveu, e ela é a mesma exista
          a conta ou não. Nada aqui pode dizer "e-mail encontrado" ou
          "e-mail não cadastrado": a rota é cega de propósito para não servir de
          consulta de quem tem cadastro (ver services/api.js).
        -->
        <div v-if="sentMessage" class="space-y-4">
          <div class="flex gap-3 rounded-xl border border-emerald-100 bg-emerald-50 p-4">
            <EnvelopeIcon class="h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
            <p class="text-sm text-emerald-800">{{ sentMessage }}</p>
          </div>

          <p class="text-xs text-slate-400">
            O link vale por 1 hora e só funciona uma vez. Se não chegar, confira a caixa de spam ou
            peça outro — pedir um link novo invalida o anterior.
          </p>

          <button
            type="button"
            class="w-full rounded-xl bg-slate-100 px-4 py-2.5 font-medium text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
            @click="askAgain"
          >
            Pedir outro link
          </button>
        </div>

        <form v-else class="space-y-4" @submit.prevent="submit">
          <div>
            <label for="email" class="block text-sm font-medium text-slate-600 mb-1">E-mail</label>
            <input
              id="email"
              v-model="email"
              type="email"
              autocomplete="email"
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
            {{ loading ? "Enviando..." : "Enviar link de recuperação" }}
          </button>
        </form>

        <p class="text-sm text-slate-500 text-center mt-6">
          <RouterLink
            to="/login"
            class="font-semibold text-emerald-600 hover:text-emerald-700 cursor-pointer"
          >
            Voltar para o login
          </RouterLink>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { RouterLink } from "vue-router";
import { EnvelopeIcon } from "@heroicons/vue/24/outline";
import { forgotPassword } from "@/services/api";

const email = ref("");
const loading = ref(false);
const errorMessage = ref("");

/** Mensagem genérica devolvida pelo backend; preenchê-la troca a tela. */
const sentMessage = ref("");

/**
 * Texto de reserva para o caso improvável de a resposta vir sem `message`.
 * Mantido igual ao do backend justamente para não vazar diferença de
 * comportamento entre e-mail existente e inexistente.
 */
const FALLBACK_MESSAGE =
  "Se existir uma conta com esse e-mail, enviamos um link para redefinir a senha.";

async function submit() {
  errorMessage.value = "";
  loading.value = true;

  try {
    const response = await forgotPassword({ email: email.value });
    sentMessage.value = response?.message || FALLBACK_MESSAGE;
  } catch (error) {
    // displayMessage já concatena os detalhes de validação vindos do Zod
    // (e-mail mal formatado é o único 400 possível aqui).
    errorMessage.value = error.displayMessage ?? "Não foi possível enviar. Tente novamente.";
  } finally {
    loading.value = false;
  }
}

function askAgain() {
  sentMessage.value = "";
  errorMessage.value = "";
}
</script>
