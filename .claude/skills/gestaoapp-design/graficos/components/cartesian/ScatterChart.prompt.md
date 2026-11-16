Correlation/prioritization. Name both axes; quadrant labels turn the chart into a decision ("Ganhos rápidos").

```jsx
<ScatterChart bubble xLabel="Esforço (h)" yLabel="Impacto" xFormat="hours"
  quadrants={{ x: 80, y: 5, labels: ['Ganhos rápidos', 'Grandes apostas', 'Baixa prioridade', 'Reavaliar'] }}
  groups={[{ key: 'web', label: 'Web' }, { key: 'mkt', label: 'Marketing' }]}
  points={[{ x: 40, y: 8, size: 12, label: 'Redesign do site', group: 'web' }]} />
```
