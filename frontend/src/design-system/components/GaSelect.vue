<script setup>
/**
 * Seletor do design system gestaoApp.
 *
 * ── ACRESCENTADO À SKILL, não é porte ────────────────────────────────────
 *
 * O `Select` da skill é um `<select>` NATIVO embelezado. O `Select.prompt.md`
 * diz isso com todas as letras — "dropdown using the native select (best on
 * mobile) with a chevron" — e o `forms.css` dela estiliza SÓ o controle
 * fechado: a caixa, a seta e os estados de foco/erro/desabilitado. A skill
 * inteira não tem um único padrão de menu flutuante: nenhum `role="listbox"`,
 * nenhum `role="option"`, nenhum `aria-activedescendant`, nenhum
 * `aria-expanded`. Conferido com grep na pasta inteira.
 *
 * Então este componente é ACRÉSCIMO, no mesmo sentido dos blocos
 * "ACRESCENTADO À SKILL" do `forms.css`: o que existe lá é reaproveitado sem
 * mudar nada (a caixa é o `GaField`, que é o `.ga-input`), e o que a skill não
 * desenha — o painel — é montado só com tokens dela. Nenhuma cor, raio,
 * espaçamento, sombra, duração ou camada foi inventada aqui; a lista está no
 * bloco de CSS em `./forms.css`.
 *
 * ── Híbrido: menu próprio no desktop, nativo no celular ──────────────────
 *
 * Acima de 768px o controle é um `<button role="combobox">` com painel
 * próprio. Abaixo, é o `<select>` nativo de sempre, com o mesmo visual
 * fechado.
 *
 * O motivo é que as duas pontas têm problemas opostos. No desktop, o menu do
 * `<select>` é desenhado pelo Windows: fonte do sistema, sem raio, sem a cor
 * de seleção do sistema, e nada disso aceita CSS. No celular, o nativo abre a
 * roleta do iOS e o seletor em folha do Android, que são melhores do que
 * qualquer painel que a gente desenhe e são exatamente o que a skill chama de
 * "best on mobile". Trocar os dois pelo mesmo painel pioraria metade dos
 * casos.
 *
 * O corte sai de `--bp-tablet`, lido do próprio token em tempo de execução —
 * `@media` não aceita `var()`, e repetir "768" aqui em JS seria um número
 * solto fora do sistema. Sem o token legível (CSS ainda não aplicado, por
 * exemplo), a consulta fica inválida, não casa, e o componente cai no
 * `<select>` nativo: a degradação segura é sempre a do controle do navegador.
 *
 * ── Contrato de `v-model` ────────────────────────────────────────────────
 *
 * O MESMO do `<select>` que ele substitui: o valor emitido é o `value` da
 * opção, com o tipo que ela declara. Por isso as telas perderam o modificador
 * `.number` do `v-model` — ele não existe para componente (o Vue só o aplica
 * em controle nativo, e num componente ele chega como `modelModifiers`, para
 * o componente aplicar). Aqui a opção de mês já declara `value: 1..12` como
 * número, então o estado da tela continua recebendo número. O tipo é
 * preservado também no ramo nativo: `v-model` em `<select>` lê o `_value` que
 * o Vue grava no `<option>`, e não a string do DOM.
 *
 * A comparação com o valor atual é estrita (`===`), como a do `<select>`, e a
 * emissão só acontece quando o valor muda de fato — nenhum `watch` de tela
 * dispara por escolher de novo a opção que já estava marcada.
 */
import { computed, nextTick, onBeforeUnmount, ref, useId, watch } from "vue";
import GaField from "./GaField.vue";
import GaIcon from "./GaIcon.vue";

const props = defineProps({
  /** Valor atual. Comparado com `option.value` por `===`, como no `<select>`. */
  modelValue: { type: [String, Number], default: "" },
  /**
   * Opções, na forma do `Select.jsx` da skill: string (rótulo = valor) ou
   * `{ value, label, disabled }`. A opção vazia de "selecione..." é uma opção
   * como as outras, com `value: ""` — igual ao `<option value="">` de antes.
   */
  options: { type: Array, required: true },
  /** Rótulo visível. Repassado ao `GaField`. */
  label: { type: String, default: "" },
  /** Nome acessível quando não há rótulo visível (os filtros de Transações). */
  ariaLabel: { type: String, default: "" },
  hint: { type: String, default: "" },
  tone: {
    type: String,
    default: "default",
    validator: (value) => ["default", "warning", "error"].includes(value),
  },
  size: {
    type: String,
    default: "md",
    validator: (value) => ["sm", "md"].includes(value),
  },
  disabled: { type: Boolean, default: false },
});

const emit = defineEmits(["update:modelValue"]);

