Wrap every chart in a ChartCard: one question per card (title), one headline number, the chart, and where the data comes from.

```jsx
<ChartCard title="Tarefas concluídas" subtitle="Últimos 30 dias" value={186} delta={12.4} comparison="vs 30 dias anteriores"
  actions={<SegmentedControl size="sm" … />}
  legend={[{ key:'done', label:'Concluídas', color:'var(--chart-1)' }, { key:'prev', label:'Período anterior', color:'var(--chart-comparison)', dashed:true }]}
  hidden={hidden} onToggleLegend={toggle}
  footer={<><span>Fonte: tarefas</span><span>Atualizado há 5 min</span></>}>
  <LineChart … hidden={hidden} />
</ChartCard>
<ChartCard title="Horas por projeto" state="loading" height={240} />
<ChartCard title="Horas por projeto" state="empty" height={240} />
<ChartCard title="Horas por projeto" state="error" onRetry={reload} height={240} />
```

- Always set `height` to the chart's height so states don't shift layout.
- Title is a question/claim in sentence case ("Concluídas por semana"), never "Gráfico 1".
