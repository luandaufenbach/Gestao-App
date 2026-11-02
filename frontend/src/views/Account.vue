<template>
  <!--
    Medida de leitura mais curta que as telas de dados: aqui tudo é texto, e
    linha de aviso com 1200px de largura não se lê. O `max-width` é desta tela,
    e não da casca — as outras quatro usam a largura inteira do conteúdo.
  -->
  <div class="acc">
    <header class="acc__head">
      <h1 class="acc__title">Minha conta</h1>
      <p class="acc__subtitle">
        <template v-if="user">{{ user.name }} · {{ user.email }}</template>
        <template v-else>Seus dados e o fim da conta.</template>
      </p>
    </header>

    <!-- ── Exportar ────────────────────────────────────────── -->
    <section class="acc__card">
      <div class="acc__cardHead">
        <span class="acc__label">Exportar meus dados</span>
        <span class="acc__labelIcon">
          <GaIcon name="download" :size="16" />
        </span>
      </div>

      <p class="acc__text">
        Um arquivo JSON com seu cadastro, suas transações, categorias, metas e cartões — tudo o que
        esta conta guarda.
      </p>

      <div>
        <!-- Rótulo trocado e botão desabilitado: o estado de carregamento
             que o app já usava. A skill não define nenhum. -->
        <GaButton variant="primary" :disabled="exporting" @click="handleExport">
          <template #icon>
            <GaIcon name="download" />
          </template>
          {{ exporting ? "Gerando..." : "Baixar meus dados" }}
        </GaButton>
      </div>

      <!--
        Estado indeterminado, sem porcentagem: a resposta é streaming e não
        traz `Content-Length`, então qualquer barra com número seria inventada.
      -->
      <p v-if="exporting" class="acc__hint">
        O arquivo é montado na hora e pode demorar alguns segundos. Não feche esta aba.
      </p>

      <GaNote v-else-if="exportedFilename" tone="success" icon="circle-check">
        Arquivo baixado: <span class="acc__filename">{{ exportedFilename }}</span>
      </GaNote>

      <GaNote v-if="exportError" tone="danger" icon="triangle-alert">
        {{ exportError }}
      </GaNote>
    </section>

    <!-- ── Excluir ─────────────────────────────────────────── -->
    <!-- Fio vermelho: o card inteiro avisa do que se trata antes de qualquer leitura. -->
    <section class="acc__card acc__card--danger">
      <div class="acc__cardHead">
        <span class="acc__label acc__label--danger">Excluir minha conta</span>
        <span class="acc__labelIcon acc__labelIcon--danger">
          <GaIcon name="trash-2" :size="16" />
        </span>
      </div>

      <p class="acc__text">
        Apaga a conta e todo o histórico: transações, categorias, metas e cartões.
        <strong class="acc__strong">Não há como desfazer</strong> e não existe cópia de segurança
        para pedir depois.
      </p>

      <GaNote tone="warning" icon="info">
        Baixe seus dados antes, no card acima. Depois da exclusão não dá mais para exportar nada.
      </GaNote>

      <!--
        DUAS ETAPAS, e a migração não encurtou nenhuma delas. O primeiro
        clique só ABRE o formulário; a exclusão em si exige a senha atual
        digitada, e o botão fica desabilitado enquanto o campo está vazio. Um
        botão solto que apagasse tudo no primeiro toque é toque errado de dedo
        em 375px.

        Os dois botões usam a variante `danger` do sistema, que é VAZADA —
        fio vermelho sobre branco, não bloco vermelho. É o que o
        `Dialog.prompt.md` da skill prescreve para ação irreversível, e deixa
        o botão final MENOS chamativo do que o `bg-red-600` de antes, não
        mais.
      -->
      <div v-if="!confirming">
        <GaButton variant="danger" @click="startConfirming">
          <template #icon>
            <GaIcon name="trash-2" />
          </template>
          Quero excluir minha conta
        </GaButton>
      </div>

      <form v-else class="acc__confirm" @submit.prevent="submitDelete">
        <!--
          A segunda etapa se anuncia como etapa: o quadradinho vermelho com a
          lixeira é o `.ga-dialog--danger .ga-dialog__icon` da skill, trazido
          para dentro da tela. Sem ele as duas etapas ficariam parecidas, e é
          justamente a diferença entre elas que protege o usuário.
        -->
        <div class="acc__confirmHead">
          <span class="acc__confirmIcon">
            <GaIcon name="trash-2" :size="20" />
          </span>
          <p class="acc__confirmTitle">Confirme com a sua senha atual para excluir.</p>
        </div>

        <GaField v-slot="{ id }" label="Senha atual">
          <input
            :id="id"
            ref="passwordInput"
            v-model="password"
            :type="revealed ? 'text' : 'password'"
            autocomplete="current-password"
            required
          />
          <!--
            O conjunto de 74 ícones da skill não tem "olho cortado", e
            desenhar um ícone novo é o que o design system existe para
            evitar. O estado vai no `aria-pressed`, no fundo tingido do botão
            e no próprio campo, que mostra a senha em texto quando ligado.
            Mesma decisão de ResetPassword.vue, que explica por extenso.
          -->
          <button
            type="button"
            :aria-label="revealed ? 'Ocultar senha' : 'Mostrar senha'"
            :aria-pressed="revealed"
            class="acc__reveal"
            :class="{ 'acc__reveal--on': revealed }"
            @click="revealed = !revealed"
          >
            <GaIcon name="eye" :size="16" />
          </button>
        </GaField>

        <GaNote v-if="deleteError" tone="danger" icon="triangle-alert">
          {{ deleteError }}
        </GaNote>

        <!-- Em 375px os dois botões empilham; "Cancelar" vem por último, mas
             à mão — é o que `column-reverse` garante. -->
        <div class="acc__confirmActions">
          <GaButton variant="ghost" :disabled="deleting" @click="cancelConfirming">
            Cancelar
          </GaButton>
          <GaButton type="submit" variant="danger" :disabled="deleting || !password">
            {{ deleting ? "Excluindo..." : "Excluir conta definitivamente" }}
          </GaButton>
        </div>
      </form>
    </section>
  </div>
