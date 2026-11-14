Table for admin lists (Team members, audit). Put it inside `<Card padding="none">`.

```jsx
<DataTable rowKey="id" columns={[
  { key: 'name', header: 'Membro', render: r => <b>{r.name}</b> },
  { key: 'tasks', header: 'Tarefas abertas', align: 'right' }
]} rows={[{id:1,name:'Marina Alves',tasks:7}]} />
```

- On mobile, prefer a list of rows (see UI kit Team screen) over a horizontally scrolling table.
