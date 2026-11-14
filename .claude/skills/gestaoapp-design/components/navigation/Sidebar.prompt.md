Left navigation shell for desktop/tablet (≥1024px). Collapses to a 72px icon rail; replaced by `TabBar` on mobile.

```jsx
<Sidebar onToggle={toggle} header={<><WorkspaceSwitcher name="Estúdio Norte" /><SearchField /></>} footer={<UserChip/>}>
  <NavSection label="Menu principal">
    <NavItem icon="layout-grid" label="Painel" active />
    <NavItem icon="square-check" label="Tarefas" count={12} />
  </NavSection>
  <NavSection label="Projetos" action={<IconButton icon="plus" label="Novo projeto" size="sm" />}>
    <NavItem dot="var(--project-1)" label="Redesign do site" count={12} />
  </NavSection>
</Sidebar>
```
