Trend over time (days, weeks, months). Use for continuous series; ≤4 lines; previous period as `dashed`.

```jsx
<LineChart height={240} data={rows} xKey="label" yFormat="number" highlightLast
  series={[
    { key: 'done', label: 'Concluídas', color: 'var(--chart-1)', area: true },
    { key: 'created', label: 'Criadas', color: 'var(--chart-2)' },
    { key: 'prev', label: 'Período anterior', color: 'var(--chart-comparison)', dashed: true }
  ]}
  references={[{ value: 8, label: 'Meta diária' }]} />
```

- Burndown: `series=[{key:'ideal', dashed:true}, {key:'real'}]`, `curve="linear"`.
- Missing future values = `null` (line stops at "hoje").
- Y axis always starts at 0 for counts; pass `yDomain` only for rates.
