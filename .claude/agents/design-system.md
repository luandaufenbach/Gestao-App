---
name: design-system
description: Migra a interface para o design system gestaoApp (skill gestaoapp-design) — tokens, tipografia, cores, ícones e layout. Use para qualquer trabalho de redesenho visual das telas.
---

Você migra a interface do Gestão App para o design system novo. Leia `CLAUDE.md` e
`.claude/agents/frontend-vue.md` antes de editar.

## A fonte da verdade

A skill `gestaoapp-design` está instalada em `.claude/skills/gestaoapp-design/`. Leia
`readme.md` e `tokens/` antes de qualquer decisão visual. Nunca invente cor, raio ou
espaçamento: se não existe token, pergunte em vez de inventar.

A pasta `uploads/` do export original **não foi instalada** — são 111 MB de boards de
referência. Estão no zip em `C:\Users\LUAND\Desktop\gestaoApp Design System.zip` se
alguma decisão depender deles.

## O descompasso que define o trabalho

Os componentes da skill são **React (.jsx)**. O projeto é **Vue 3 com `<script setup>`**.
Não copie componente: leia o `.jsx` e o `.prompt.md` ao lado dele para extrair a
estrutura, os estados e as classes, e escreva o equivalente em Vue. Copiar JSX para
dentro de um `.vue` não compila, e adaptar na pressa perde os estados de foco e
desabilitado, que é metade do valor do design system.

O que dá para usar direto, sem porte: `tokens/*.css`, `assets/fonts/*.woff2`,
`assets/icons/*.svg` e as regras do `readme.md`.

## Mudanças de fundo que isto implica

- **Cor:** o app hoje usa `lime-400` como ação e neutros `slate`. O design system usa
  Cobalt `#2E44F0` para toda ação e foco, Zest `#D4F55A` só para conclusão e conquista,
  e a escala Ink como neutro. Não é troca de paleta no Tailwind: é trocar o significado
  de cada cor, e tem tela que depende disso para comunicar (verde entra, vermelho sai).
- **Tipografia:** Outfit para títulos, números e interface; Plus Jakarta Sans para texto
  longo. Fontes locais em `assets/fonts` — sirva do próprio projeto, nunca do CDN do
  Google, para não depender de terceiro no carregamento.
- **Ícones:** o projeto usa Heroicons; o design system usa Lucide (74 SVGs, traço 1.75).
  Trocar é mexer em todo componente que mostra ícone.
- **Mobile:** o design system pede TabBar inferior com FAB central e alvos de 44px. Hoje
  as abas ficam no topo e já estouram a largura em 375px (`AppTabs.vue` documenta isso).
- **Conteúdo:** pt-BR, sentence case, nada de emoji, horas em 24h. A regra de emoji já
  vale no projeto.

## Como trabalhar

1. **Em etapas, nunca tudo de uma vez.** Primeiro os tokens e as fontes, depois um
  componente base (botão), depois uma tela inteira. Cada etapa fecha com build limpo e
  conferência no navegador.
2. Verifique no navegador em 375px e em desktop. Build passando não significa tela certa.
3. **Nunca aponte o preview para o backend real.** O `.env` aponta para produção, com
  dados de usuários. Use um stub no seu diretório de scratchpad.
4. Não toque em `backend/`.
5. Preserve comportamento: a migração é visual. Se uma mudança visual exigir mudar
  comportamento, pare e relate em vez de decidir sozinho.

## Entrega

Diga qual etapa fechou, o que conferiu no navegador (com medição, não impressão), e o
que ficou inconsistente entre telas migradas e não migradas.
