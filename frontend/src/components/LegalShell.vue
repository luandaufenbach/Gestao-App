<script setup>
/**
 * Casca das duas telas de documento legal: termos de uso e política de
 * privacidade (ROADMAP 0.7).
 *
 * MOTIVO DE EXISTIR: as duas telas são o mesmo objeto — uma coluna de leitura,
 * um título, o aviso de que o texto ainda não passou por advogado, o corpo em
 * prosa e o link para o documento irmão. Sem a casca, a tipografia de prosa
 * (h2, h3, p, ul) estaria escrita duas vezes, e já se sabe no que isso dá: o
 * `AuthShell` nasceu porque três telas tinham a mesma casca copiada e o padding
 * do card já havia divergido entre elas.
 *
 * A tipografia de prosa é aplicada com `:deep()` porque o conteúdo vem por
 * slot: markup de slot pertence ao escopo do COMPONENTE PAI, então um seletor
 * scoped comum não o alcança.
 *
 * Largura de leitura: 68ch, não a largura da tela. Linha de texto corrido longa
 * demais faz o olho perder a linha seguinte, e estes dois documentos são as
 * telas mais longas do app.
 */
import { onMounted } from "vue";
import { RouterLink } from "vue-router";
import GaIcon from "@/design-system/components/GaIcon.vue";
import GaNote from "@/design-system/components/GaNote.vue";

/**
 * O router do projeto não define `scrollBehavior`, então a posição da rolagem
 * sobrevive à troca de rota. Entre duas telas curtas isso não aparece; entre
 * estas duas, que são as mais longas do app, aparece muito: quem clica no link
 * do documento irmão lá no RODAPÉ cai no rodapé do outro documento, sem ver o
 * título nem o aviso de revisão jurídica.
 *
 * Corrigido aqui, e não com um `scrollBehavior` global, porque o arquivo do
 * router é área compartilhada com outras frentes em andamento e um comportamento
 * global mudaria a rolagem de TODAS as telas de uma vez — mudança maior do que
 * este item do roteiro pede.
 */
onMounted(() => window.scrollTo(0, 0));

defineProps({
  /** Título do documento, em momento de página. */
  title: { type: String, required: true },
  /** Caminho do documento irmão, no rodapé. */
  counterpartTo: { type: String, required: true },
  /** Rótulo do link para o documento irmão. */
  counterpartLabel: { type: String, required: true },
});
</script>

<template>
  <div class="legal">
    <main class="legal__inner">
      <!--
        "Voltar" aponta para /login de propósito, e serve aos dois casos: quem
        não tem conta cai na tela de acesso, de onde veio; quem está logado é
        desviado pelo guard para /dashboard, porque /login é pública SEM
        `allowAuthenticated`. Um único link resolve as duas situações sem a tela
        precisar saber se existe sessão.
      -->
      <RouterLink to="/login" class="legal__back">
        <GaIcon name="chevron-left" :size="16" />
        Voltar
      </RouterLink>

      <p class="legal__brand">Gestão App</p>

      <article class="legal__doc">
        <header class="legal__head">
          <h1 class="legal__title">{{ title }}</h1>
          <p class="legal__meta">
            Vigência a partir de
            <span class="legal-todo">[PREENCHER: data de vigência]</span>
          </p>
        </header>

        <!--
          O aviso é a PRIMEIRA coisa depois do título, e não um rodapé em letra
          miúda: quem escreveu este texto leu o código do sistema, não um
          contrato. Enquanto um advogado não revisar, o documento descreve o
          funcionamento real do app com honestidade, mas não vale como peça
          jurídica — e esconder isso no fim da página seria o mesmo que não
          dizer.
        -->
        <GaNote tone="warning" icon="triangle-alert" title="Precisa de revisão jurídica">
          Este texto foi redigido a partir do funcionamento real do sistema — do código que trata
          seus dados — e não por um advogado. Ele serve para você entender exatamente o que o app
          faz, mas ainda precisa de revisão jurídica antes de valer como documento legal. Os trechos
          marcados em laranja dependem de informações do responsável pelo app e serão preenchidos
          antes da publicação.
        </GaNote>

        <div class="legal__prose">
          <slot />
        </div>

        <footer class="legal__foot">
          <RouterLink :to="counterpartTo" class="legal__footLink">
            {{ counterpartLabel }}
          </RouterLink>
        </footer>
      </article>
    </main>
  </div>
</template>

