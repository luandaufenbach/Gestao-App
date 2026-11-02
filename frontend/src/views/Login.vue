<template>
  <AuthShell
    :title="isRegister ? 'Criar conta' : 'Entrar'"
    :subtitle="isRegister ? 'Comece a organizar suas finanças.' : 'Bem-vindo de volta.'"
  >
    <!--
      Aviso de volta da troca de senha. Sem ele a pessoa cai no login sem
      saber se a troca deu certo — e tenta trocar de novo com um token que
      já foi consumido.
    -->
    <GaNote v-if="passwordWasReset" tone="success" icon="circle-check">
      Senha trocada. Entre com a senha nova.
    </GaNote>

    <!--
      Volta da exclusão da conta. Sem o aviso, quem acabou de apagar a conta
      cai numa tela de login idêntica à de sempre e não sabe se a exclusão
      aconteceu — e tenta entrar de novo com a conta que já não existe.
    -->
    <GaNote v-if="accountWasDeleted" tone="neutral" icon="circle-check">
      Conta excluída. Seus dados foram apagados e este e-mail está livre para um cadastro novo.
    </GaNote>

    <form class="login__form" @submit.prevent="submit">
      <GaField v-if="isRegister" v-slot="{ id }" label="Nome">
        <input :id="id" v-model="form.name" type="text" autocomplete="name" required />
      </GaField>

      <GaField v-slot="{ id }" label="E-mail">
        <input :id="id" v-model="form.email" type="email" autocomplete="email" required />
      </GaField>

      <div class="login__password">
        <GaField
          v-slot="{ id }"
          label="Senha"
          :hint="isRegister ? 'Mínimo de 8 caracteres, com pelo menos uma letra e um número.' : ''"
        >
          <input
            :id="id"
            v-model="form.password"
            type="password"
            :autocomplete="isRegister ? 'new-password' : 'current-password'"
            required
          />
        </GaField>

        <!--
          O link só aparece no modo de entrar: quem está criando a conta
          ainda não tem senha para esquecer.
        -->
        <p v-if="!isRegister" class="login__forgot">
          <RouterLink to="/forgot-password" class="login__link">Esqueci minha senha</RouterLink>
        </p>
      </div>

      <p v-if="errorMessage" class="login__error">{{ errorMessage }}</p>

      <!--
        Tamanho `lg` e largura inteira: é a ação principal da tela, e o
        `Button.prompt.md` da skill manda usar `lg` nessa posição no celular.
        O rótulo trocado com o botão desabilitado é o estado de carregamento que
        o app já usava — a skill não define nenhum, e nada foi inventado aqui.
      -->
      <GaButton type="submit" variant="primary" size="lg" block :disabled="loading">
        {{ loading ? "Aguarde..." : isRegister ? "Criar conta" : "Entrar" }}
      </GaButton>
    </form>

    <template #footer>
      {{ isRegister ? "Já tem uma conta?" : "Ainda não tem conta?" }}
      <button type="button" class="login__toggle" @click="toggleMode">
        {{ isRegister ? "Entrar" : "Criar conta" }}
      </button>
    </template>
  </AuthShell>
</template>

<script setup>
/**
 * Entrar / criar conta.
 *
 * MIGRADA para o design system gestaoApp (ROADMAP 1.4). Nenhuma requisição,
 * nenhum estado e nenhum evento mudou. O que mudou de significado:
 *
 * - O botão de enviar era `bg-lime-400` com texto escuro — o antigo verde de
 *   ação. Ação no sistema é cobalt, e é o `GaButton` que a desenha.
 * - Os dois links (`esqueci minha senha`, `criar conta`) eram
 *   `text-emerald-600`. Verde no sistema quer dizer entrada ou conclusão;
 *   link e foco são cobalt (`--text-link`).
 * - O anel de foco dos campos era `focus:ring-lime-300`; virou o anel cobalt
 *   de 3px do sistema, que agora vem do próprio `.ga-input`.
 * - Os dois avisos de volta (senha trocada, conta excluída) viraram `GaNote`.
 *   O primeiro é conclusão (verde); o segundo é constatação, não conquista, e
 *   fica neutro — era `bg-slate-50`, e segue sem sinal.
 */
import { ref, reactive, computed } from "vue";
import { RouterLink, useRouter, useRoute } from "vue-router";
import GaButton from "@/design-system/components/GaButton.vue";
import GaField from "@/design-system/components/GaField.vue";
import GaNote from "@/design-system/components/GaNote.vue";
import AuthShell from "../components/AuthShell.vue";
import { useAuth } from "../stores/auth";

const router = useRouter();
const route = useRoute();
const { login, register, loading } = useAuth();

const mode = ref("login");
const errorMessage = ref("");

const isRegister = computed(() => mode.value === "register");

/** `?reset=1` é posto por ResetPassword.vue depois de trocar a senha. */
const passwordWasReset = computed(() => route.query.reset === "1");

/** `?deleted=1` é posto por Account.vue depois de excluir a conta. */
const accountWasDeleted = computed(() => route.query.deleted === "1");

const form = reactive({ name: "", email: "", password: "" });

function toggleMode() {
  mode.value = isRegister.value ? "login" : "register";
  errorMessage.value = "";
}

async function submit() {
  errorMessage.value = "";

  try {
    if (isRegister.value) {
      await register({ name: form.name, email: form.email, password: form.password });
    } else {
      await login({ email: form.email, password: form.password });
    }

    // Volta para onde o usuário tentou ir antes de ser barrado pelo guard.
    const redirect = typeof route.query.redirect === "string" ? route.query.redirect : "/dashboard";
    router.replace(redirect);
  } catch (error) {
    // displayMessage já concatena os detalhes de validação vindos do Zod.
    errorMessage.value = error.displayMessage ?? "Não foi possível concluir. Tente novamente.";
  }
}
</script>

<style scoped>
.login__form {
	display: flex;
	flex-direction: column;
	gap: var(--space-4);
}

.login__password {
	display: flex;
	flex-direction: column;
	gap: var(--space-1-5);
}
.login__forgot {
	text-align: right;
	font: var(--type-caption);
}

.login__link,
.login__toggle {
	font: var(--fw-semibold) var(--fs-caption) / 1.4 var(--font-ui);
	color: var(--text-link);
	background: none;
	border: 0;
	padding: 0;
	cursor: pointer;
	text-decoration: none;
	border-radius: var(--radius-sm);
}
.login__toggle {
	font-size: var(--fs-small);
}
.login__link:hover,
.login__toggle:hover {
	color: var(--brand-primary-hover);
	text-decoration: underline;
	text-underline-offset: 3px;
}

/*
 * Alvo de toque: o link tem 17px de altura de linha; o `::after` estica a área
 * clicável para os 44px da regra do celular sem empurrar o layout.
 */
@media (max-width: 767px) {
	.login__link,
	.login__toggle {
		position: relative;
	}
	.login__link::after,
	.login__toggle::after {
		content: "";
		position: absolute;
		/* O retângulo de um elemento em linha é a caixa da FONTE (15px aqui),
		   não a entrelinha: 15 + 2 × 15 passa dos 44px da regra. Medido. */
		inset: -15px -8px;
	}
}

.login__error {
	font: var(--type-small);
	color: var(--feedback-danger);
}
</style>
