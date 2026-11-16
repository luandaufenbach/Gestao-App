Signed variation chip next to KPIs — the color means good/bad, not up/down (use `invert` when lower is better).

```jsx
<TrendDelta value={12.4} />                 {/* +12,4% green */}
<TrendDelta value={-8} invert />            {/* −8% green: ciclo mais rápido */}
<TrendDelta value={2} format="number" invert variant="text" />  {/* +2 red: mais atrasos */}
<TrendDelta value={3.1} format="pp" size="sm" />
```
