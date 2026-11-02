<script setup>
/**
 * Raiz da aplicação: escolhe a casca da rota aberta (ROADMAP 1.4).
 *
 * MOTIVO: a casca de navegação precisa montar UMA vez, acima da `<RouterView>`.
 * Se cada tela montasse a própria, a sidebar remontaria a cada troca de rota e
 * o estado de recolhimento voltaria ao padrão a cada clique no menu — que é
 * justamente o que não pode acontecer.
 *
 * ── Como a rota diz se tem navegação ─────────────────────────────────────
 *
 * Pela mesma `meta.public` que o guard já usa, e não por uma lista de nomes de
 * rota repetida aqui. O projeto diz que "rotas nascem protegidas" (CLAUDE.md):
 * então uma rota nova nasce protegida E com navegação, e uma rota pública nasce
 * sem — que é o certo para as três telas de fora da sessão, que têm o
 * `AuthShell` e não devem ganhar sidebar nem barra inferior.
 *
 * O caso de propósito: `/design-system` é pública com `allowAuthenticated`, e
 * por isso NÃO ganha casca. É o que ela quer — é página de amostra da fundação,
 * alcançada só por URL, e uma navegação em volta dela atrapalharia a leitura.
 *
 * Nenhuma rota, nome ou `meta` foi alterada nesta etapa; o router continua
 * exatamente como estava.
 *
 * ── Por que a casca é carregada sob demanda ──────────────────────────────
 *
 * Este arquivo está no bundle de entrada. Com `import` normal, a casca e tudo o
 * que ela usa — `GaSidebar`, `GaTabBar`, `GaIcon` e o mapa dos 74 ícones —
 * entravam no pacote que a TELA DE LOGIN baixa, que não tem navegação nenhuma.
 * Medido: 124,78 kB de JS de entrada com import direto contra 106,75 kB com
 * este `defineAsyncComponent` (e 42,14 kB de CSS contra 34,59). A casca virou um
 * chunk de 6,4 kB que só as telas de dentro da sessão pedem, em paralelo com o
 * chunk da própria tela — que é sempre o maior dos dois.
 */
import { computed, defineAsyncComponent } from "vue";
import { RouterView, useRoute } from "vue-router";

const AppShell = defineAsyncComponent(() => import("./components/AppShell.vue"));

const route = useRoute();

const hasNav = computed(() => !route.meta.public);
</script>

<template>
  <AppShell v-if="hasNav">
    <RouterView />
  </AppShell>

  <RouterView v-else />
</template>
