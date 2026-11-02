<script setup>
/**
 * Campo de formulário do design system gestaoApp.
 *
 * Porte em Vue do par `TextField`/`Select` de `components/forms/` da skill: a
 * estrutura (rótulo · caixa · dica) e os estados vieram do `.jsx` e do
 * `.prompt.md`; o CSS está em `./forms.css`, que é CSS puro e pôde vir como
 * está.
 *
 * Diferença de API em relação ao React: lá existe um componente por tipo de
 * controle (`TextField`, `SearchField`, `Select`), cada um com o `<input>`
 * dentro. Aqui o controle vem por SLOT, e o `id` do rótulo chega nele como
 * propriedade de slot:
 *
 *     <GaField v-slot="{ id }" label="Nome">
 *       <input :id="id" v-model="form.name" />
 *     </GaField>
 *
 * O motivo é concreto: os formulários do app usam sete tipos de controle
 * (text, email, password, number, date, color, textarea, select) com
 * `autocomplete`, `maxlength`, `min`, `step` e `required` próprios de cada um.
 * Repassar tudo isso por prop seria reescrever o `<input>` em props; com slot,
 * cada tela declara o controle que precisa e o componente cuida só do que é
 * design system — o rótulo ligado ao controle, a caixa, o foco e a dica.
 *
 * O `id` é gerado com `useId` quando não vem de fora. É isso que liga
 * `<label for>` ao controle: sem ele, clicar no rótulo não foca o campo e o
 * leitor de tela anuncia um campo sem nome.
 */
import { computed, useId } from "vue";
import GaIcon from "./GaIcon.vue";

const props = defineProps({
  /** Rótulo visível. Sem ele, só a caixa é desenhada (filtro com aria-label). */
  label: { type: String, default: "" },
  /** Para reaproveitar um id que a tela já tem; o normal é deixar gerar. */
  controlId: { type: String, default: "" },
  /** Linha miúda embaixo do campo. */
  hint: { type: String, default: "" },
  /**
   * Cor da dica. `warning` é para o que muda o resultado sem estar errado
   * ("nenhum cartão cadastrado"); `error` é para o que impede de salvar.
   */
  tone: {
    type: String,
    default: "default",
    validator: (value) => ["default", "warning", "error"].includes(value),
  },
  /**
   * Variante da caixa. `area` para textarea, `number`/`date` para devolver os
   * controles nativos que o `appearance:none` apaga, `color` para o seletor de
   * cor. Ver `forms.css`.
   */
  variant: {
    type: String,
    default: "",
    validator: (value) => ["", "area", "number", "date", "color"].includes(value),
  },
  /**
   * Desenha a seta do `<select>`. Obrigatório em todo select: a caixa usa
   * `appearance:none`, que apaga a seta nativa, e um select sem seta fica
   * indistinguível de um campo de texto.
   */
  select: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
});

const uid = useId();
const controlId = computed(() => props.controlId || uid);

const boxClasses = computed(() => [
  "ga-input",
  props.variant && `ga-input--${props.variant}`,
  props.tone === "error" && "ga-input--error",
  props.disabled && "ga-input--disabled",
]);
</script>

<template>
  <div class="ga-field">
    <label v-if="label" :for="controlId" class="ga-field__label">{{ label }}</label>

    <div :class="boxClasses">
      <slot :id="controlId" />
      <span v-if="select" class="ga-input__chev">
        <GaIcon name="chevron-down" :size="16" />
      </span>
    </div>

    <p v-if="hint" class="ga-field__hint" :class="tone !== 'default' && `ga-field__hint--${tone}`">
      {{ hint }}
    </p>
  </div>
</template>
