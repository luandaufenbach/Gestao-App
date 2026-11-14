<script setup>
/**
 * Casca das telas de dentro da sessão (ROADMAP 1.4 — esqueleto de navegação).
 *
 * MOTIVO: Dashboard, Transações, Metas, Projeção e Conta repetiam o mesmo
 * `div > Navbar + main` com CSS escopado quase igual — cinco cópias de
 * `min-height: 100vh`, `max-width: var(--content-max)`, `padding` e os dois
 * `@media (min-width: 768px)`. Cada tela nova era mais uma cópia, e qualquer
 * mudança de esqueleto exigia editar cinco arquivos. Esta é a única casca;
 * as telas entregam só o conteúdo.
 *
 * A consolidação veio junto com a sidebar porque é a mudança que troca o
 * esqueleto de TODAS as telas de uma vez: não existe estado intermediário em
 * que metade delas tenha sidebar e a outra metade não.
 *
 * ── Como o esqueleto muda com a largura ──────────────────────────────────
 *
 * A skill define duas formas, com corte em 768px:
 *
 *   ≥ 768px  sidebar (248px, trilho de 72 entre 768 e 1023) + conteúdo.
 *            NENHUMA barra de topo: ver a decisão sobre a navbar abaixo.
 *   < 768px  barra de topo fina (marca · conta · sair) + conteúdo +
 *            `GaTabBar` inferior com o FAB central.
 *
 * As abas de topo (`AppTabs.vue`) não sobrevivem em nenhuma das duas faixas, e
 * o arquivo saiu. Eram elas que estouravam a largura em 375px — o próprio
 * componente documentava os 348px de pílula contra 342px de tela.
 *
 * ── A navbar de topo no desktop: SAI ─────────────────────────────────────
 *
 * Com a sidebar, a barra de topo do desktop passava a repetir a marca e os dois
 * mesmos destinos (conta e sair) a 248px de distância deles. Seriam duas
 * navegações concorrentes para o mesmo conjunto de destinos, que é exatamente o
 * que a tarefa proíbe — e a skill não desenha barra de topo no desktop: o shell
 * dela é "sidebar 248px · content (max 1440, pad 28)", e o que ocupa o topo do
 * conteúdo é o `PageHeader` de cada tela, que estas telas já têm (o `<h1>` de
 * Metas, de Projeção e de Conta; a navegação de mês do Dashboard).
 *
 * Abaixo de 768px a barra de topo FICA, porque a skill a mantém ali de
 * propósito ("<768: top bar (wordmark · bell · avatar→settings)") e porque
 * "Minha conta" e "Sair" não cabem na `GaTabBar`: ela tem quatro destinos e o
 * FAB, e uma quinta aba repetiria o aperto de largura que acabou de sair.
 * Então a `navbar.vue` não foi apagada — virou a barra de topo SÓ do celular,
 * e o desktop ganhou os mesmos dois destinos no rodapé da sidebar.
 */
