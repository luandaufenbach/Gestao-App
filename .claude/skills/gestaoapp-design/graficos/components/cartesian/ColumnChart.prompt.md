Compare amounts across a few periods/categories (≤ 12 columns; more → LineChart). Top corners rounded 6px; current period in zest.

```jsx
<ColumnChart data={weeks} series={[{ key: 'done', label: 'Concluídas' }]} highlight={weeks.length - 1} showValues />
<ColumnChart mode="stacked" data={weeks} series={[
  { key: 'high', label: 'Alta', color: 'var(--chart-priority-high)' },
  { key: 'medium', label: 'Média', color: 'var(--chart-priority-medium)' },
  { key: 'low', label: 'Baixa', color: 'var(--chart-priority-low)' }]} />
<ColumnChart mode="grouped" data={months} series={[{ key: 'planned', label: 'Planejado', color: 'var(--chart-seq-2)' }, { key: 'real', label: 'Realizado' }]} yFormat="hours" />
```
