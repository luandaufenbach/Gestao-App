Single health score vs a scale (saúde da sprint, SLA, satisfação). One gauge per card; pair with 2–3 supporting facts.

```jsx
<GaugeChart value={78} target={85} label="Saúde da sprint" zones={[
  { to: 60, color: 'var(--chart-negative)' }, { to: 80, color: 'var(--chart-warning)' }, { to: 100, color: 'var(--chart-positive)' }]} />
```
