<script setup>
/**
 * Barra de abas inferior do celular, com o FAB de "+" no meio.
 *
 * Porte em Vue de `components/navigation/TabBar.jsx` da skill
 * `gestaoapp-design`, com o CSS de `components/navigation/navigation.css`
 * (`.ga-tabbar*`). Ela é o que o `readme.md` pede abaixo de 768px, no lugar das
 * abas de topo: "bottom TabBar with center '+'", alvos de 44px, ícones de 20.
 *
 * O `AppTabs.vue` — as abas de topo que esta barra substitui — explicava por que
 * a troca não tinha sido feita antes: o FAB precisa de uma ação de criar por
 * tela, e três das quatro telas ainda não estavam migradas. Agora estão, e o
 * arquivo saiu.
 *
 * ── Diferenças de API em relação ao React ────────────────────────────────
 *
 * - Lá cada item é um `<button>` com `value` e um `onChange` que o pai
 *   interpreta. Aqui os destinos são ROTAS, então cada item é um `RouterLink`
 *   com `to`, e o estado ativo (classe + `aria-current="page"`) vem do próprio
 *   vue-router. Mesma razão explicada no `GaNavItem`.
 * - `onAdd` virou o evento `add`; `addLabel` continua sendo o nome acessível do
 *   FAB, que muda com a tela (ver `stores/pageAction.js`).
 * - `floating` não foi portado: é a variante de barra solta com margem e
 *   sombra, e esta é encostada na borda inferior da janela.
 *
 * A divisão dos itens em torno do FAB é a mesma conta do `TabBar.jsx`:
 * `ceil(n / 2)` antes, o resto depois. Com os quatro destinos do app, dois de
 * cada lado.
 */
import { computed } from "vue";
import { RouterLink } from "vue-router";
import GaIcon from "./GaIcon.vue";

const props = defineProps({
  /** `[{ to, label, icon }]`. O `icon` é um nome Lucide. */
  items: { type: Array, default: () => [] },
  /** Nome acessível do FAB: a ação de criar da tela atual. */
  addLabel: { type: String, required: true },
  /**
   * Mostra o botão central.
   *
   * Em "Minha conta" ele some: a tela é de exportar e excluir os próprios
   * dados, e um botão flutuante de criar transação ali não tem relação com a
   * tarefa. Esconder não faz a barra pular de layout porque Conta NÃO é uma
   * aba — chega pelo ícone da barra de topo, e os quatro destinos continuam
   * os mesmos em todas as telas que têm aba.
   */
  showFab: { type: Boolean, default: true },
});

defineEmits(["add"]);

const half = computed(() => Math.ceil(props.items.length / 2));
const before = computed(() => props.items.slice(0, half.value));
const after = computed(() => props.items.slice(half.value));
</script>

<template>
  <nav class="ga-tabbar">
    <RouterLink
      v-for="item in before"
      :key="item.to"
      :to="item.to"
      class="ga-tabbar__item"
      active-class="ga-tabbar__item--active"
    >
      <GaIcon :name="item.icon" :size="20" />
      <span>{{ item.label }}</span>
    </RouterLink>

    <button
      v-if="showFab"
      type="button"
      class="ga-tabbar__fab"
      :aria-label="addLabel"
      :title="addLabel"
      @click="$emit('add')"
    >
      <GaIcon name="plus" :size="22" :stroke-width="2.25" />
    </button>

    <RouterLink
      v-for="item in after"
      :key="item.to"
      :to="item.to"
      class="ga-tabbar__item"
      active-class="ga-tabbar__item--active"
    >
      <GaIcon :name="item.icon" :size="20" />
      <span>{{ item.label }}</span>
    </RouterLink>
  </nav>
</template>

<!-- Sem `scoped`: ver o comentário do `GaNavItem`. -->
<style>
/* Cópia de `.ga-tabbar*` de `components/navigation/navigation.css` da skill. */
.ga-tabbar {
  display: flex;
  align-items: center;
  justify-content: space-around;
  gap: var(--space-1);
  min-height: var(--tabbar-height);
  /*
	 * `8px 10px calc(10px + env(safe-area-inset-bottom))` na skill. A barra do
	 * sistema (iPhone com gesto, Android com barra de navegação) fica POR CIMA
	 * do rodapé da janela; sem o `env()` os rótulos ficariam embaixo dela.
	 */
  padding: var(--space-2) var(--space-2-5) calc(var(--space-2-5) + env(safe-area-inset-bottom));
  background: var(--surface-card);
  border-top: 1px solid var(--border-subtle);
}

.ga-tabbar__item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
  /* O alvo de 44px que o readme pede no celular. */
  min-height: var(--hit-min);
  border: 0;
  background: none;
  color: var(--text-tertiary);
  /* 10.5px é literal na skill: o rótulo da aba é menor que `--fs-micro`. */
  font: var(--fw-medium) 10.5px / 1 var(--font-ui);
  text-align: center;
  text-decoration: none;
  cursor: pointer;
  transition: color var(--dur-fast) var(--ease-out);
}
.ga-tabbar__item:hover {
  text-decoration: none;
}
.ga-tabbar__item--active {
  color: var(--text-primary);
}
.ga-tabbar__item--active .ga-icon {
  color: var(--brand-primary);
}

.ga-tabbar__fab {
  flex: 0 0 auto;
  width: 46px;
  height: 46px;
  border-radius: var(--radius-lg);
  border: 0;
  background: var(--brand-primary);
  color: var(--text-on-brand);
  box-shadow: var(--shadow-brand);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition:
    transform var(--dur-fast) var(--ease-out),
    background var(--dur-fast) var(--ease-out);
}
.ga-tabbar__fab:hover {
  background: var(--brand-primary-hover);
}
.ga-tabbar__fab:active {
  transform: scale(0.92);
}

/*
 * ACRESCENTADO À SKILL — foco.
 *
 * O `navigation.css` não traz regra de foco para a barra. Mesma regra do
 * readme ("focus = cobalt border + 3px soft cobalt ring") usada no `GaButton`,
 * com os tokens. No item, o anel vai POR DENTRO: a barra tem 72px de altura e
 * um anel para fora seria cortado pela borda da janela.
 */
.ga-tabbar__item:focus-visible {
  outline: none;
  border-radius: var(--radius-md);
  box-shadow: inset var(--ring-focus);
}
.ga-tabbar__fab:focus-visible {
  outline: none;
  box-shadow: var(--shadow-brand), var(--ring-focus);
}
</style>
