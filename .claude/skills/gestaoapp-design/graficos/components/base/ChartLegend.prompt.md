Legend row above a chart. Interactive when `onToggle` is passed — keeps at least the meaning visible (struck-through, 45% opacity) instead of removing the item.

```jsx
const [hidden, setHidden] = React.useState([]);
const toggle = k => setHidden(h => h.includes(k) ? h.filter(x => x !== k) : [...h, k]);
<ChartLegend hidden={hidden} onToggle={toggle} items={[
  { key: 'done', label: 'Concluídas', color: 'var(--chart-1)' },
  { key: 'created', label: 'Criadas', color: 'var(--chart-2)', shape: 'line' },
  { key: 'prev', label: 'Período anterior', color: 'var(--chart-comparison)', dashed: true }
]} />
<LineChart hidden={hidden} … />
```
