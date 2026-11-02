<template>
  <GaModal title="Gerenciar categorias" size="xl" @close="closeModal">
    <section class="cats__create">
      <h3 class="cats__createTitle">Criar nova categoria</h3>

      <form class="cats__form" @submit.prevent="saveCategory">
        <GaField v-slot="{ id }" label="Nome">
          <input :id="id" v-model="form.name" type="text" placeholder="Ex: Passeio" maxlength="60" />
        </GaField>

        <GaField v-slot="{ id }" label="Cor" variant="color">
          <input :id="id" v-model="form.color" type="color" />
          <!-- O hex fica DENTRO da caixa, ao lado do seletor, e não numa dica
               embaixo: embaixo ele deixaria este campo mais alto que os
               outros dois e a linha do formulário sairia do alinhamento. -->
          <span class="cats__hex">{{ form.color }}</span>
        </GaField>

        <!-- Rótulo trocado e botão desabilitado: o estado de carregamento que
             o app já usava. A skill não define nenhum. -->
        <GaButton type="submit" variant="primary" :disabled="saving" class="cats__submit">
          {{ saving ? "Criando..." : "Criar" }}
        </GaButton>
      </form>

      <p v-if="errorMessage" class="cats__error">{{ errorMessage }}</p>
    </section>

    <section>
      <h3 class="cats__listTitle">
        {{ categories.length }} {{ categories.length === 1 ? "categoria" : "categorias" }}
      </h3>

      <p v-if="!categories.length" class="cats__empty">Nenhuma categoria criada ainda.</p>

      <ul v-else class="cats__list">
        <li v-for="category in categories" :key="category._id" class="cats__item">
          <div class="cats__itemMain">
            <!-- A cor é da categoria, escolhida pelo usuário: é dado. -->
            <span
              class="cats__swatch"
              :style="{ backgroundColor: category.color }"
              :title="category.color"
            ></span>
            <div class="cats__itemText">
              <p class="cats__name">{{ category.name }}</p>
              <p class="cats__date">Criada em {{ formatDate(category.createdAt) }}</p>
            </div>
          </div>

          <GaButton variant="danger" size="sm" @click="deleteConfirmation.open(category)">
            <template #icon>
              <GaIcon name="trash-2" />
            </template>
            Excluir
          </GaButton>
        </li>
      </ul>
    </section>

    <template #footer>
      <GaButton variant="secondary" @click="closeModal">Fechar</GaButton>
    </template>

    <ConfirmDialog
      :open="deleteConfirmation.isOpen.value"
      :busy="deleteConfirmation.busy.value"
      title="Excluir categoria"
      confirm-label="Excluir"
      @confirm="deleteConfirmation.confirm()"
      @cancel="deleteConfirmation.close()"
    >
      Deseja realmente excluir a categoria
      <strong>{{ deleteConfirmation.selected.value?.name }}</strong
      >?
      <span v-if="deleteConfirmation.error.value" class="cats__dialogError">
        {{ deleteConfirmation.error.value }}
      </span>
    </ConfirmDialog>
  </GaModal>
</template>

<script setup>
/**
 * MIGRADO para o design system gestaoApp (ROADMAP 1.4). A casca é o `GaModal`
 * — ver NewTransactionalModal.vue, que explica a troca. O que é só daqui:
 *
 * - O título era "Gerenciar Categorias", com C maiúsculo. A skill pede
 *   sentence case em todo lugar; virou "Gerenciar categorias". Pelo mesmo
 *   motivo, o botão de cada linha era "Deletar" e virou "Excluir": o resto do
 *   app inteiro diz "excluir", e duas palavras para a mesma ação é inconsistência
 *   de conteúdo.
 * - Esse botão era um bloco `bg-red-100 text-red-600` sem ícone. Virou a
 *   variante `danger` do `GaButton`, vazada, com a lixeira — o mesmo par de
 *   desenho e cor que a linha de transação e o card de metas usam para
 *   excluir.
 * - O bloco "criar nova categoria" era `bg-slate-50 border-slate-200`; virou
 *   `--surface-sunken`, que é o `.ga-card--sunken` da skill.
 * - O hex da cor, que ficava solto ao lado do seletor em `text-slate-500`,
 *   virou a dica do próprio campo. Ele é a legenda do controle, não um dado
 *   ao lado dele.
 */
import { ref, reactive, onMounted } from "vue";
import GaButton from "@/design-system/components/GaButton.vue";
import GaField from "@/design-system/components/GaField.vue";
import GaIcon from "@/design-system/components/GaIcon.vue";
import GaModal from "@/design-system/components/GaModal.vue";
import { useCategories } from "../stores/categories";
import { useDeleteConfirmation } from "../services/useDeleteConfirmation";
import { useFormatters } from "../services/useFormatters";
import ConfirmDialog from "./ConfirmDialog.vue";