</template>

<script setup>
/**
 * Minha conta: exportação e exclusão de dados (ROADMAP 0.6, LGPD).
 *
 * Tela própria, e não um quinto destino da navegação: no celular ela é
 * alcançada pelo ícone de conta na barra de topo, e no desktop pelo rodapé da
 * sidebar. A `GaTabBar` tem quatro abas e o FAB central, e uma quinta aba
 * repetiria o aperto de largura das abas de topo que ela substituiu — isto não
 * é uma tela de uso diário, é uma tela que se visita uma vez.
 *
 * ── MIGRADA para o design system gestaoApp (ROADMAP 1.4) ─────────────────
 *
 * Nenhuma requisição, nenhum estado e nenhum evento mudou, e NENHUMA DAS DUAS
 * ETAPAS da exclusão ficou mais fácil de acionar — ver o comentário no
 * template, que lista as travas uma por uma.
 *
 * O que mudou de significado:
 *
 * - "Baixar meus dados" era `bg-lime-400` com um círculo escuro em volta do
 *   ícone. Exportar não é destrutivo, é a ação da seção: primário cobalt.
 * - Os dois botões de exclusão eram `border-red-200 text-red-600` (o primeiro)
 *   e `bg-red-600 text-white` (o segundo). Os dois passam a ser a variante
 *   `danger` do `GaButton`, vazada, que é a que a skill prescreve para ação
 *   irreversível.
 * - Os três avisos (exportado, erro, "baixe antes") viraram `GaNote`: verde de
 *   conclusão, vermelho de erro e laranja de atenção, nas mesmas famílias de
 *   antes.
 * - Os ícones saíram do Heroicons: ArrowDownTray -> `download`, CheckCircle ->
 *   `circle-check`, ExclamationTriangle -> `triangle-alert`, InformationCircle
 *   -> `info`, Trash -> `trash-2`, Eye -> `eye`.
 *
 * ── Esqueleto de navegação ───────────────────────────────────────────────
 *
 * A casca (`div > Navbar + main`) saiu daqui: a navegação e o `<main>` são do
 * `AppShell`. Esta tela é a única da casca que NÃO registra ação de criar —
 * exportar e excluir dados não tem "novo" nenhum, e o FAB da barra inferior
 * cai no modal de "Nova transação" da própria casca. Ver
 * `stores/pageAction.js`.
 *
 * O `max-width` de leitura ficou, porque é desta tela e não da casca.
 */
import { ref, nextTick } from "vue";
import { useRouter } from "vue-router";
import GaButton from "@/design-system/components/GaButton.vue";
import GaField from "@/design-system/components/GaField.vue";
import GaIcon from "@/design-system/components/GaIcon.vue";
import GaNote from "@/design-system/components/GaNote.vue";
import { useAuth } from "../stores/auth";
import { useAccount } from "../services/useAccount";

const router = useRouter();
const { user, logout } = useAuth();

const {
  exporting,
  exportError,
  exportedFilename,
  downloadExport,
  deleting,
  deleteError,
  removeAccount,
} = useAccount();

const confirming = ref(false);
const password = ref("");
const revealed = ref(false);
// Mesmo padrão do ConfirmDialog.vue: ref(null) com o nome igual ao do template.
const passwordInput = ref(null);

const handleExport = () => downloadExport();

async function startConfirming() {
  confirming.value = true;
  // O formulário só existe depois do v-if; o foco precisa do tick.
  await nextTick();
  passwordInput.value?.focus();
}

function cancelConfirming() {
  confirming.value = false;
  password.value = "";
  revealed.value = false;
  deleteError.value = "";
}