<style scoped>
.legal {
	min-height: 100vh;
	padding: var(--page-pad-mobile);
	background: var(--bg-app);
}
@media (min-width: 640px) {
	.legal {
		padding: var(--page-pad);
	}
}

.legal__inner {
	/* 68ch de prosa + o padding do card. Centralizada, não encostada à esquerda. */
	max-width: 760px;
	margin: 0 auto;
	display: flex;
	flex-direction: column;
	gap: var(--space-4);
}

.legal__back {
	display: inline-flex;
	align-items: center;
	gap: var(--space-1);
	align-self: flex-start;
	/* 44px de alvo de toque no celular sem empurrar o layout. */
	min-height: 44px;
	padding-right: var(--space-2);
	font: var(--type-small);
	color: var(--text-secondary);
}
.legal__back:hover {
	color: var(--text-link);
}

.legal__brand {
	font: var(--fw-semibold) var(--fs-subtitle) / 1 var(--font-display);
	letter-spacing: -0.025em;
	color: var(--text-primary);
}

/* `.ga-card` da skill, com o padding maior de página de leitura. */
.legal__doc {
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
	.legal__doc {
		padding: var(--space-8);
	}
}

.legal__head {
	display: flex;
	flex-direction: column;
	gap: var(--space-1);
}
.legal__title {
	font: var(--type-page-title);
	letter-spacing: var(--ls-title);
}
.legal__meta {
	font: var(--type-small);
	color: var(--text-secondary);
}

/* ── Prosa ────────────────────────────────────────────────────────────────
 * Conteúdo vindo por slot: pertence ao escopo do pai, então todo seletor
 * daqui para baixo precisa de `:deep()`.
 */
.legal__prose {
	max-width: 68ch;
	color: var(--text-primary);
}

.legal__prose :deep(h2) {
	/* `--fs-title` (20px) para seção, uma escada abaixo do título da página. */
	font: var(--type-title);
	letter-spacing: var(--ls-title);
	margin-top: var(--space-8);
	margin-bottom: var(--space-3);
}
.legal__prose :deep(h2:first-child) {
	margin-top: 0;
}
.legal__prose :deep(h3) {
	font: var(--type-subtitle);
	margin-top: var(--space-5);
	margin-bottom: var(--space-2);
}

.legal__prose :deep(p) {
	font: var(--type-body-lg);
	/* Prosa longa pede entrelinha maior que a de interface. */
	line-height: 1.65;
	margin: 0 0 var(--space-3);
	color: var(--text-secondary);
}
.legal__prose :deep(p:last-child) {
	margin-bottom: 0;
}

.legal__prose :deep(ul) {
	margin: 0 0 var(--space-4);
	padding-left: var(--space-5);
	display: flex;
	flex-direction: column;
	gap: var(--space-2);
}
.legal__prose :deep(li) {
	font: var(--type-body-lg);
	line-height: 1.6;
	color: var(--text-secondary);
}

.legal__prose :deep(strong) {
	font-weight: var(--fw-semibold);
	color: var(--text-primary);
}

.legal__prose :deep(a) {
	color: var(--text-link);
	text-decoration: underline;
	text-underline-offset: 3px;
}

/*
 * Lacuna a preencher pelo responsável do app.
 *
 * Marcada com fundo, fio e a própria palavra "PREENCHER" — não só com cor,
 * porque cor sozinha não chega a quem não distingue laranja de cinza. Sai do
 * documento no dia em que a informação entrar.
 */
.legal-todo,
.legal__prose :deep(.legal-todo) {
	display: inline-block;
	padding: 0 var(--space-1);
	border: 1px dashed var(--feedback-warning);
	border-radius: var(--radius-xs);
	background: var(--feedback-warning-bg);
	color: var(--feedback-warning);
	font: var(--fw-medium) var(--fs-small) / 1.4 var(--font-ui);
	/* Quebra dentro do colchete em 375px, em vez de estourar a coluna. */
	overflow-wrap: anywhere;
}

.legal__foot {
	padding-top: var(--space-5);
	border-top: 1px solid var(--border-subtle);
	font: var(--type-small);
}
.legal__footLink {
	display: inline-flex;
	align-items: center;
	min-height: 44px;
	font: var(--fw-semibold) var(--fs-small) / 1.4 var(--font-ui);
	color: var(--text-link);
}
.legal__footLink:hover {
	text-decoration: underline;
	text-underline-offset: 3px;
}
</style>
