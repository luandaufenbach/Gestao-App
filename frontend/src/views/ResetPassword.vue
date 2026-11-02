<template>
  <AuthShell
    :title="token ? 'Criar uma senha nova' : ''"
    :subtitle="token ? 'Depois de trocar, você entra na conta com a senha nova.' : ''"
  >
    <!--
      Sem token na URL não existe formulário possível: enviar a troca sem
      token só renderia um 400 depois de o usuário digitar duas senhas. O
      caminho honesto é explicar e oferecer um link novo.
    -->
    <div v-if="!token" class="reset__noToken">
      <GaNote tone="warning" icon="triangle-alert" title="Link incompleto">
        Este endereço chegou sem o código de recuperação. Alguns programas de e-mail cortam o link em
        duas linhas — abra o link inteiro ou peça outro.
      </GaNote>

      <!--
        `.ga-btn` direto no RouterLink, e não o `GaButton` com `href`: o botão
        vira `<a href>` quando recebe `href`, e `<a href>` recarrega a página
        inteira em vez de navegar pelo router. É o caso que o próprio
        `GaButton` prevê no comentário do `<style>`.
      -->
      <RouterLink to="/forgot-password" class="ga-btn ga-btn--primary ga-btn--lg ga-btn--block">
        Pedir um link novo
      </RouterLink>
    </div>

    <template v-else>
      <form class="reset__form" @submit.prevent="submit">
        <!-- A mesma regra do cadastro: ver backend/src/validators/authValidators.js. -->
        <GaField
          v-slot="{ id }"
          label="Nova senha"
          hint="Mínimo de 8 caracteres, com pelo menos uma letra e um número."
        >
          <input
            :id="id"
            v-model="password"
            :type="revealed ? 'text' : 'password'"
            autocomplete="new-password"
            required
          />
          <!--
            Alternador de visibilidade. Ver o comentário do script sobre o
            ícone: o conjunto da skill não tem "olho cortado", então o estado
            vai no `aria-pressed` e no fundo tingido do botão, e o campo em si
            já mostra a senha em texto quando está ligado.
          -->
          <button
            type="button"
            :aria-label="revealed ? 'Ocultar senha' : 'Mostrar senha'"
            :aria-pressed="revealed"
            class="reset__reveal"
            :class="{ 'reset__reveal--on': revealed }"
            @click="revealed = !revealed"
          >
            <GaIcon name="eye" :size="16" />
          </button>
        </GaField>

        <GaField v-slot="{ id }" label="Repita a nova senha">
          <input
            :id="id"
            v-model="confirmation"
            :type="revealed ? 'text' : 'password'"
            autocomplete="new-password"
            required
          />
        </GaField>

        <p v-if="errorMessage" class="reset__error">{{ errorMessage }}</p>

        <!-- Rótulo trocado e botão desabilitado: o estado de carregamento que
             o app já usava. A skill não define nenhum. -->
        <GaButton type="submit" variant="primary" size="lg" block :disabled="loading">
          {{ loading ? "Trocando..." : "Trocar senha" }}
        </GaButton>
      </form>
    </template>

    <!-- Fora do `v-else` acima: `#footer` precisa ser filho direto do
         AuthShell para cair no slot certo. -->
    <template v-if="token" #footer>
      Link expirado?
      <RouterLink to="/forgot-password" class="reset__link">Peça outro</RouterLink>
    </template>
  </AuthShell>
</template>

<script setup>
/**
 * Troca de senha pelo link do e-mail.
 *
 * MIGRADA para o design system gestaoApp (ROADMAP 1.4). Comportamento
 * idêntico; o que mudou de significado:
 *
 * - Os botões eram `bg-lime-400`. Ação é cobalt, pelo `GaButton`.
 * - O aviso de link incompleto era `bg-amber-50`/`text-amber-900` e virou
 *   `GaNote` de tom `warning`: laranja é o sinal de atenção do sistema, e era
 *   laranja antes. Nada mudou de família.
 * - "Peça outro" era `text-emerald-600`; link é cobalt.
 *
 * ── O ícone que o conjunto da skill não tem ──────────────────────────────
 *
 * O alternador de visibilidade usava `EyeIcon`/`EyeSlashIcon` do Heroicons. O
 * conjunto da skill é fechado em 74 ícones Lucide e não tem "olho cortado", e
 * desenhar um ícone novo é exatamente o que o design system existe para
 * evitar. Diferente da seta de saída da lista de transações, que é a `arrow-up`
 * girada meia volta, um olho cortado não sai de transformação CSS nenhuma.
 *
 * Então o ícone passa a dizer o ASSUNTO ("visibilidade da senha") e não o
 * estado, e o estado é dito de três outras formas: `aria-pressed` para o leitor
 * de tela, fundo cobalt tingido no botão quando ligado — o mesmo
 * `--surface-selected` que a navbar usa na aba ativa —, e o próprio campo, que
 * é a indicação mais direta que existe, porque mostra a senha em texto.
 *
 * Está anotado no relatório da etapa como pedido à skill.
 */