import { defineAsyncComponent, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import GaNavItem from "@/design-system/components/GaNavItem.vue";
import GaNavSection from "@/design-system/components/GaNavSection.vue";
import GaSidebar from "@/design-system/components/GaSidebar.vue";
import GaTabBar from "@/design-system/components/GaTabBar.vue";
import Navbar from "./navbar.vue";
import { useAuth } from "../stores/auth";
import { usePageAction } from "../stores/pageAction";
import { useSidebar } from "../services/useSidebar";

/**
 * Os quatro destinos do app, na ordem em que as abas de topo os mostravam.
 *
 * Os caminhos são os MESMOS de `AppTabs.vue`: nenhuma rota foi criada, renomeada
 * ou removida nesta etapa. "Minha conta" fica fora da lista pelo mesmo motivo de
 * sempre (ver o comentário da `navbar.vue`): não é uso diário, e na barra
 * inferior do celular só há lugar para quatro.
 *
 * Os ícones vêm dos 74 Lucide da skill:
 *   layout-grid   é o que o `Sidebar.prompt.md` usa para o painel;
 *   list          é a lista de lançamentos — `repeat` seria enganoso, porque
 *                 recorrência e parcelamento já significam outra coisa aqui;
 *   target        é a meta;
 *   chart-column  é a série de barras por mês da projeção. `trending-up` diria
 *                 "crescendo", e o que a tela mostra é dinheiro a sair;
 *   trending-up   é o relatório, que é justamente a linha do tempo: a série
 *                 sobe e desce com os meses já vividos.
 *
 * O quinto destino entrou na lista inteira, sidebar E barra inferior: abaixo
 * de 768px a sidebar não existe, então deixar Relatórios só nela tornaria a
 * tela inalcançável no celular — chegável apenas digitando a URL.
 */
/**
 * Carregamento sob demanda, e não `import` normal.
 *
 * A casca está no bundle de entrada, então um import direto arrastaria o modal
 * inteiro — campos do formulário, `GaModal`, `useTransactionForm` — para o
 * pacote que a TELA DE LOGIN baixa. Medido: 31,7 kB a mais no chunk de entrada
 * (10,4 kB após gzip) e 10,8 kB a mais de CSS. Assim ele chega no primeiro
 * clique do FAB sem ação registrada, que é quando ele existe.
 */
const NewTransactionalModal = defineAsyncComponent(() => import("./NewTransactionalModal.vue"));

const DESTINATIONS = [
  { to: "/dashboard", label: "Dashboard", icon: "layout-grid" },
  { to: "/transactions", label: "Transações", icon: "list" },
  { to: "/goals", label: "Metas", icon: "target" },
  { to: "/projection", label: "Projeção", icon: "chart-column" },
  { to: "/reports", label: "Relatórios", icon: "trending-up" },
];

const router = useRouter();
const route = useRoute();
const { user, logout } = useAuth();
const { pageAction } = usePageAction();
const { rail, toggle } = useSidebar();

function handleLogout() {
  logout();
  router.replace("/login");
}

/** Modal de reserva do FAB: ver `runPageAction`. */
const showNewTransaction = ref(false);

/**
 * O FAB dispara a ação de criar registrada pela tela aberta.
 *
 * Sem registro — hoje só "Minha conta", e a janela de um tick antes de a
 * primeira tela montar —, cai em "Nova transação", que é a ação principal do
 * app. O modal é desta casca de propósito: a tela de conta trata de exportar e
 * excluir dados e não precisa saber o que é uma transação, e nada nela muda
 * quando uma é criada. Ver `stores/pageAction.js`.
 */
function runPageAction() {
  if (pageAction.value) {
    pageAction.value.run();
    return;
  }

  showNewTransaction.value = true;
}
</script>

<template>
  <div class="shell">
    <!--
      `aria-hidden` não entra aqui: a sidebar está oculta por `display: none`
      abaixo de 768px, o que já a tira da árvore de acessibilidade.
    -->
    <div class="shell__aside">
      <GaSidebar brand="Gestão App" :collapsed="rail" @toggle="toggle">
        <GaNavSection label="Menu principal">
          <GaNavItem
            v-for="item in DESTINATIONS"
            :key="item.to"
            :to="item.to"
            :icon="item.icon"
            :label="item.label"
          />
        </GaNavSection>

        <template #footer>
          <!--
            O nome de quem está logado só existia na navbar, e a navbar não
            aparece no desktop: sem esta linha ele desapareceria da tela grande.
            Em sentence case, como a skill pede — nome de pessoa não é micro
            rótulo e não vai para caixa alta.
          -->
          <p v-if="user" class="shell__user">{{ user.name }}</p>

          <GaNavSection>
            <GaNavItem to="/plans" icon="star" label="Plano" />
            <GaNavItem to="/account" icon="user" label="Minha conta" />
            <GaNavItem icon="log-out" label="Sair" @click="handleLogout" />
          </GaNavSection>
        </template>
      </GaSidebar>
    </div>

    <div class="shell__content">
      <Navbar class="shell__topbar" />

      <main class="shell__main">
        <slot />
      </main>
    </div>

    <GaTabBar
      class="shell__tabbar"
      :items="DESTINATIONS"
      :add-label="pageAction?.label ?? 'Nova transação'"
      :show-fab="!route.meta.hideFab"
      @add="runPageAction"
    />

    <!--
      Sem ano/mês: o modal já sugere a data de hoje quando não recebe nenhum, e
      a casca não tem navegação de mês para consultar.
    -->
    <NewTransactionalModal
      v-if="showNewTransaction"
      @close="showNewTransaction = false"
      @transaction-created="showNewTransaction = false"
    />
  </div>
</template>

<style scoped>
.shell {
  display: flex;
  min-height: 100vh;
  background: var(--bg-app);
  color: var(--text-primary);
  font: var(--type-body);
}

/* ── Sidebar ───────────────────────────────────────────────────────────── */
/*
 * A faixa de 768px para cima. Abaixo disso a navegação é a barra inferior, e a
 * sidebar sai da árvore inteira — não fica escondida fora da tela.
 */
.shell__aside {
  display: none;
}
@media (min-width: 768px) {
  .shell__aside {
    display: block;
    /*
		 * Presa no topo e com a altura da janela: a sidebar não rola com o
		 * conteúdo, e o `overflow-y: auto` dela passa a ter altura de referência
		 * (sem isto, `height: 100%` da `.ga-sidebar` não resolve para nada).
		 */
    position: sticky;
    top: 0;
    height: 100vh;
    flex-shrink: 0;
    z-index: var(--z-sidebar);
  }
}

.shell__user {
  padding: 0 var(--space-2-5);
  font: var(--type-caption);
  color: var(--text-tertiary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
/*
 * Recolhida, a sidebar tem 72px: não cabe nome nenhum. A classe
 * `.ga-sidebar--collapsed` é do `GaSidebar`, mas o escopo alcança: o atributo
 * de escopo é posto também no elemento raiz do componente filho.
 */
.ga-sidebar--collapsed .shell__user {
  display: none;
}

/* ── Conteúdo ──────────────────────────────────────────────────────────── */
.shell__content {
  flex: 1;
  /* Sem isto, uma tabela ou um nome longo dentro do conteúdo alarga o flex
	   item e aparece rolagem horizontal na página. */
  min-width: 0;
}

/* A barra de topo é só do celular — ver a decisão no comentário do script. */
@media (min-width: 768px) {
  .shell__topbar {
    display: none;
  }
}

.shell__main {
  max-width: var(--content-max);
  margin: 0 auto;
  padding: var(--space-6) var(--page-pad-mobile);
}
@media (min-width: 768px) {
  .shell__main {
    padding: var(--space-8) var(--page-pad);
  }
}

/*
 * A BARRA INFERIOR NÃO PODE COBRIR CONTEÚDO.
 *
 * Ela é `position: fixed`, então não ocupa espaço no fluxo: sem este
 * `padding-bottom` o último item de qualquer tela ficaria embaixo dela no fim
 * da rolagem. A conta é a altura da barra (`--tabbar-height`, 72) mais a faixa
 * do sistema que ela respeita no próprio padding (`env(safe-area-inset-bottom)`,
 * 0 em navegador de mesa), mais um `--space-6` de respiro — o mesmo espaço que
 * separa o conteúdo do topo.
 */
@media (max-width: 767px) {
  .shell__main {
    padding-bottom: calc(var(--space-6) + var(--tabbar-height) + env(safe-area-inset-bottom));
  }
}

/* ── Barra inferior ────────────────────────────────────────────────────── */
.shell__tabbar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  /* A mesma camada da sidebar: as duas são chrome de navegação, e as duas
	   ficam ABAIXO do modal (`--z-modal`, 60) e do diálogo. */
  z-index: var(--z-sidebar);
}
@media (min-width: 768px) {
  .shell__tabbar {
    display: none;
  }
}
</style>
