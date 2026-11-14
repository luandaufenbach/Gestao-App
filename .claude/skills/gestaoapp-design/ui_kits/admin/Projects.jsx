function ProjectsScreen({ data, tasks, isMobile, go, onNewProject }) {
  const { PageHeader, Button, Tabs, ProjectCard, Icon } = GA;
  const [tab, setTab] = React.useState('all');
  const active = data.projects.filter((p) => p.health !== 'done');
  const done = data.projects.filter((p) => p.health === 'done');
  const list = tab === 'all' ? data.projects : tab === 'active' ? active : tab === 'done' ? done : [];
  return (
    <div className="page">
      <PageHeader breadcrumb={isMobile ? null : [data.workspace, 'Projetos']} title="Projetos" subtitle={active.length + ' ativos · ' + done.length + ' concluído'}
        actions={<Button icon="plus" size={isMobile ? 'sm' : 'md'} onClick={onNewProject}>Novo projeto</Button>} />
      <Tabs value={tab} onChange={setTab} tabs={[{ value: 'all', label: 'Todos', count: data.projects.length }, { value: 'active', label: 'Ativos', count: active.length }, { value: 'done', label: 'Concluídos', count: done.length }, { value: 'archived', label: 'Arquivados' }]} />
      {list.length === 0 ? (
        <div className="empty"><Icon name="inbox" size={28} /><div className="empty__t">Nenhum projeto arquivado</div>Projetos arquivados aparecem aqui e podem ser restaurados.</div>
      ) : (
        <div className="pgrid">
          {list.map((p) => (
            <ProjectCard key={p.id} name={p.name} description={p.desc} icon={p.icon} color={p.color} health={p.health} progress={p.progress} tasksDone={p.done} tasksTotal={p.total} due={p.due}
              members={p.members.map((id) => ({ name: data.memById[id].name, tone: data.memById[id].tone }))} onClick={() => go('tasks', { project: p.id })} onMore={() => {}} />
          ))}
          {tab !== 'done' ? (
            <div className="ga-card ga-card--dashed ga-card--interactive newp" onClick={onNewProject} role="button" tabIndex={0}>
              <span className="newp__i"><Icon name="folder-plus" size={20} /></span>
              <span className="newp__t">Criar projeto</span>
              <span className="newp__d">Comece do zero ou a partir de um modelo</span>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
window.ProjectsScreen = ProjectsScreen;
