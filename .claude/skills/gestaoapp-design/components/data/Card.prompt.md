Base container for every dashboard panel — white with hairline border and radius 14.

```jsx
<Card title="Progresso semanal" subtitle="Tarefas concluídas por dia" actions={<Badge tone="success">+18%</Badge>}>…</Card>
<Card variant="inverse">Upgrade para o Pro</Card>
<Card variant="dashed" interactive>+ Criar projeto</Card>
```

- `brand` (solid cobalt) is reserved for the single hero metric (weekly goal); `accent` (zest) for celebratory/"done" moments; `inverse` for promos.
