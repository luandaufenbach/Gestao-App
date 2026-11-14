Pill-shaped action button — use `primary` for the single main action of a view (e.g. "Nova tarefa"), `secondary` beside it, `accent` (zest) only for completing/finishing.

```jsx
<Button icon="plus">Nova tarefa</Button>
<Button variant="secondary" icon="folder">Criar projeto</Button>
<Button variant="accent" icon="check">Concluir</Button>
<Button variant="dark" iconRight="arrow-right">Fazer upgrade</Button>
<Button variant="danger" icon="trash-2" size="sm">Excluir</Button>
```

- Sizes: sm 32px · md 40px · lg 48px (use lg on mobile primary actions).
- `glass` is for buttons placed over the sky gradient/photography.
- Press state scales to .97; disabled drops to 45% opacity and loses the glow.
