Bottom tab bar for screens under 768px — 4 destinations split around a center add button.

```jsx
<TabBar value={tab} onChange={setTab} onAdd={openNewTask} items={[
  {value:'home',label:'Início',icon:'layout-grid'},{value:'tasks',label:'Tarefas',icon:'square-check'},
  {value:'projects',label:'Projetos',icon:'folder'},{value:'team',label:'Equipe',icon:'users'}]} />
```