/* ── Tokens lidos em tempo de execução ──────────────────────────────────── */

/**
 * Dois valores do sistema precisam existir em JS, não em CSS: o ponto de corte
 * do `matchMedia` e a folga entre o controle e o painel, que entra no cálculo
 * de posição. Ler do token é o que impede os dois de virarem número solto.
 */
function tokenPx(name) {
  if (typeof window === "undefined") return NaN;
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name);
  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) ? parsed : NaN;
}

const GAP = tokenPx("--space-2");
const gap = Number.isFinite(GAP) ? GAP : 0;

/**
 * `(min-width: NaNpx)` é consulta inválida: nunca casa. É de propósito — sem o
 * token, o componente usa o `<select>` nativo em qualquer largura.
 */
const mediaQuery =
  typeof window !== "undefined"
    ? window.matchMedia(`(min-width: ${tokenPx("--bp-tablet")}px)`)
    : null;

const ownMenu = ref(Boolean(mediaQuery?.matches));

function onMediaChange(event) {
  ownMenu.value = event.matches;
  // Girar o aparelho com o menu aberto trocaria o controle por baixo do painel.
  if (open.value) closeMenu(false);
}

mediaQuery?.addEventListener("change", onMediaChange);

/* ── Opções ─────────────────────────────────────────────────────────────── */

/**
 * Chave de busca para o salto por letra: sem acento, em minúsculas, e sem os
 * sinais que algumas opções trazem na frente do nome ("★ Nubank"). Sem isso,
 * digitar "n" não acharia o cartão favorito.
 */
function searchKey(label) {
  return String(label)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/^[^a-z0-9]+/, "");
}

const opts = computed(() =>
  props.options.map((raw) => {
    const option = raw !== null && typeof raw === "object" ? raw : { value: raw, label: raw };
    const label = String(option.label ?? option.value ?? "");

    return {
      value: option.value,
      label,
      disabled: Boolean(option.disabled),
      search: searchKey(label),
    };
  })
);

const selectedIndex = computed(() => opts.value.findIndex((o) => o.value === props.modelValue));

/**
 * Vazio quando o valor atual não está na lista. É o que o `<select>` nativo
 * faz na mesma situação — mostra o controle em branco —, e não um texto de
 * reserva inventado aqui.
 */
const selectedLabel = computed(() =>
  selectedIndex.value >= 0 ? opts.value[selectedIndex.value].label : ""
);

/** O ramo nativo continua com `v-model`, para o Vue cuidar do tipo via `_value`. */
const nativeValue = computed({
  get: () => props.modelValue,
  set: (value) => commitValue(value),
});

function commitValue(value) {
  if (value !== props.modelValue) emit("update:modelValue", value);
}

/* ── Identificadores ────────────────────────────────────────────────────── */

const uid = useId();
const listId = `${uid}-list`;
const optionId = (index) => `${uid}-opt-${index}`;

/* ── Abertura, posição e foco ───────────────────────────────────────────── */

const open = ref(false);
const activeIndex = ref(-1);
const triggerEl = ref(null);
const panelEl = ref(null);
const panelStyle = ref({});

/** A caixa, e não o botão: o painel se alinha ao `.ga-input` inteiro. */
function boxRect() {
  const trigger = triggerEl.value;
  if (!trigger) return null;
  return (trigger.closest(".ga-input") ?? trigger).getBoundingClientRect();
}

/**
 * Posição fixa calculada a partir da caixa, com o painel teleportado para o
 * `<body>`: é isso que o tira do `overflow` do card e do corpo rolável do
 * modal. A camada é `--z-tooltip` (80), acima de `--z-modal` (60) e do
 * diálogo de confirmação (70), então nenhum `z-index` solto é necessário.
 *
 * O painel abre para baixo e vira para cima só quando sobra mais espaço
 * acima. A altura máxima é o espaço disponível menos a folga, então ele nunca
 * passa da borda da janela e quem define quantas linhas aparecem é a janela,
 * não um número escolhido a dedo.
 */
function updatePosition() {
  const rect = boxRect();
  if (!rect) return;

  const below = Math.max(0, window.innerHeight - rect.bottom - gap);
  const above = Math.max(0, rect.top - gap);
  const dropUp = above > below;

  panelStyle.value = {
    left: `${rect.left}px`,
    minWidth: `${rect.width}px`,
    maxWidth: `${Math.max(0, window.innerWidth - gap * 2)}px`,
    maxHeight: `${dropUp ? above : below}px`,
    ...(dropUp
      ? { bottom: `${window.innerHeight - rect.top + gap}px` }
      : { top: `${rect.bottom + gap}px` }),
  };
}

