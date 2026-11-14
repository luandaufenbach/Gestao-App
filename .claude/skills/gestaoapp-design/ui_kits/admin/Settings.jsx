function SettingsScreen({ data, isMobile, onSaved, onDeleteAccount }) {
  const { PageHeader, Tabs, Card, TextField, Select, Switch, Radio, Button, Avatar } = GA;
  const [tab, setTab] = React.useState('profile');
  const u = data.user;
  const notif = [
    ['Lembretes de tarefas', 'Aviso 30 min antes de cada prazo', true],
    ['Menções e comentários', 'Quando alguém marcar você', true],
    ['Atualizações de projeto', 'Mudanças de status nos seus projetos', false],
    ['Notificações no celular', 'Push no app gestaoApp', true]
  ];
  return (
    <div className="page">
      <PageHeader breadcrumb={isMobile ? null : [data.workspace, 'Configurações']} title="Configurações" subtitle="Gerencie seu perfil, notificações e o workspace." />
      <Tabs value={tab} onChange={setTab} tabs={[{ value: 'profile', label: 'Perfil' }, { value: 'notif', label: 'Notificações' }, { value: 'ws', label: 'Workspace' }]} />
      {tab === 'profile' ? (
        <div className="set">
          <section className="set__sec">
            <div><div className="set__h">Perfil</div><div className="set__d">Como você aparece para a equipe.</div></div>
            <Card>
              <div className="set__form">
                <div className="set__photo"><Avatar name={u.name} tone={u.tone} size={56} /><Button variant="secondary" size="sm" icon="upload">Alterar foto</Button><Button variant="ghost" size="sm">Remover</Button></div>
                <div className="set__grid">
                  <TextField label="Nome completo" defaultValue={u.name} />
                  <TextField label="E-mail" icon="mail" defaultValue={u.email} />
                  <TextField label="Cargo" defaultValue="Diretora de criação" />
                  <Select label="Fuso horário" icon="globe" options={['América/São Paulo (GMT-3)', 'América/Manaus (GMT-4)', 'Europa/Lisboa (GMT+1)']} />
                </div>
                <div className="set__actions"><Button variant="ghost">Cancelar</Button><Button onClick={onSaved}>Salvar alterações</Button></div>
              </div>
            </Card>
          </section>
          <section className="set__sec">
            <div><div className="set__h">Zona de perigo</div><div className="set__d">Ações permanentes na sua conta.</div></div>
            <Card className="danger">
              <div className="set__row"><div><div className="set__rt">Excluir conta</div><div className="set__rd">Remove sua conta e todas as suas tarefas.</div></div><Button variant="danger" size="sm" icon="trash-2" onClick={onDeleteAccount}>Excluir</Button></div>
            </Card>
          </section>
        </div>
      ) : tab === 'notif' ? (
        <div className="set">
          <section className="set__sec">
            <div><div className="set__h">Notificações</div><div className="set__d">Escolha o que merece sua atenção.</div></div>
            <Card>{notif.map((n) => <div className="set__row" key={n[0]}><div><div className="set__rt">{n[0]}</div><div className="set__rd">{n[1]}</div></div><Switch defaultChecked={n[2]} ariaLabel={n[0]} /></div>)}</Card>
          </section>
          <section className="set__sec">
            <div><div className="set__h">Resumo por e-mail</div><div className="set__d">Um panorama das suas tarefas.</div></div>
            <Card><div className="set__form"><Radio name="dig" defaultChecked label="Diário" description="Toda manhã, às 08:00" /><Radio name="dig" label="Semanal" description="Segunda-feira, às 08:00" /><Radio name="dig" label="Nunca" /></div></Card>
          </section>
        </div>
      ) : (
        <div className="set">
          <section className="set__sec">
            <div><div className="set__h">Workspace</div><div className="set__d">Nome e padrões da equipe.</div></div>
            <Card><div className="set__form">
              <div className="set__grid"><TextField label="Nome do workspace" defaultValue={data.workspace} /><TextField label="Endereço" defaultValue="estudionorte" trailing={<span className="ga-field__hint">.gestaoapp.com</span>} /></div>
              <div className="set__grid"><Select label="Idioma" options={['Português (Brasil)', 'English', 'Español']} /><Select label="Início da semana" options={['Segunda-feira', 'Domingo']} /></div>
              <div className="set__actions"><Button onClick={onSaved}>Salvar</Button></div>
            </div></Card>
          </section>
        </div>
      )}
    </div>
  );
}
window.SettingsScreen = SettingsScreen;