async function submitDelete() {
  const removed = await removeAccount(password.value);

  // Senha errada volta aqui: a conta está intacta e o usuário fica na tela com
  // a mensagem do servidor. Nada de sessão derrubada (ver logoutOn401 em api.js).
  if (!removed) {
    password.value = "";
    return;
  }

  /**
   * O token já morreu no servidor. Sem descartar a sessão local, ele ficaria no
   * localStorage e a próxima tela quebraria com 401 — inclusive o guard de
   * rota, que revalida o token guardado ao abrir a aplicação.
   */
  logout();
  router.replace({ path: "/login", query: { deleted: "1" } });
}
</script>

<style scoped>
/*
 * `min-height`, fundo, cor e os dois `padding` com breakpoint saíram para o
 * `AppShell`. O `max-width` FICOU: ele é a medida de leitura desta tela, não a
 * largura do conteúdo da casca — as outras quatro usam `--content-max`.
 */
.acc {
	display: flex;
	flex-direction: column;
	gap: var(--space-6);
	/*
	 * 768px é a medida que a tela já tinha (`max-w-3xl`), mantida de propósito.
	 * A skill não define token de medida de leitura — está no relatório da
	 * etapa como pedido a ela.
	 */
	max-width: 768px;
	margin: 0 auto;
}

.acc__head {
	display: flex;
	flex-direction: column;
	gap: var(--space-1);
}
.acc__title {
	font: var(--type-page-title);
	letter-spacing: var(--ls-heading);
}
.acc__subtitle {
	font: var(--type-small);
	color: var(--text-secondary);
}

/* ── Cards ─────────────────────────────────────────────────────────────── */
/* `.ga-card` da skill. */
.acc__card {
	display: flex;
	flex-direction: column;
	gap: var(--space-3);
	padding: var(--card-pad);
	border: 1px solid var(--border-subtle);
	border-radius: var(--radius-card);
	background: var(--surface-card);
	box-shadow: var(--shadow-xs);
}
/* O fio vermelho é o primeiro aviso do card de exclusão. */
.acc__card--danger {
	border-color: var(--feedback-danger-border);
}

.acc__cardHead {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: var(--space-3);
}
.acc__label {
	font: var(--type-label);
	letter-spacing: var(--ls-label);
	text-transform: uppercase;
	color: var(--text-tertiary);
}
.acc__label--danger {
	color: var(--feedback-danger);
}

/* Quadradinho tingido do padrão `.ga-stat__icon`. */
.acc__labelIcon {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 28px;
	height: 28px;
	flex-shrink: 0;
	border-radius: var(--radius-sm);
	background: var(--brand-primary-soft);
	color: var(--brand-primary);
}
.acc__labelIcon--danger {
	background: var(--feedback-danger-bg);
	color: var(--feedback-danger);
}

.acc__text {
	font: var(--type-body);
	color: var(--text-secondary);
}
.acc__strong {
	font-weight: var(--fw-semibold);
	color: var(--text-primary);
}
.acc__hint {
	font: var(--type-caption);
	color: var(--text-tertiary);
}
.acc__filename {
	/* Nome de arquivo longo quebra em qualquer ponto, senão estoura a caixa. */
	word-break: break-all;
}

/* ── Segunda etapa da exclusão ─────────────────────────────────────────── */
.acc__confirm {
	display: flex;
	flex-direction: column;
	gap: var(--space-4);
	padding-top: var(--space-4);
	border-top: 1px solid var(--border-subtle);
}

.acc__confirmHead {
	display: flex;
	align-items: center;
	gap: var(--space-3);
}
/* `.ga-dialog--danger .ga-dialog__icon` da skill. */
.acc__confirmIcon {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 40px;
	height: 40px;
	flex-shrink: 0;
	border-radius: 12px;
	background: var(--feedback-danger-bg);
	color: var(--feedback-danger);
}
.acc__confirmTitle {
	font: var(--type-body-strong);
	color: var(--text-primary);
}

/*
 * `column-reverse` no celular: "Cancelar" é o primeiro no DOM — a ordem de
 * leitura e de tabulação segura — e fica embaixo na tela, onde o dedo alcança.
 * A partir de 640px os dois voltam para uma linha, alinhados à direita.
 */
.acc__confirmActions {
	display: flex;
	flex-direction: column-reverse;
	gap: var(--space-2);
}
@media (min-width: 640px) {
	.acc__confirmActions {
		flex-direction: row;
		justify-content: flex-end;
	}
}

/*
 * `.ga-iconbtn--ghost` pequeno, encaixado na caixa do campo. Igual ao de
 * ResetPassword.vue.
 */
.acc__reveal {
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
.acc__reveal:hover {
	background: var(--surface-sunken);
	color: var(--text-primary);
}
.acc__reveal--on,
.acc__reveal--on:hover {
	background: var(--surface-selected);
	color: var(--brand-primary);
}
.acc__reveal:focus-visible {
	outline: none;
	box-shadow: var(--ring-focus);
}
@media (max-width: 767px) {
	.acc__reveal {
		position: relative;
	}
	.acc__reveal::after {
		content: "";
		position: absolute;
		inset: -8px -6px;
	}
}
</style>
