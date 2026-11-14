KPI tile for the dashboard top row — one number, one context line, no charts.

```jsx
<StatCard icon="calendar" label="Vencem hoje" value="3" delta="1 atrasada" deltaTrend="down" onMore={fn} />
<StatCard icon="square-check" tone="success" label="Concluídas na semana" value="24" delta="18% vs semana passada" deltaTrend="up" />
<StatCard icon="zap" tone="warning" label="Em andamento" value="9" caption="em 4 projetos" />
```