/**
 * Segunda passada, depois que o painel existe: ele cresce com o conteúdo (o
 * rótulo da opção não pode ser cortado, senão não se distinguem as opções),
 * então a borda direita só é conhecida depois de medir.
 */
function keepInsideViewport() {
  const panel = panelEl.value;
  const rect = boxRect();
  if (!panel || !rect) return;

  const width = panel.getBoundingClientRect().width;
  const overflow = rect.left + width - (window.innerWidth - gap);
  if (overflow > 0) {
    panelStyle.value = { ...panelStyle.value, left: `${Math.max(gap, rect.left - overflow)}px` };
  }
}

function firstEnabled(from, step) {
  for (let i = from; i >= 0 && i < opts.value.length; i += step) {
    if (!opts.value[i].disabled) return i;
  }
  return -1;
}

function scrollActiveIntoView() {
  if (activeIndex.value < 0) return;
  panelEl.value
    ?.querySelector(`#${CSS.escape(optionId(activeIndex.value))}`)
    ?.scrollIntoView({ block: "nearest" });
}

function openMenu(key) {
  if (props.disabled || open.value) return;

  activeIndex.value =
    selectedIndex.value >= 0 && !opts.value[selectedIndex.value].disabled
      ? selectedIndex.value
      : firstEnabled(0, 1);

  if (key === "Home") activeIndex.value = firstEnabled(0, 1);
  if (key === "End") activeIndex.value = firstEnabled(opts.value.length - 1, -1);

  open.value = true;
  updatePosition();
  bindGlobalListeners();

  nextTick(() => {
    keepInsideViewport();
    scrollActiveIntoView();
  });
}

/**
 * `restoreFocus` existe por um caso só: fechar por perda de foco. Devolver o
 * foco ali arrancaria de volta o foco que acabou de ir para outro lugar.
 */
function closeMenu(restoreFocus = true) {
  if (!open.value) return;

  open.value = false;
  activeIndex.value = -1;
  unbindGlobalListeners();

  if (restoreFocus) triggerEl.value?.focus();
}

function choose(index) {
  const option = opts.value[index];
  if (!option || option.disabled) return;

  commitValue(option.value);
  closeMenu();
}

/** O mouse por cima de uma opção a torna a ativa, como em todo menu. */
function hover(index) {
  if (!opts.value[index]?.disabled) activeIndex.value = index;
}

/* ── Teclado ────────────────────────────────────────────────────────────── */

function move(delta) {
  const next = firstEnabled(activeIndex.value + delta, delta);
  // Sem volta ao começo da lista, como o `<select>` nativo.
  if (next >= 0) {
    activeIndex.value = next;
    nextTick(scrollActiveIntoView);
  }
}

function moveTo(index) {
  if (index < 0) return;
  activeIndex.value = index;
  nextTick(scrollActiveIntoView);
}

/**
 * Salto por letra, no comportamento do `<select>` nativo: a tecla leva para a
 * PRÓXIMA opção que começa com ela, e repetir a tecla percorre as opções que
 * começam igual. Não há acumulação de texto digitado, logo não há tempo de
 * espera — nenhuma duração precisou ser inventada para isto.
 *
 * A segunda passada procura a letra em qualquer posição do rótulo, para as
 * opções cujo nome útil não está no começo ("Fatura paga", "Sem categoria").
 */
function jumpTo(char) {
  const needle = searchKey(char);
  const total = opts.value.length;
  if (!needle || !total) return;

  const from = activeIndex.value < 0 ? 0 : activeIndex.value;

  for (const test of [
    (option) => option.search.startsWith(needle),
    (option) => option.search.includes(needle),
  ]) {
    for (let step = 1; step <= total; step += 1) {
      const index = (from + step) % total;
      const option = opts.value[index];
      if (!option.disabled && test(option)) {
        moveTo(index);
        return;
      }
    }
  }
}

function isTypedChar(event) {
  return event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey;
}

function onKeydown(event) {
  const { key } = event;

  if (!open.value) {
    if (["ArrowDown", "ArrowUp", "Enter", " ", "Home", "End"].includes(key)) {
      event.preventDefault();
      openMenu(key);
      return;
    }

    if (isTypedChar(event)) {
      event.preventDefault();
      openMenu();
      jumpTo(key);
    }

    return;
  }

  switch (key) {
    case "Escape":
      event.preventDefault();
      closeMenu();
      return;

    /*
     * Foco preso: com o painel aberto, o Tab confirma a opção ativa e fecha em
     * vez de pular para o campo seguinte. É o que o `<select>` do Windows faz,
     * e é o que mantém o foco dentro do controle enquanto há painel na tela —
     * sem isso o foco iria para um campo escondido ATRÁS do painel.
     */
    case "Tab":
    case "Enter":
    case " ":
      event.preventDefault();
      choose(activeIndex.value);
      return;

    case "ArrowDown":
      event.preventDefault();
      move(1);
      return;

    case "ArrowUp":
      event.preventDefault();
      move(-1);
      return;

    case "Home":
      event.preventDefault();
      moveTo(firstEnabled(0, 1));
      return;

    case "End":
      event.preventDefault();
      moveTo(firstEnabled(opts.value.length - 1, -1));
      return;

    default:
      if (isTypedChar(event)) {
        event.preventDefault();
        jumpTo(key);
      }
  }
}

