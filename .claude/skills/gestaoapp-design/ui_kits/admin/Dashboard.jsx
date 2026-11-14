function DashboardScreen({ data, tasks, isMobile, compactRows, go, onOpen, onToggle, onNew, selectedId }) {
  const { PageHeader, Button, IconButton, StatCard, GoalCard, Card, TaskRow, BarChart, Badge, ProgressBar, Avatar } = GA;
  const today = tasks.filter((t) => t.due === 'today' || t.due === 'late');
  const doneToday = today.filter((t) => t.status === 'done').length;
  const dueToday = tasks.filter((t) => t.due === 'today' && t.status !== 'done').length;
  const late = tasks.filter((t) => t.due === 'late' && t.status !== 'done').length;
  const doneAll = tasks.filter((t) => t.status === 'done').length;
  const inProg = tasks.filter((t) => t.status === 'progress' || t.status === 'review');
  const goalDone = data.goalBase + doneAll;
  const week = data.week.map((d) => (d.highlight ? Object.assign({}, d, { value: 2 + doneAll }) : d));

  const goal = <GoalCard key="goal" done={goalDone} total={data.goalTotal} />;
  const stats = [
    <StatCard key="due" icon="calendar" label="Vencem hoje" value={String(dueToday)} delta={late ? late + ' atrasada' : 'nenhuma atrasada'} deltaTrend={late ? 'down' : undefined} onMore={isMobile ? undefined : () => go('tasks')} compact={isMobile} />,
    <StatCard key="done" icon="square-check" tone="success" label="Concluídas na semana" value={String(goalDone)} delta={isMobile ? '18%' : '18% vs semana passada'} deltaTrend="up" compact={isMobile} />,
    <StatCard key="prog" icon="zap" tone="warning" label="Em andamento" value={String(inProg.length)} caption={'em ' + new Set(inProg.map((t) => t.project)).size + ' projetos'} compact={isMobile} />
  ];

  const loadRows = data.members.slice(0, 5).map((m) => {
    const hot = m.load > 90;
    return (
      <div className="load__row" key={m.id}>
        <span className="load__who"><Avatar name={m.name} tone={m.tone} size="sm" /><span>{m.name}</span></span>
        <ProgressBar value={m.load} size="sm" tone={hot ? 'danger' : m.load > 75 ? 'warning' : 'brand'} label={'Carga de ' + m.name} />
        <span className={'load__pct' + (hot ? ' load__pct--hot' : '')}>{m.load}%</span>
      </div>
    );
  });

  return (
    <div className="page">
      <PageHeader
        breadcrumb={isMobile ? null : [data.workspace, 'Painel']}
        title={'Bom dia, ' + data.user.name.split(' ')[0]}
        subtitle={data.today + ' · ' + dueToday + ' tarefas vencem hoje e 1 reunião.'}
        actions={isMobile ? null : <React.Fragment>
          <IconButton icon="bell" label="Notificações" variant="outline" shape="circle" dot />
          <Button variant="secondary" icon="folder" onClick={() => go('projects')}>Criar projeto</Button>
          <Button icon="plus" onClick={onNew}>Nova tarefa</Button>
        </React.Fragment>} />

      <div className="stats">{isMobile ? [goal].concat(stats) : stats.concat([goal])}</div>

      <div className="dash">
        <div className="stack16">
          <Card title="Tarefas de hoje" subtitle={doneToday + ' de ' + today.length + ' concluídas'}
            actions={<Button variant="ghost" size="sm" iconRight="arrow-right" onClick={() => go('tasks')}>Ver todas</Button>}>
            <div className="stack">
              {today.map((t) => {
                const p = data.projById[t.project]; const a = data.memById[t.assignee];
                return <TaskRow key={t.id} layout={compactRows ? 'stacked' : 'row'} title={t.title} project={p.name} projectColor={p.color} time={t.when} late={t.due === 'late' && t.status !== 'done'} priority={t.priority} assignee={{ name: a.name, tone: a.tone }} done={t.status === 'done'} selected={selectedId === t.id} onToggle={() => onToggle(t.id)} onClick={() => onOpen(t.id)} onMore={() => onOpen(t.id)} />;
              })}
            </div>
          </Card>
          <Card title="Carga da equipe" subtitle="Ocupação desta semana" actions={<Button variant="ghost" size="sm" onClick={() => go('team')}>Ver equipe</Button>}>
            <div className="load">{loadRows}</div>
          </Card>
        </div>
        <div className="stack16">
          <Card title="Progresso semanal" subtitle="Tarefas concluídas por dia" actions={<Badge tone="success" size="sm">+18%</Badge>}>
            <BarChart data={week} height={isMobile ? 120 : 150} />
          </Card>
          <Card title="Projetos ativos" actions={<Button variant="ghost" size="sm" onClick={() => go('projects')}>Ver todos</Button>}>
            <div className="plist">
              {data.projects.filter((p) => p.health !== 'done').map((p) => (
                <div className="plist__row" key={p.id} onClick={() => go('tasks', { project: p.id })}>
                  <span className="plist__name"><span className="plist__sq" style={{ background: p.color }} /><span>{p.name}</span></span>
                  <span className="plist__pct">{p.progress}%</span>
                  <ProgressBar value={p.progress} color={p.color} size="xs" />
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
window.DashboardScreen = DashboardScreen;