const emit = defineEmits(["close"]);

/**
 * Store singleton: criar uma categoria aqui atualiza imediatamente o <select>
 * da tela por trás do modal. Na versão anterior, cada componente tinha sua
 * própria cópia da lista e a categoria nova só aparecia após recarregar a
 * página (bug A6).
 */
const { categories, load, create, remove } = useCategories();

// formatDate estava reimplementado neste arquivo, apesar de useFormatters
// existir justamente para isso.
const { formatDate } = useFormatters();

const deleteConfirmation = useDeleteConfirmation((category) => remove(category._id));

const saving = ref(false);
const errorMessage = ref("");

const form = reactive({ name: "", color: "#64748b" });

onMounted(load);

async function saveCategory() {
  errorMessage.value = "";

  if (form.name.trim().length < 2) {
    errorMessage.value = "Nome deve ter pelo menos 2 caracteres.";
    return;
  }

  saving.value = true;

  try {
    await create({ name: form.name.trim(), color: form.color });
    form.name = "";
    form.color = "#64748b";
  } catch (error) {
    // O backend responde 409 para nome duplicado (agora também ignorando
    // maiúsculas/minúsculas) — a mensagem chega pronta para exibir.
    errorMessage.value = error.displayMessage ?? "Erro ao criar categoria.";
  } finally {
    saving.value = false;
  }
}

function closeModal() {
  emit("close");
}
</script>

<style scoped>
/* `.ga-card--sunken` da skill. */
.cats__create {
	margin-bottom: var(--space-6);
	padding: var(--card-pad-sm);
	border: 1px solid var(--border-subtle);
	border-radius: var(--radius-card);
	background: var(--surface-sunken);
}
.cats__createTitle,
.cats__listTitle {
	font: var(--type-subtitle);
	letter-spacing: var(--ls-title);
	color: var(--text-primary);
}
.cats__createTitle {
	margin-bottom: var(--space-4);
}
.cats__listTitle {
	margin-bottom: var(--space-3);
	font-variant-numeric: tabular-nums;
}

.cats__form {
	display: grid;
	grid-template-columns: 1fr;
	gap: var(--space-3);
}
/* Largura inteira no celular; a partir de 640px os três cabem numa linha, com
   os rodapés das caixas alinhados. */
.cats__submit {
	width: 100%;
}
@media (min-width: 640px) {
	.cats__form {
		grid-template-columns: 2fr 1fr auto;
		align-items: end;
	}
	.cats__submit {
		width: auto;
	}
}

.cats__hex {
	padding-right: var(--space-1);
	font: var(--type-caption);
	color: var(--text-secondary);
	font-variant-numeric: tabular-nums;
}

.cats__error {
	margin-top: var(--space-2);
	font: var(--type-small);
	color: var(--feedback-danger);
}

.cats__empty {
	padding: var(--space-8) 0;
	text-align: center;
	font: var(--type-small);
	color: var(--text-tertiary);
}

.cats__list {
	display: flex;
	flex-direction: column;
	gap: var(--space-2);
	margin: 0;
	padding: 0;
	list-style: none;
}

/* Linha no padrão `.ga-task` da skill: raio 12, fio que escurece no hover —
   igual à linha de transação já migrada. */
.cats__item {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: var(--space-3);
	min-height: var(--row-height);
	padding: var(--space-2-5) var(--space-3);
	border: 1px solid var(--border-subtle);
	border-radius: 12px;
	background: var(--surface-card);
	transition:
		border-color var(--dur-fast) var(--ease-out),
		box-shadow var(--dur-fast) var(--ease-out);
}
.cats__item:hover {
	border-color: var(--border-default);
	box-shadow: var(--shadow-sm);
}

.cats__itemMain {
	display: flex;
	align-items: center;
	gap: var(--space-3);
	min-width: 0;
}
.cats__swatch {
	width: 24px;
	height: 24px;
	flex-shrink: 0;
	border: 1px solid var(--border-default);
	border-radius: 50%;
}
.cats__itemText {
	min-width: 0;
}
.cats__name {
	font: var(--type-body-strong);
	color: var(--text-primary);
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}
.cats__date {
	font: var(--type-caption);
	color: var(--text-tertiary);
}

.cats__dialogError {
	display: block;
	margin-top: var(--space-2);
	color: var(--feedback-danger);
}
</style>
