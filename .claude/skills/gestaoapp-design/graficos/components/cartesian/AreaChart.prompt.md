Volume over time; `stacked` to show how a total splits by category (max 4 layers, darkest at the bottom).

```jsx
<AreaChart data={rows} series={[{ key: 'done', label: 'Concluídas' }]} highlightLast />
<AreaChart stacked data={rows} series={[
  { key: 'design', label: 'Design' }, { key: 'dev', label: 'Desenvolvimento' }, { key: 'content', label: 'Conteúdo' }
]} yFormat="hours" />
```
