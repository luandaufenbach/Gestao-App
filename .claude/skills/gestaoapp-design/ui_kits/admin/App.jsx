const ROUTES = ['dashboard', 'tasks', 'projects', 'team', 'settings'];

function App() {
  const data = window.GA_DATA;
  const isMobile = useMedia('(max-width: 767px)');
  const wide = useMedia('(min-width: 1280px)');
  const narrow = useMedia('(max-width: 1023px)');
  const initial = (location.hash || '').replace('#', '');
  const [route, setRoute] = React.useState(ROUTES.indexOf(initial) >= 0 ? initial : 'dashboard');
  const [tasks, setTasks] = React.useState(data.tasks);
  const [sel, setSel] = React.useState(null);
  const [newOpen, setNewOpen] = React.useState(false);
  const [confirm, setConfirm] = React.useState(false);
  const [toast, setToast] = React.useState(null);
  const [userCollapsed, setUserCollapsed] = React.useState(false);
  const [projectFilter, setProjectFilter] = React.useState(null);
  const scrollRef = React.useRef(null);

  React.useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 3200); return () => clearTimeout(t); }, [toast]);

  const go = (r, opts) => {
    setRoute(r); setSel(null);
    setProjectFilter(opts && opts.project ? opts.project : null);
    try { history.replaceState(null, '', '#' + r); } catch (e) {}
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  };
  const toggle = (id) => {
    const t = tasks.find((x) => x.id === id);
    const done = t.status !== 'done';
    setTasks(tasks.map((x) => (x.id === id ? Object.assign({}, x, { status: done ? 'done' : 'todo' }) : x)));
    if (done) setToast({ tone: 'success', title: t.title, description: 'Concluída agora · +1 na meta semanal' });
  };
  const sub = (id, i) => setTasks(tasks.map((x) => (x.id === id ? Object.assign({}, x, { subtasks: x.subtasks.map((s, j) => (j === i ? { t: s.t, done: !s.done } : s)) }) : x)));
  const del = (id) => { setTasks(tasks.filter((x) => x.id !== id)); setSel(null); setToast({ tone: 'danger', icon: 'trash-2', title: 'Tarefa excluída', description: 'Você pode desfazer em até 10 s.' }); };
  const create = (f) => {
    const id = 't' + Date.now();
    const when = { today: '18:00', tomorrow: 'qui, 9 out', week: 'sex, 10 out' }[f.due];
    const dueLabel = { today: 'Hoje · 18:00', tomorrow: 'Amanhã · qui, 9 out', week: 'sex, 10 out' }[f.due];
    setTasks([{ id, title: f.title, project: f.project, due: f.due, when, dueLabel, priority: f.priority, assignee: data.user.id, status: 'todo', desc: 'Sem descrição.', subtasks: [] }].concat(tasks));
    setNewOpen(false);
    setToast({ tone: 'brand', icon: 'plus', title: 'Tarefa criada', description: f.title });
  };
  const copy = () => setToast({ tone: 'info', icon: 'link', title: 'Link copiado', description: 'Cole em qualquer conversa.' });

  const selTask = sel ? tasks.find((t) => t.id === sel) : null;
  const drawerInline = !isMobile && wide && selTask;
  const compactRows = isMobile || (drawerInline && route === 'dashboard');
  const common = { data, tasks, isMobile, compactRows, go, onOpen: setSel, onToggle: toggle, onNew: () => setNewOpen(true), selectedId: sel };

  let screen;
  if (route === 'tasks') screen = <TasksScreen {...common} projectFilter={projectFilter} setProjectFilter={setProjectFilter} />;
  else if (route === 'projects') screen = <ProjectsScreen {...common} onNewProject={() => setToast({ tone: 'info', icon: 'folder-plus', title: 'Novo projeto', description: 'Modelos em breve neste protótipo.' })} />;
  else if (route === 'team') screen = <TeamScreen {...common} onInvite={() => setToast({ tone: 'brand', icon: 'mail', title: 'Convite enviado', description: 'bia@estudionorte.com.br' })} />;
  else if (route === 'settings') screen = <SettingsScreen {...common} onSaved={() => setToast({ tone: 'success', title: 'Alterações salvas' })} onDeleteAccount={() => setConfirm(true)} />;
  else screen = <DashboardScreen {...common} />;

  const drawerProps = { task: selTask, data, onClose: () => setSel(null), onToggle: toggle, onDelete: del, onSub: sub, onCopy: copy };

  return (
    <div className={'app' + (drawerInline ? ' has-drawer' : '')}>
      {isMobile ? null : <AppSidebar route={route} go={go} data={data} tasks={tasks} collapsed={userCollapsed || narrow} onToggle={() => setUserCollapsed(!userCollapsed)} />}
      <div className="app__main">
        {isMobile ? <MobileTopBar user={data.user} onAvatar={() => go('settings')} onBell={() => setToast({ tone: 'info', title: 'Reunião de equipe', description: 'em 15 min · Google Meet' })} /> : null}
        <div className="app__body">
          <main className="app__scroll" ref={scrollRef} data-screen-label={route}>{screen}</main>
          {drawerInline ? <div className="app__drawer"><TaskDrawer {...drawerProps} mode="inline" /></div> : null}
        </div>
        {isMobile ? <MobileTabBar route={route} go={go} onAdd={() => setNewOpen(true)} /> : null}
      </div>
      {!isMobile && !wide && selTask ? <TaskDrawer {...drawerProps} mode="overlay" /> : null}
      {isMobile && selTask ? <MobileTaskDetail {...drawerProps} /> : null}
      {newOpen ? (isMobile
        ? <GA.BottomSheet title="Nova tarefa" onClose={() => setNewOpen(false)}><NewTaskForm data={data} isMobile onSubmit={create} onCancel={() => setNewOpen(false)} /></GA.BottomSheet>
        : <GA.Dialog icon="square-check" title="Nova tarefa" description="Adicione ao painel em segundos." onClose={() => setNewOpen(false)}><NewTaskForm data={data} onSubmit={create} onCancel={() => setNewOpen(false)} /></GA.Dialog>) : null}
      {confirm ? <GA.Dialog tone="danger" icon="trash-2" title="Excluir conta?" description="Isso remove permanentemente sua conta e todas as suas tarefas. Esta ação não pode ser desfeita." onClose={() => setConfirm(false)}
        actions={<React.Fragment><GA.Button variant="ghost" onClick={() => setConfirm(false)}>Cancelar</GA.Button><GA.Button variant="danger" icon="trash-2" onClick={() => setConfirm(false)}>Excluir conta</GA.Button></React.Fragment>} /> : null}
      {toast ? <div className="toastwrap" key={toast.title + toast.description}><GA.Toast tone={toast.tone} icon={toast.icon} title={toast.title} description={toast.description} action={<GA.IconButton icon="x" label="Fechar" size="sm" onClick={() => setToast(null)} />} /></div> : null}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
