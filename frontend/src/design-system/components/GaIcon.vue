<script setup>
/**
 * Ícone do design system gestaoApp.
 *
 * Porte em Vue de `components/core/Icon.jsx` da skill `gestaoapp-design`. O
 * conjunto é Lucide, traço 1,75 e cantos redondos, exatamente como o
 * `readme.md` da skill pede. Os desenhos ficam em `../icons.js`, que explica
 * por que são um mapa de paths e não 74 arquivos importados pelo Vite.
 *
 * Diferença de API em relação ao React: lá o corpo do ícone entra por
 * `dangerouslySetInnerHTML` direto no `<svg>`, o que impediria um `<title>`
 * irmão. Aqui o corpo vai num `<g>`, e o `<title>` fica fora dele — então o
 * texto acessível passa pelo escape normal do Vue em vez de ser concatenado
 * dentro de uma string de HTML.
 *
 * Sobre o `v-html`: o conteúdo nunca vem de fora. É sempre um valor de
 * `ICONS`, que é um literal compilado no bundle; `name` só escolhe a chave, e
 * uma chave inexistente devolve string vazia. Não há caminho por onde dado de
 * usuário chegue aqui.
 */
import { computed } from "vue";
import { ICONS } from "../icons";

const props = defineProps({
  /** Nome Lucide. Ver `ICON_NAMES` em `../icons.js`. */
  name: { type: String, required: true },
  /**
   * Lado do quadrado, em pixels. A escala da skill: 12–14 em linhas de
   * metadado, 16–17 em navegação e botões, 20 na barra de abas.
   */
  size: { type: [Number, String], default: 16 },
  strokeWidth: { type: [Number, String], default: 1.75 },
  /**
   * Com título, o ícone é anunciado pelo leitor de tela. Sem ele, o ícone é
   * decorativo e recebe `aria-hidden` — o padrão, porque quase todo ícone
   * aqui acompanha um rótulo que já diz a mesma coisa.
   */
  title: { type: String, default: "" },
});

const body = computed(() => ICONS[props.name] ?? "");
</script>

<template>
  <svg
    class="ga-icon"
    xmlns="http://www.w3.org/2000/svg"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    :stroke-width="strokeWidth"
    stroke-linecap="round"
    stroke-linejoin="round"
    :role="title ? 'img' : undefined"
    :aria-hidden="title ? undefined : 'true'"
  >
    <title v-if="title">{{ title }}</title>
    <!-- O conteúdo é sempre um literal de ICONS, nunca dado de usuário. -->
    <!-- eslint-disable-next-line vue/no-v-html -->
    <g v-html="body"></g>
  </svg>
</template>

<!--
  Sem `scoped`, pelo mesmo motivo do `GaButton`: a classe já tem o prefixo
  `ga-` e precisa valer também quando o ícone é desenhado dentro de um slot de
  outro componente.
-->
<style>
.ga-icon {
	display: block;
	flex-shrink: 0;
}
</style>
