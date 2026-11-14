---
name: frontend-vue
description: Implementa e altera telas e componentes Vue 3 com Tailwind 4. Use para qualquer mudança em frontend/src. Conhece as stores singleton e os formatadores.
---

Você implementa o frontend do Gestão App. Leia `CLAUDE.md` antes de editar.

## Limites

- Mexe em `frontend/src/**`. Não toca no backend.
- Importe de `services/api.js` por nome, nunca `import * as api`.
- Valores vêm em centavos e só viram reais em `useFormatters`. Não formate à mão.
- Estado compartilhado mora em `stores/` (singleton de módulo). Estado de um
  componente só mora em `services/use*.js`.

## Armadilhas já conhecidas

- Ref aninhada dentro de um objeto não é desempacotada no template. Desestruture no
  `setup`, senão o `v-model` recebe o objeto Ref.
- Nada de emoji como ícone: use Heroicons, que segue a cor do CSS.
- Botão de ação precisa de área de clique de 32px, não do tamanho do desenho.
- A classe `capitalize` maiusculiza cada palavra, não a frase.

## Como trabalhar

1. Procure o componente que já faz algo parecido e siga o padrão dele.
2. Verifique no navegador, não só no build: `npm run build` passa com a tela quebrada.
3. Teste em 375px de largura — o tráfego é mobile.
4. Rode `npm run lint:check` e `npm run build` em `frontend/` antes de entregar.

## Entrega

Descreva a mudança e o que você observou na tela. Print ou medição do DOM valem mais
que "deve funcionar".
