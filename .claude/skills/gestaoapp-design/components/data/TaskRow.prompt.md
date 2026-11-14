One task in a list. Use `layout="row"` on desktop and `layout="stacked"` under ~640px — same data, nothing hidden except the text label of the priority.

```jsx
<TaskRow title="Finalizar design do site" project="Redesign do site" projectColor="var(--project-1)" time="10:00" priority="high" assignee={{name:'Marina Alves', tone:'cobalt'}} onToggle={fn} onMore={fn} />
<TaskRow layout="stacked" title="Revisar feedback do cliente" project="Vídeo da marca" projectColor="var(--project-2)" time="13:30" priority="medium" assignee="João Kim" />
<TaskRow done title="Preparar notas da sprint" project="Marketing" projectColor="var(--project-4)" time="09:00" priority="low" />
```

- Done rows go sunken + gray title (no strikethrough — strikethrough is for subtasks).
- `selected` outlines in cobalt while its detail drawer is open.
