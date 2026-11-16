Schedules and overlap of projects/phases. Put it in a `ChartCard flush` so it runs edge to edge.

```jsx
<GanttChart start="2026-09-28" end="2026-11-22" today="2026-10-08" rows={[
  { label: 'Redesign do site', start: '2026-09-29', end: '2026-10-24', progress: 72, color: 'var(--chart-1)' },
  { label: 'Lançamento', start: '2026-10-27', milestone: true, color: 'var(--chart-target)' }]} />
```