import { ref, computed } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import GaButton from "@/design-system/components/GaButton.vue";
import GaField from "@/design-system/components/GaField.vue";
import GaIcon from "@/design-system/components/GaIcon.vue";
import GaNote from "@/design-system/components/GaNote.vue";
import AuthShell from "../components/AuthShell.vue";
import { resetPassword } from "@/services/api";
import { useAuth } from "../stores/auth";

const route = useRoute();
const router = useRouter();
const { isAuthenticated, logout } = useAuth();

/**
 * O token vem na query, como o mailer monta o link:
 * `${APP_URL}/reset-password?token=...`.
 *
 * `route.query.token` pode ser um array quando o parâmetro aparece duas vezes
 * na URL; aí o token não é confiável e a tela trata como ausente.
 */
const token = computed(() => (typeof route.query.token === "string" ? route.query.token : ""));

const password = ref("");
const confirmation = ref("");
const revealed = ref(false);
const loading = ref(false);
const errorMessage = ref("");

async function submit() {
  errorMessage.value = "";

  // A conferência das duas senhas é só daqui: o backend não recebe a repetição.
  if (password.value !== confirmation.value) {
    errorMessage.value = "As duas senhas não são iguais.";
    return;
  }

  loading.value = true;

  try {
    await resetPassword({ token: token.value, password: password.value });

    /**
     * A rota não devolve sessão — o login com a senha nova é que prova quem é.
     *
     * Se havia uma sessão antiga nesta aba, ela é derrubada aqui. Sem isso o
     * guard veria o usuário logado, mandaria /login de volta para /dashboard e
     * o aviso de senha trocada nunca apareceria.
     */
    if (isAuthenticated.value) logout();

    router.replace({ path: "/login", query: { reset: "1" } });
  } catch (error) {
    // Token inválido, expirado ou já usado chegam com a mesma mensagem.
    errorMessage.value = error.displayMessage ?? "Não foi possível trocar a senha.";
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.reset__form,
.reset__noToken {
	display: flex;
	flex-direction: column;
	gap: var(--space-4);
}

/*
 * `.ga-iconbtn--ghost` da skill, no tamanho pequeno, encaixado dentro da caixa
 * do campo. A caixa tem 40px de altura e 12px de padding; o botão ocupa 28 e a
 * margem negativa de 4px o aproxima da borda sem passar dela.
 */
.reset__reveal {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 28px;
	height: 28px;
	flex-shrink: 0;
	margin-right: -4px;
	border: 0;
	border-radius: 8px;
	background: transparent;
	color: var(--text-tertiary);
	cursor: pointer;
	transition:
		background var(--dur-fast) var(--ease-out),
		color var(--dur-fast) var(--ease-out);
}
.reset__reveal:hover {
	background: var(--surface-sunken);
	color: var(--text-primary);
}
/* Ligado: o mesmo par de tokens que a navbar usa no item ativo. */
.reset__reveal--on,
.reset__reveal--on:hover {
	background: var(--surface-selected);
	color: var(--brand-primary);
}
.reset__reveal:focus-visible {
	outline: none;
	box-shadow: var(--ring-focus);
}
/* Alvo de 44px no celular, sem engordar a caixa do campo. */
@media (max-width: 767px) {
	.reset__reveal {
		position: relative;
	}
	.reset__reveal::after {
		content: "";
		position: absolute;
		inset: -8px -6px;
	}
}

.reset__error {
	font: var(--type-small);
	color: var(--feedback-danger);
}

.reset__link {
	font: var(--fw-semibold) var(--fs-small) / 1.45 var(--font-ui);
	color: var(--text-link);
	text-decoration: none;
	border-radius: var(--radius-sm);
}
.reset__link:hover {
	color: var(--brand-primary-hover);
	text-decoration: underline;
	text-underline-offset: 3px;
}
@media (max-width: 767px) {
	.reset__link {
		position: relative;
	}
	.reset__link::after {
		content: "";
		position: absolute;
		/* O retângulo de um elemento em linha é a caixa da FONTE (16px aqui),
		   não a entrelinha: 16 + 2 × 15 passa dos 44px da regra. Medido. */
		inset: -15px -8px;
	}
}
</style>
