Single-line text input with label/hint/error — settings forms, task title, member invite.

```jsx
<TextField label="Nome completo" defaultValue="Marina Alves" />
<TextField label="E-mail" icon="mail" placeholder="voce@empresa.com.br" />
<TextField label="Cargo" icon="user" error="Campo obrigatório" />
```

- `variant="sunken"` for fields that sit inside cards on mobile.
- Focus = cobalt border + 3px soft ring.
