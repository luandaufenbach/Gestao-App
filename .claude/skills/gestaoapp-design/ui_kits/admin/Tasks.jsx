const TASK_GROUPS = [
  { id: 'late', label: 'Atrasadas', icon: 'triangle-alert' },
  { id: 'today', label: 'Hoje', icon: 'calendar' },
  { id: 'tomorrow', label: 'Amanhã', icon: 'calendar-days' },
  { id: 'week', label: 'Esta semana', icon: 'calendar-days' }
];
const BOARD_COLS = ['todo', 'progress', 'review', 'done'];

function BoardCard({ t, data, onOpen, selected }) {
  const { ProjectTag, PriorityFlag, Avatar, Icon } = GA;
  const p = data.projById[t.project]; const a = data.memById[t.assignee];
  const late = t.due === 'late' && t.status !== 'done';
  return (
    <div className={'ga-card ga-card--interactive ga-card--pad-none bcard' + (t.status === 'done' ? ' bcard--done' : '')} onClick={() => onOpen(t.id)}
      style={selected ? { borderColor: 'var(--cobalt-300)', boxShadow: '0 0 0 3px rgba(46,68,240,.10)' } : null}>
      <ProjectTag name={p.name} color={p.color} plain />
      <div className="bcard__title">{t.title}</div>
      <div className="bcard__foot">
        <span className={'bcard__when' + (late ? ' bcard__when--late' : '')}><Icon name="clock" size={12} />{t.when}</span>
        <span className="bcard__end"><PriorityFlag level={t.priority} iconOnly /><Avatar name={a.name} tone={a.tone} size="xs" /></span>
      </div>
    </div>
  );
}

function TasksScreen({ data, tasks, isMobile, compactRows, onOpen, onToggle, onNew, selectedId, projectFilter, setProjectFilter }) {
  const { PageHeader, Button, SegmentedControl, FilterChip, TaskRow, StatusBadge, Badge, Icon } = GA;
  const [view, setView] = React.useState('list');
  const [mine, setMine] = React.useState(false);
  const [showDone, setShowDone] = React.useState(true);
  let list = tasks;
  if (mine) list = list.filter((t) => t.assignee === data.user.id);
  if (projectFilter) list = list.filter((t) => t.project === projectFilter);
  const open = tasks.filter((t) => t.status !== 'done').length;
  const late = tasks.filter((t) => t.due === 'late' && t.status !== 'done').length;
  const pf = projectFilter ? data.projById[projectFilter] : null;
  const viewSwitch = <SegmentedControl value={view} onChange={setView} block={isMobile} options={[{ value: 'list', label: 'Lista', icon: 'list' }, { value: 'board', label: 'Quadro', icon: 'columns-3' }]} />;

  const row = (t) => {
    const p = data.projById[t.project]; const a = data.memById[t.assignee];
    return <TaskRow key={t.id} layout={compactRows ? 'stacked' : 'row'} title={t.title} project={p.name} projectColor={p.color} time={t.when} late={t.due === 'late' && t.status !== 'done'} priority={t.priority} assignee={{ name: a.name, tone: a.tone }} done={t.status === 'done'} selected={selectedId === t.id} onToggle={() => onToggle(t.id)} onClick={() => onOpen(t.id)} onMore={() => onOpen(t.id)} />;
  };

  const pending = list.filter((t) => t.status !== 'done');
  const done = list.filter((t) => t.status === 'done');

  return (
    <div className="page">
      <PageHeader breadcrumb={isMobile ? null : [data.workspace, 'Tarefas']} title="Tarefas"
        subtitle={open + ' abertas' + (late ? ' · ' + late + ' atrasada' : '')}
        actions={isMobile ? null : <React.Fragment>{viewSwitch}<Button icon="plus" onClick={onNew}>Nova tarefa</Button></React.Fragment>} />
      {isMobile ? viewSwitch : null}
      <div className="chips">
        <FilterChip label="Responsável: Eu" icon="user" active={mine} dropdown={false} onClick={() => setMine(!mine)} onRemove={() => setMine(false)} />
        {data.projects.filter((p) => p.health !== 'done').map((p) => (
          <FilterChip key={p.id} label={p.name} dropdown={false} active={projectFilter === p.id} onClick={() => setProjectFilter(projectFilter === p.id ? null : p.id)} onRemove={() => setProjectFilter(null)} />
        ))}
      </div>

      {view === 'list' ? (
        <div className="stack16">
          {list.length === 0 ? <div className="empty"><Icon name="inbox" size={28} /><div className="empty__t">Nada por aqui</div>Nenhuma tarefa com esses filtros.</div> : null}
          {TASK_GROUPS.map((g) => {
            const items = pending.filter((t) => t.due === g.id);
            if (!items.length) return null;
            return (
              <section className="stack" key={g.id}>
                <div className="sechead"><span className={'sechead__l' + (g.id === 'late' ? ' sechead__l--late' : '')}><Icon name={g.icon} size={14} />{g.label}<Badge size="sm" tone={g.id === 'late' ? 'danger' : 'neutral'}>{items.length}</Badge></span></div>
                {items.map(row)}
              </section>
            );
          })}
          {done.length ? (
            <section className="stack">
              <div className="sechead">
                <span className="sechead__l"><Icon name="circle-check" size={14} />Concluídas<Badge size="sm" tone="success">{done.length}</Badge></span>
                <Button variant="ghost" size="sm" iconRight={showDone ? 'chevron-up' : 'chevron-down'} onClick={() => setShowDone(!showDone)}>{showDone ? 'Ocultar' : 'Mostrar'}</Button>
              </div>
              {showDone ? done.map(row) : null}
            </section>
          ) : null}
        </div>
      ) : (
        <div className="board">
          {BOARD_COLS.map((s) => {
            const items = list.filter((t) => t.status === s);
            return (
              <div className="board__col" key={s}>
                <div className="board__head"><StatusBadge status={s} /><Badge size="sm" tone="outline">{items.length}</Badge></div>
                {items.map((t) => <BoardCard key={t.id} t={t} data={data} onOpen={onOpen} selected={selectedId === t.id} />)}
                {s === 'todo' ? <Button variant="ghost" size="sm" icon="plus" onClick={onNew}>Adicionar</Button> : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
window.TasksScreen = TasksScreen;
