Composition of one total (status, tipo, canal). Max 6 slices — group the tail into "Outros". Order largest first, except workflow states which keep their natural order.

```jsx
<DonutChart centerLabel="Tarefas" data={[
  { label: 'A fazer', value: 42, color: 'var(--chart-status-todo)' },
  { label: 'Em andamento', value: 31, color: 'var(--chart-status-progress)' },
  { label: 'Em revisão', value: 14, color: 'var(--chart-status-review)' },
  { label: 'Concluída', value: 161, color: 'var(--chart-status-done)' }]} />
<DonutChart variant="pie" legend="bottom" size={160} data={…} />
```