/* ── Fechar por clique fora e por rolagem ───────────────────────────────── */

function onPointerDown(event) {
  const inside =
    panelEl.value?.contains(event.target) ||
    triggerEl.value?.closest(".ga-input")?.contains(event.target);

  if (!inside) closeMenu(false);
}

/**
 * Captura, para pegar também a rolagem do corpo do modal e das listas internas
 * — eventos de `scroll` não sobem na fase de bolha. A rolagem DENTRO do painel
 * é a exceção óbvia: ela é o que faz a lista longa funcionar.
 */
function onScroll(event) {
  if (panelEl.value?.contains(event.target)) return;
  closeMenu(false);
}

function onResize() {
  closeMenu(false);
}

function bindGlobalListeners() {
  document.addEventListener("pointerdown", onPointerDown, true);
  window.addEventListener("scroll", onScroll, true);
  window.addEventListener("resize", onResize);
}

function unbindGlobalListeners() {
  document.removeEventListener("pointerdown", onPointerDown, true);
  window.removeEventListener("scroll", onScroll, true);
  window.removeEventListener("resize", onResize);
}

/** Lista que muda com o painel aberto (as categorias chegam por GET). */
watch(opts, (list) => {
  if (!open.value) return;
  if (activeIndex.value >= list.length) activeIndex.value = firstEnabled(list.length - 1, -1);
});

watch(
  () => props.disabled,
  (disabled) => {
    if (disabled) closeMenu(false);
  }
);

onBeforeUnmount(() => {
  unbindGlobalListeners();
  mediaQuery?.removeEventListener("change", onMediaChange);
});
</script>

<template>
  <GaField
    v-slot="{ id, labelId }"
    :label="label"
    :hint="hint"
    :tone="tone"
    :size="size"
    :disabled="disabled"
    select
  >
    <!-- Celular: o controle do sistema, com o visual fechado do `.ga-input`. -->
    <select
      v-if="!ownMenu"
      :id="id"
      v-model="nativeValue"
      :aria-label="label ? undefined : ariaLabel"
      :disabled="disabled"
    >
      <option
        v-for="(option, index) in opts"
        :key="index"
        :value="option.value"
        :disabled="option.disabled"
      >
        {{ option.label }}
      </option>
    </select>

    <template v-else>
      <button
        :id="id"
        ref="triggerEl"
        type="button"
        class="ga-select__trigger"
        role="combobox"
        aria-haspopup="listbox"
        :aria-expanded="open"
        :aria-controls="listId"
        :aria-activedescendant="open && activeIndex >= 0 ? optionId(activeIndex) : undefined"
        :aria-labelledby="label ? labelId : undefined"
        :aria-label="label ? undefined : ariaLabel"
        :disabled="disabled"
        @click="open ? closeMenu() : openMenu()"
        @keydown="onKeydown"
        @blur="closeMenu(false)"
      >
        <span class="ga-select__value">{{ selectedLabel }}</span>
      </button>

      <!--
        Para o `<body>`: dentro do card ou do modal, o painel seria cortado
        pelo `overflow` deles. Com `position: fixed` e `--z-tooltip`, a
        posição não depende de nenhum ancestral.
      -->
      <Teleport to="body">
        <div
          v-if="open"
          :id="listId"
          ref="panelEl"
          class="ga-select__panel"
          role="listbox"
          :style="panelStyle"
          :aria-labelledby="label ? labelId : undefined"
          :aria-label="label ? undefined : ariaLabel"
          @mousedown.prevent
        >
          <div
            v-for="(option, index) in opts"
            :id="optionId(index)"
            :key="index"
            class="ga-select__opt"
            :class="{
              'ga-select__opt--active': index === activeIndex,
              'ga-select__opt--selected': index === selectedIndex,
            }"
            role="option"
            :aria-selected="index === selectedIndex"
            :aria-disabled="option.disabled || undefined"
            @click="choose(index)"
            @mousemove="hover(index)"
          >
            <span class="ga-select__optLabel">{{ option.label }}</span>
            <GaIcon v-if="index === selectedIndex" name="check" :size="16" />
          </div>
        </div>
      </Teleport>
    </template>
  </GaField>
</template>
