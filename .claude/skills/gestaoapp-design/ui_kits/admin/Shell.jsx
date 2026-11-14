const GA = window.GestaoAppDesignSystem_8ff7d0;

function useMedia(q) {
  const [m, setM] = React.useState(() => window.matchMedia(q).matches);
  React.useEffect(() => {
    const mq = window.matchMedia(q);
    const h = (e) => setM(e.matches);
    mq.addEventListener('change', h);
    setM(mq.matches);
    return () => mq.removeEventListener('change', h);
  }, [q]);
  return m;
}

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Painel', icon: 'layout-grid' },
  { id: 'tasks', label: 'Tarefas', icon: 'square-check' },
  { id: 'projects', label: 'Projetos', icon: 'folder' },
  { id: 'team', label: 'Equipe', icon: 'users' },
  { id: 'settings', label: 'Configurações', icon: 'settings' }
];
const TAB_ITEMS = [
  { value: 'dashboard', label: 'Início', icon: 'layout-grid' },
  { value: 'tasks', label: 'Tarefas', icon: 'square-check' },
  { value: 'projects', label: 'Projetos', icon: 'folder' },
  { value: 'team', label: 'Equipe', icon: 'users' }
];

function AppSidebar({ route, go, collapsed, onToggle, data, tasks }) {
  const { Sidebar, NavSection, NavItem, WorkspaceSwitcher, SearchField, IconButton, Avatar, Button } = GA;
  const u = data.user;
  const open = tasks.filter((t) => t.status !== 'done');
  return (
    <Sidebar collapsed={collapsed} onToggle={onToggle}
      header={<React.Fragment><WorkspaceSwitcher name={data.workspace} />{collapsed ? null : <SearchField size="sm" placeholder="Buscar" />}</React.Fragment>}
      footer={<React.Fragment>
        {collapsed ? null : (
          <div className="promo">
            <div className="promo__t">Upgrade para o Pro</div>
            <div className="promo__d">Projetos ilimitados, automações e relatórios.</div>
            <Button variant="accent" size="sm" block>Fazer upgrade</Button>
          </div>
        )}
        <button type="button" className="userchip" onClick={() => go('settings')} title={u.name}>
          <Avatar name={u.name} tone={u.tone} size="lg" status="online" />
          {collapsed ? null : <span className="userchip__meta"><span className="userchip__name">{u.name}</span><span className="userchip__mail">{u.email}</span></span>}
        </button>
      </React.Fragment>}>
      <NavSection label="Menu principal">
        {NAV_ITEMS.map((n) => (
          <NavItem key={n.id} icon={n.icon} label={n.label} active={route === n.id} count={n.id === 'tasks' ? open.length : undefined} onClick={() => go(n.id)} />
        ))}
      </NavSection>
      <NavSection label="Projetos" action={collapsed ? null : <IconButton icon="plus" label="Novo projeto" size="sm" onClick={() => go('projects')} />}>
        {data.projects.filter((p) => p.health !== 'done').map((p) => (
          <NavItem key={p.id} dot={p.color} label={p.name} count={open.filter((t) => t.project === p.id).length} onClick={() => go('tasks', { project: p.id })} />
        ))}
      </NavSection>
    </Sidebar>
  );
}

function MobileTopBar({ user, onBell, onAvatar }) {
  const { IconButton, Avatar } = GA;
  return (
    <header className="mtop">
      <span className="ga-wordmark">gestaoApp</span>
      <div className="mtop__end">
        <IconButton icon="bell" label="Notificações" variant="outline" shape="circle" dot onClick={onBell} />
        <button type="button" className="mtop__av" onClick={onAvatar} aria-label="Perfil e configurações">
          <Avatar name={user.name} tone={user.tone} size={36} />
        </button>
      </div>
    </header>
  );
}

function MobileTabBar({ route, go, onAdd }) {
  return <GA.TabBar items={TAB_ITEMS} value={route === 'settings' ? null : route} onChange={go} onAdd={onAdd} />;
}

Object.assign(window, { GA, useMedia, AppSidebar, MobileTopBar, MobileTabBar });
