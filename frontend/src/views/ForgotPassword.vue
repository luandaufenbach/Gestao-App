<template>
  <AuthShell
    title="Esqueci minha senha"
    subtitle="Informe o e-mail da conta e enviamos um link para criar uma senha nova."
  >
    <!--
      Estado de enviado.

      A mensagem exibida é a que o backend devolveu, e ela é a mesma exista
      a conta ou não. Nada aqui pode dizer "e-mail encontrado" ou
      "e-mail não cadastrado": a rota é cega de propósito para não servir de
      consulta de quem tem cadastro (ver services/api.js).
    -->
    <div v-if="sentMessage" class="forgot__sent">
      <GaNote tone="success" icon="mail">{{ sentMessage }}</GaNote>

      <p class="forgot__hint">
        O link vale por 1 hora e só funciona uma vez. Se não chegar, confira a caixa de spam ou peça
        outro — pedir um link novo invalida o anterior.
      </p>

      <GaButton variant="secondary" size="lg" block @click="askAgain">Pedir outro link</GaButton>
    </div>

    <form v-else class="forgot__form" @submit.prevent="submit">
      <GaField v-slot="{ id }" label="E-mail">
        <input :id="id" v-model="email" type="email" autocomplete="email" required />
      </GaField>

      <p v-if="errorMessage" class="forgot__error">{{ errorMessage }}</p>

      <!-- Rótulo trocado e botão desabilitado: o estado de carregamento que o
           app já usava. A skill não define nenhum. -->
      <GaButton type="submit" variant="primary" size="lg" block :disabled="loading">
        {{ loading ? "Enviando..." : "Enviar link de recuperação" }}
      </GaButton>
    </form>

    <template #footer>
      <RouterLink to="/login" class="forgot__link">Voltar para o login</RouterLink>
    </template>
  </AuthShell>
</template>

<script setup>
/**
 * Pedido de link de recuperação de senha.
 *
 * MIGRADA para o design system gestaoApp (ROADMAP 1.4). Comportamento
 * idêntico; o que mudou de significado:
 *
 * - "Enviar link" era `bg-lime-400`: ação virou cobalt, pelo `GaButton`.
 * - "Pedir outro link" era `bg-slate-100`, um botão cinza. É a ação ao lado da
 *   principal na variante `secondary` do sistema — fio de 1px sobre superfície
 *   branca.
 * - O aviso de enviado era `bg-emerald-50`/`text-emerald-800` e virou `GaNote`
 *   de tom `success`: a mensagem é de conclusão, e verde é conclusão.
 * - "Voltar para o login" era `text-emerald-600`; link é cobalt.
 */
import { ref } from "vue";
import { RouterLink } from "vue-router";
import GaButton from "@/design-system/components/GaButton.vue";
import GaField from "@/design-system/components/GaField.vue";
import GaNote from "@/design-system/components/GaNote.vue";
import AuthShell from "../components/AuthShell.vue";
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

<style scoped>
.forgot__form,
.forgot__sent {
	display: flex;
	flex-direction: column;
	gap: var(--space-4);
}

.forgot__hint {
	font: var(--type-caption);
	color: var(--text-tertiary);
}

.forgot__error {
	font: var(--type-small);
	color: var(--feedback-danger);
}

.forgot__link {
	font: var(--fw-semibold) var(--fs-small) / 1.45 var(--font-ui);
	color: var(--text-link);
	text-decoration: none;
	border-radius: var(--radius-sm);
}
.forgot__link:hover {
	color: var(--brand-primary-hover);
	text-decoration: underline;
	text-underline-offset: 3px;
}
/* Alvo de toque de 44px no celular, sem empurrar o layout. */
@media (max-width: 767px) {
	.forgot__link {
		position: relative;
	}
	.forgot__link::after {
		content: "";
		position: absolute;
		/* O retângulo de um elemento em linha é a caixa da FONTE (16px aqui),
		   não a entrelinha: 16 + 2 × 15 passa dos 44px da regra. Medido. */
		inset: -15px -8px;
	}
}
</style>
