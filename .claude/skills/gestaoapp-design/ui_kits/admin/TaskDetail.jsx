function TaskDetailBody({ task, data, onSub }) {
  const { ProjectTag, PriorityFlag, Avatar, Checkbox, ProgressBar, Icon, TextField } = GA;
  const p = data.projById[task.project]; const a = data.memById[task.assignee];
  const subs = task.subtasks || [];
  const sd = subs.filter((s) => s.done).length;
  const late = task.due === 'late' && task.status !== 'done';
  return (
    <div className="td">
      <h2 className="td__title">{task.title}</h2>
      <div className="td__meta">
        <span className="td__k"><Icon name="folder" size={14} />Projeto</span><span className="td__v"><ProjectTag name={p.name} color={p.color} /></span>
        <span className="td__k"><Icon name="calendar" size={14} />Prazo</span><span className={'td__v' + (late ? ' td__late' : '')}>{task.dueLabel}{late ? ' · atrasada' : ''}</span>
        <span className="td__k"><Icon name="flag" size={14} />Prioridade</span><span className="td__v"><PriorityFlag level={task.priority} /></span>
        <span className="td__k"><Icon name="user" size={14} />Responsável</span><span className="td__v"><Avatar name={a.name} tone={a.tone} size="sm" />{a.name}</span>
      </div>
      <div className="td__sec"><div className="td__h">Descrição</div><p className="td__p">{task.desc}</p></div>
      {subs.length ? (
        <div className="td__sec">
          <div className="td__h">Subtarefas<span>{sd}/{subs.length}</span></div>
          <ProgressBar value={sd} max={subs.length} size="xs" tone={sd === subs.length ? 'success' : 'brand'} label="Subtarefas" />
          <div className="td__subs">{subs.map((s, i) => <Checkbox key={i} shape="round" strike checked={s.done} onChange={() => onSub(task.id, i)} label={s.t} />)}</div>
        </div>
      ) : null}
      <div className="td__sec">
        <div className="td__h">Atividade</div>
        <div className="td__act"><Avatar name="João Kim" tone="zest" size="sm" /><div><div className="td__actt"><b>João Kim</b> comentou: “Pode seguir com a versão B.”</div><div className="td__acttime">há 25 min</div></div></div>
        <div className="td__act"><Avatar name={a.name} tone={a.tone} size="sm" /><div><div className="td__actt"><b>{a.name}</b> mudou o status para Em andamento</div><div className="td__acttime">hoje, 08:40</div></div></div>
        <div className="td__comment"><Avatar name={data.user.name} tone={data.user.tone} size="sm" /><TextField variant="sunken" size="sm" placeholder="Escreva um comentário…" style={{ flex: 1 }} /></div>
      </div>
    </div>
  );
}

function TaskActions({ task, onToggle, onDelete, block }) {
  const { Button, IconButton } = GA;
  const done = task.status === 'done';
  return (
    <React.Fragment>
      <Button variant={done ? 'secondary' : 'accent'} icon={done ? 'repeat' : 'check'} size={block ? 'lg' : 'sm'} block={block} onClick={() => onToggle(task.id)}>{done ? 'Reabrir' : 'Concluir'}</Button>
      <IconButton icon="pencil" label="Editar" variant="outline" shape="circle" size={block ? 'lg' : 'md'} />
      <IconButton icon="trash-2" label="Excluir" variant="danger" shape="circle" size={block ? 'lg' : 'md'} onClick={() => onDelete(task.id)} />
    </React.Fragment>
  );
}

function TaskDrawer({ task, data, mode, onClose, onToggle, onDelete, onSub, onCopy }) {
  const { Drawer, StatusBadge, IconButton } = GA;
  return (
    <Drawer key={task.id} mode={mode} onClose={onClose} title={<StatusBadge status={task.status} />}
      headerActions={<IconButton icon="link" label="Copiar link" size="sm" onClick={onCopy} />}
      footer={<TaskActions task={task} onToggle={onToggle} onDelete={onDelete} />}>
      <TaskDetailBody task={task} data={data} onSub={onSub} />
    </Drawer>
  );
}

function MobileTaskDetail({ task, data, onClose, onToggle, onDelete, onSub, onCopy }) {
  const { IconButton, StatusBadge } = GA;
  return (
    <div className="mdetail" role="dialog" aria-label={task.title}>
      <div className="mdetail__top">
        <IconButton icon="chevron-left" label="Voltar" size="lg" onClick={onClose} />
        <StatusBadge status={task.status} />
        <IconButton icon="link" label="Copiar link" size="lg" onClick={onCopy} />
      </div>
      <div className="mdetail__body"><TaskDetailBody task={task} data={data} onSub={onSub} /></div>
      <div className="mdetail__foot"><TaskActions task={task} onToggle={onToggle} onDelete={onDelete} block /></div>
    </div>
  );
}

function NewTaskForm({ data, onSubmit, onCancel, isMobile }) {
  const { TextField, Select, SegmentedControl, Button } = GA;
  const [title, setTitle] = React.useState('');
  const [project, setProject] = React.useState('p1');
  const [due, setDue] = React.useState('today');
  const [prio, setPrio] = React.useState('medium');
  const ok = title.trim().length > 0;
  const submit = () => { if (ok) onSubmit({ title: title.trim(), project, due, priority: prio }); };
  return (
    <div className="nt">
      <TextField label="Título" autoFocus size={isMobile ? 'lg' : 'md'} placeholder="Ex.: Enviar vídeo final" value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') submit(); }} />
      <div className="nt__grid">
        <Select label="Projeto" value={project} onChange={(e) => setProject(e.target.value)} options={data.projects.filter((p) => p.health !== 'done').map((p) => ({ value: p.id, label: p.name }))} />
        <Select label="Prazo" value={due} onChange={(e) => setDue(e.target.value)} options={[{ value: 'today', label: 'Hoje' }, { value: 'tomorrow', label: 'Amanhã' }, { value: 'week', label: 'Esta semana' }]} />
      </div>
      <div className="nt__prio"><span className="ga-field__label">Prioridade</span>
        <SegmentedControl block value={prio} onChange={setPrio} options={[{ value: 'high', label: 'Alta' }, { value: 'medium', label: 'Média' }, { value: 'low', label: 'Baixa' }]} /></div>
      {isMobile ? <Button block size="lg" icon="plus" disabled={!ok} onClick={submit}>Adicionar tarefa</Button> : (
        <div className="nt__actions"><Button variant="ghost" onClick={onCancel}>Cancelar</Button><Button icon="plus" disabled={!ok} onClick={submit}>Criar tarefa</Button></div>
      )}
    </div>
  );
}

Object.assign(window, { TaskDrawer, MobileTaskDetail, NewTaskForm });
