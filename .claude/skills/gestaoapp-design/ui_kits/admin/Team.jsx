function TeamScreen({ data, tasks, isMobile, onInvite }) {
  const { PageHeader, Button, IconButton, Card, DataTable, Avatar, Badge, ProgressBar, SearchField, Tabs, Icon, Select } = GA;
  const [q, setQ] = React.useState('');
  const [tab, setTab] = React.useState('members');
  const openBy = (id) => tasks.filter((t) => t.assignee === id && t.status !== 'done').length + 3;
  const rows = data.members.filter((m) => m.name.toLowerCase().includes(q.toLowerCase()));
  const loadTone = (v) => (v > 90 ? 'danger' : v > 75 ? 'warning' : 'brand');
  const presence = { online: ['success', 'Ativa'], away: ['warning', 'Ausente'], offline: ['neutral', 'Offline'] };
  return (
    <div className="page">
      <PageHeader breadcrumb={isMobile ? null : [data.workspace, 'Equipe']} title="Equipe" subtitle={data.members.length + ' membros · 2 convites pendentes'}
        actions={<Button icon="user-plus" size={isMobile ? 'sm' : 'md'} onClick={onInvite}>Convidar membro</Button>} />
      <div className="toolbar">
        <Tabs value={tab} onChange={setTab} tabs={[{ value: 'members', label: 'Membros', count: data.members.length }, { value: 'invites', label: 'Convites', count: 2 }]} style={{ borderBottom: 0 }} />
        <SearchField placeholder="Buscar membros" shortcut={null} size="sm" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: isMobile ? '100%' : 260 }} />
      </div>
      {tab === 'invites' ? (
        <Card padding="none" style={{ overflow: 'hidden' }}>
          <div className="mlist">
            {['bia@estudionorte.com.br', 'caio@freela.com'].map((e) => (
              <div className="mrow" key={e} style={{ cursor: 'default' }}>
                <span className="who"><Avatar initials="@" tone="sky" size={36} /><span className="who__meta"><span className="who__name">{e}</span><span className="who__mail">Convidado há 2 dias · Membro</span></span></span>
                <span className="mrow__end"><Button variant="ghost" size="sm">Reenviar</Button></span>
              </div>
            ))}
          </div>
        </Card>
      ) : isMobile ? (
        <Card padding="none" style={{ overflow: 'hidden' }}>
          <div className="mlist">
            {rows.map((m) => (
              <div className="mrow" key={m.id}>
                <span className="who"><Avatar name={m.name} tone={m.tone} size={36} status={m.presence} /><span className="who__meta"><span className="who__name">{m.name}</span><span className="who__mail">{m.role} · {openBy(m.id)} abertas</span></span></span>
                <span className="mrow__end"><Badge size="sm" tone={m.load > 90 ? 'danger' : m.load > 75 ? 'warning' : 'neutral'}>{m.load}%</Badge><Icon name="chevron-right" size={16} /></span>
              </div>
            ))}
          </div>
        </Card>
      ) : (
        <Card padding="none" style={{ overflow: 'hidden' }}>
          <DataTable rowKey="id" rows={rows} columns={[
            { key: 'name', header: 'Membro', render: (m) => <span className="who"><Avatar name={m.name} tone={m.tone} size={32} status={m.presence} /><span className="who__meta"><span className="who__name">{m.name}</span><span className="who__mail">{m.email}</span></span></span> },
            { key: 'role', header: 'Função', width: 150, render: (m) => m.role === 'Dona' ? <Badge tone="brand">Dona</Badge> : <Select size="sm" defaultValue={m.role} options={['Admin', 'Membro', 'Convidado']} style={{ width: 130 }} /> },
            { key: 'open', header: 'Abertas', align: 'right', width: 90, render: (m) => <span className="ga-num">{openBy(m.id)}</span> },
            { key: 'load', header: 'Carga', width: 170, render: (m) => <span className="loadcell"><ProgressBar value={m.load} size="xs" tone={loadTone(m.load)} style={{ width: 90 }} />{m.load + '%'}</span> },
            { key: 'st', header: 'Status', width: 110, render: (m) => <Badge size="sm" dot tone={presence[m.presence][0]}>{presence[m.presence][1]}</Badge> },
            { key: 'more', header: '', width: 48, render: () => <IconButton icon="ellipsis" label="Mais ações" size="sm" /> }
          ]} />
        </Card>
      )}
    </div>
  );
}
window.TeamScreen = TeamScreen;
