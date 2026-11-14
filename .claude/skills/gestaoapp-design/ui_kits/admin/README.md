# gestaoApp — Admin UI kit

Click-through recreation of the gestaoApp admin web app, one responsive codebase:

- **Desktop (≥1024)**: Sidebar (workspace switcher, search, nav, project list, upgrade promo, user chip) · page content · task detail Drawer (inline ≥1280, overlay 768–1279).
- **Tablet (768–1023)**: sidebar auto-collapses to the 72px icon rail.
- **Mobile (<768)**: top bar (wordmark, bell, avatar → settings) · bottom TabBar with center "+" · stacked task rows · horizontally scrolling KPI strip · full-screen task detail · BottomSheet for new task.

`index.html` = the app (open `#dashboard`, `#tasks`, `#projects`, `#team`, `#settings`). `mobile.html` = the same file in two 390×844 phone frames.

## Files
- `Shell.jsx` — useMedia, AppSidebar, MobileTopBar, MobileTabBar
- `Dashboard.jsx` — greeting header, KPI row + GoalCard, today's tasks, team workload, weekly chart, active projects
- `Tasks.jsx` — list (grouped Atrasadas/Hoje/Amanhã/Esta semana/Concluídas) and board (status columns), filter chips
- `TaskDetail.jsx` — Drawer / mobile full-screen detail, subtasks, activity; NewTaskForm
- `Projects.jsx`, `Team.jsx` (DataTable desktop / list mobile), `Settings.jsx` (Perfil, Notificações, Workspace, danger zone)
- `App.jsx` — routing, state, toasts · `data.js` — pt-BR sample data · `kit.css` — screen layout only

## Interactions
Check a task → zest toast + weekly goal ticks up. Click a row → detail drawer. "+"/Nova tarefa → dialog (desktop) or bottom sheet (mobile). Settings › Excluir → confirm dialog. Sidebar chevron collapses the rail.
