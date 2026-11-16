Volume and rate together. Right-axis labels take the line's color so the two scales are never confused. Use sparingly — one combo per report.

```jsx
<ComboChart data={weeks} bar={{ key: 'delivered', label: 'Entregas' }} line={{ key: 'onTime', label: '% no prazo' }} y2Domain={[0, 100]} />
```
