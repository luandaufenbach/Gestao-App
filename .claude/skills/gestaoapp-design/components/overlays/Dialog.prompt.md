Confirmation dialog — only for irreversible actions (delete account, remove member). Everything else should be undoable inline.

```jsx
<Dialog tone="danger" icon="trash-2" title="Excluir conta?" description="Isso remove permanentemente sua conta e todas as suas tarefas."
  actions={<><Button variant="ghost">Cancelar</Button><Button variant="danger" icon="trash-2">Excluir conta</Button></>} />
```
