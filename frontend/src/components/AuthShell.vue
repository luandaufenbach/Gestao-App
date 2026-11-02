<script setup>
/**
 * Casca das três telas de fora da sessão: entrar/criar conta, esqueci a senha
 * e criar senha nova (ROADMAP 1.4).
 *
 * MOTIVO: as três tinham a MESMA casca copiada linha a linha — o centralizador
 * de tela cheia, o quadrado verde com um "G", o nome do produto e o card
 * branco. Trinta linhas iguais em três arquivos, que já haviam divergido no
 * padding do card (`p-8` no login, `p-6 sm:p-8` nas outras duas).
 *
 * ── O que mudou de significado na migração ───────────────────────────────
 *
 * - O quadrado verde com "G" saiu, pela mesma razão que saiu da navbar: a
 *   skill diz que não existe logo do gestaoApp, e aquele verde era o antigo
 *   `lime-400`/`green-500` de ação — cor que hoje significa entrada de
 *   dinheiro. A marca é o nome, em Outfit.
 * - O nome exibido era "Gestão Financeira"; a navbar migrada já diz
 *   "Gestão App". Duas telas do mesmo app com dois nomes é inconsistência de
 *   conteúdo, não de estilo: ficou o da navbar.
 * - O fundo era `bg-slate-50`; agora é a tela Cloud (`--bg-app`), como as
 *   telas de dentro.
 */
defineProps({
  /** Sem título, o card só mostra o conteúdo (o estado "link incompleto"). */
  title: { type: String, default: "" },
  subtitle: { type: String, default: "" },
});
</script>

<template>
  <div class="auth">
    <main class="auth__inner">
      <p class="auth__brand">Gestão App</p>

      <section class="auth__card">
        <header v-if="title" class="auth__head">
          <h1 class="auth__title">{{ title }}</h1>
          <p v-if="subtitle" class="auth__subtitle">{{ subtitle }}</p>
        </header>

        <slot />

        <footer v-if="$slots.footer" class="auth__foot">
          <slot name="footer" />
        </footer>
      </section>
    </main>
  </div>
</template>

<style scoped>
.auth {
	min-height: 100vh;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: var(--page-pad-mobile);
	background: var(--bg-app);
}

.auth__inner {
	width: 100%;
	/* 420px: a largura de leitura confortável do card, não a da tela. */
	max-width: 420px;
	display: flex;
	flex-direction: column;
	gap: var(--space-6);
}

/* A marca em momento de página: Outfit SemiBold, tracking fechado, como a
   `.ga-wordmark` da navbar — só maior, porque aqui ela é o assunto. */
.auth__brand {
	text-align: center;
	font: var(--fw-semibold) var(--fs-page-title) / 1 var(--font-display);
	letter-spacing: -0.025em;
	color: var(--text-primary);
}

/* `.ga-card` da skill. */
.auth__card {
	display: flex;
	flex-direction: column;
	gap: var(--space-5);
	padding: var(--card-pad);
	border: 1px solid var(--border-subtle);
	border-radius: var(--radius-card);
	background: var(--surface-card);
	box-shadow: var(--shadow-xs);
}
@media (min-width: 640px) {
	.auth__card {
		padding: 28px;
	}
}

.auth__head {
	display: flex;
	flex-direction: column;
	gap: var(--space-1);
}
.auth__title {
	font: var(--type-title);
	letter-spacing: var(--ls-title);
}
.auth__subtitle {
	font: var(--type-small);
	color: var(--text-secondary);
}

.auth__foot {
	text-align: center;
	font: var(--type-small);
	color: var(--text-secondary);
}
</style>
