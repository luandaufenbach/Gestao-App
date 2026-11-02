<template>
  <nav class="bg-slate-900 text-white shadow-lg">
    <div class="max-w-7xl mx-auto px-4 sm:px-6">
      <div class="flex items-center justify-between h-16">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
            <span class="text-slate-900 font-bold text-sm">G</span>
          </div>
          <RouterLink
            to="/dashboard"
            class="text-lg font-semibold tracking-tight hover:text-green-400 transition-colors"
          >
            Gestão App
          </RouterLink>
        </div>

        <div class="flex items-center gap-2 sm:gap-4">
          <span v-if="user" class="text-sm text-slate-300 hidden sm:inline">{{ user.name }}</span>

          <!--
            Entrada da tela de conta (exportar e excluir dados).
            Ícone, e não uma quinta aba: as quatro de AppTabs já ocupam 348px
            contra 342px de espaço em 375px. Área de clique de 32px (h-8 w-8),
            maior que o desenho, porque fica encostado no botão "Sair".
          -->
          <RouterLink
            to="/account"
            title="Minha conta"
            aria-label="Minha conta"
            class="inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors cursor-pointer"
            :class="
              route.path === '/account'
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            "
          >
            <UserCircleIcon class="h-5 w-5" aria-hidden="true" />
          </RouterLink>

          <button
            type="button"
            class="text-sm text-slate-400 hover:text-white transition-colors cursor-pointer"
            @click="handleLogout"
          >
            Sair
          </button>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { RouterLink, useRoute, useRouter } from "vue-router";
import { UserCircleIcon } from "@heroicons/vue/24/outline";
import { useAuth } from "../stores/auth";

const route = useRoute();
const router = useRouter();
const { user, logout } = useAuth();

function handleLogout() {
  // O logout já limpa as stores de categorias e cartões; a chamada extra que
  // existia aqui virou duplicata quando isso passou para o próprio store.
  logout();
  router.replace("/login");
}
</script>
