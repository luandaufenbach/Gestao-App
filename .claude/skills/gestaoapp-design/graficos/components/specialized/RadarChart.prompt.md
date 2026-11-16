Shape of a profile, not exact values. Max 2 series (current solid, comparison dashed); 5–8 axes.

```jsx
<RadarChart axes={['Design','Desenvolvimento','Conteúdo','Reuniões','Revisão','Gestão']} format="hours"
  series={[{ label: 'Sprint atual', values: [42, 30, 18, 14, 22, 10] }, { label: 'Sprint anterior', values: [36, 34, 12, 20, 16, 12], color: 'var(--chart-comparison)', dashed: true }]} />
```
