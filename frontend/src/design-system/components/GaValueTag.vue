<template>
  <span class="ga-tag" :class="`ga-tag--${variant}`">
    <!--
      A seta é decoração: o sinal já está no valor formatado que vem do
      `formatCurrency`. Com `aria-hidden` o leitor de tela lê "−R$ 120,00" uma
      vez, e não "seta para baixo menos R$ 120,00".
    -->
    <span
      v-if="direction !== 'none'"
      class="ga-tag__arrow"
      :class="`ga-tag__arrow--${direction}`"
      aria-hidden="true"
      >{{ direction === "down" ? "▼" : "▲" }}</span
    >
    <span>{{ value }}</span>
  </span>
</template>

<script setup>
/**
 * Pastilha de valor — porte do `ValueTag` do Lumen Design System para os
 * tokens do gestaoApp. Ver o cabeçalho de `charts.css` para a proveniência.
 *
 * Usada no tooltip do `GaBarChart` e disponível para números de variação em
 * card de métrica.
 *
 * O valor entra JÁ FORMATADO. O componente não conhece centavos: a conversão
 * para reais acontece num lugar só, em `services/useFormatters.js`.
 */
defineProps({
  /** Texto do valor, já formatado. */
  value: { type: String, required: true },

  /** Seta: `up`, `down` ou `none`. */
  direction: {
    type: String,
    default: "none",
    validator: (value) => ["up", "down", "none"].includes(value),
  },

  /**
   * `dark` é o padrão do Lumen (pastilha escura sobre o gráfico). `light`
   * tem hairline e serve sobre superfície escura; `brand` é cobalto.
   */
  variant: {
    type: String,
    default: "dark",
    validator: (value) => ["dark", "light", "brand"].includes(value),
  },
});
</script>
