Report KPI row (4 across desktop, 2 tablet, 1 phone). Number first, then direction, then context.

```jsx
<MetricCard label="Tarefas concluídas" value={186} delta={12.4} spark={[5,7,6,9,8,11,12]} />
<MetricCard label="Tempo médio de ciclo" value="2,4" unit="dias" delta={-8} invert spark={[3.1,2.9,2.8,2.6,2.4]} sparkVariant="line" />
<MetricCard variant="brand" label="Taxa de conclusão" value="87%" delta={3.1} deltaFormat="pp" spark={…} />
```
