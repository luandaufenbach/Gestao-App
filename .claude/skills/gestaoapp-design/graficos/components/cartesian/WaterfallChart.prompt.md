Explain a change between two totals. Totals cobalt; steps green/red by good/bad (`invert` for costs/hours).

```jsx
<WaterfallChart yFormat="hours" invert steps={[
  { label: 'Planejado', value: 320, total: true },
  { label: 'Escopo novo', value: 46 }, { label: 'Retrabalho', value: 18 }, { label: 'Automação', value: -24 },
  { label: 'Realizado', total: true }]} />
```
