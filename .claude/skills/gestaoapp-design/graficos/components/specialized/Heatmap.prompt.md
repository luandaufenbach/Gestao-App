Patterns across two time dimensions. 5 cobalt steps + empty; never rainbow scales.

```jsx
<Heatmap rows={['seg','ter','qua','qui','sex']} cols={['8h','9h','10h','11h','12h','13h','14h','15h','16h','17h','18h']} values={matrix} format="number" />
{/* Calendar: rows = weekdays, cols = weeks */}
<Heatmap rows={['S','T','Q','Q','S','S','D']} cols={weekLabels} values={byDay} maxCell={16} cellGap={3} />
```
