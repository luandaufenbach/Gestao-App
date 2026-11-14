Detail side panel: "navigation left, work in the middle, details in a side drawer". Use `inline` on wide screens (≥1280) and `overlay` below that; on phones open the detail as a full screen instead.

```jsx
<Drawer mode="inline" onClose={close} headerActions={<IconButton icon="link" label="Copiar link" size="sm" />}
  footer={<><Button variant="accent" icon="check" size="sm">Concluir</Button><Button variant="secondary" icon="pencil" size="sm">Editar</Button><Button variant="danger" icon="trash-2" size="sm">Excluir</Button></>}>
  …
</Drawer>
```
