// gestaoApp admin UI kit — sample data (pt-BR)
window.GA_DATA = (function () {
  var members = [
    { id: 'm1', name: 'Marina Alves', email: 'marina@estudionorte.com.br', role: 'Dona', tone: 'cobalt', load: 82, presence: 'online' },
    { id: 'm2', name: 'João Kim', email: 'joao@estudionorte.com.br', role: 'Admin', tone: 'zest', load: 64, presence: 'online' },
    { id: 'm3', name: 'Rosa Silva', email: 'rosa@estudionorte.com.br', role: 'Membro', tone: 'violet', load: 96, presence: 'away' },
    { id: 'm4', name: 'Léo Prado', email: 'leo@estudionorte.com.br', role: 'Membro', tone: 'orange', load: 48, presence: 'online' },
    { id: 'm5', name: 'Ana Navarro', email: 'ana@estudionorte.com.br', role: 'Admin', tone: 'ink', load: 71, presence: 'offline' },
    { id: 'm6', name: 'Tom Reis', email: 'tom@freela.com', role: 'Convidado', tone: 'sky', load: 30, presence: 'offline' }
  ];
  var projects = [
    { id: 'p1', name: 'Redesign do site', color: 'var(--project-1)', icon: 'layers', desc: 'Novo site institucional e páginas de preço', health: 'ontrack', progress: 72, done: 18, total: 25, due: '24 out', members: ['m1', 'm3', 'm2', 'm5'] },
    { id: 'p2', name: 'Vídeo da marca', color: 'var(--project-2)', icon: 'play', desc: 'Filme de 60s para o lançamento de outubro', health: 'atrisk', progress: 45, done: 9, total: 20, due: '18 out', members: ['m2', 'm3'] },
    { id: 'p3', name: 'App mobile', color: 'var(--project-3)', icon: 'smartphone', desc: 'Onboarding e fluxo de tarefas no celular', health: 'ontrack', progress: 38, done: 11, total: 29, due: '15 nov', members: ['m1', 'm3', 'm6'] },
    { id: 'p4', name: 'Marketing', color: 'var(--project-4)', icon: 'trending-up', desc: 'Campanha de lançamento e conteúdo social', health: 'late', progress: 61, done: 14, total: 23, due: '10 out', members: ['m2', 'm4', 'm5'] },
    { id: 'p5', name: 'Onboarding de clientes', color: 'var(--project-5)', icon: 'user-plus', desc: 'Kit de boas-vindas e sessões de kickoff', health: 'done', progress: 100, done: 16, total: 16, due: '30 set', members: ['m4', 'm1'] }
  ];
  var tasks = [
    { id: 't4', title: 'Enviar fatura ao cliente', project: 'p1', due: 'late', when: '2 dias atrasada', dueLabel: 'seg, 6 out', priority: 'high', assignee: 'm5', status: 'todo', desc: 'Fatura referente à fase 2 do redesign. Conferir horas lançadas antes de enviar.', subtasks: [{ t: 'Conferir horas', done: true }, { t: 'Gerar PDF', done: false }] },
    { id: 't1', title: 'Finalizar design do site', project: 'p1', due: 'today', when: '10:00', dueLabel: 'Hoje · 10:00', priority: 'high', assignee: 'm1', status: 'progress', desc: 'Fechar as telas finais da home e da página de preços para a revisão com o cliente às 16h.', subtasks: [{ t: 'Hero e seções da home', done: true }, { t: 'Layout da página de preços', done: true }, { t: 'Breakpoints responsivos', done: false }] },
    { id: 't2', title: 'Revisar feedback do cliente', project: 'p2', due: 'today', when: '13:30', dueLabel: 'Hoje · 13:30', priority: 'medium', assignee: 'm2', status: 'review', desc: 'Consolidar os comentários da segunda versão do corte e separar o que entra nesta rodada.', subtasks: [{ t: 'Ler comentários', done: true }, { t: 'Priorizar ajustes', done: false }] },
    { id: 't3', title: 'Reunião de alinhamento da sprint', project: 'p4', due: 'today', when: '15:00', dueLabel: 'Hoje · 15:00', priority: 'low', assignee: 'm4', status: 'todo', desc: 'Revisar entregas da semana e redistribuir tarefas atrasadas.', subtasks: [] },
    { id: 't5', title: 'Preparar notas da sprint', project: 'p4', due: 'today', when: '09:00', dueLabel: 'Hoje · 09:00', priority: 'low', assignee: 'm1', status: 'done', desc: 'Resumo do que foi entregue e do que ficou para a próxima sprint.', subtasks: [] },
    { id: 't6', title: 'Roteiro do vídeo institucional', project: 'p2', due: 'tomorrow', when: 'qui, 9 out', dueLabel: 'Amanhã · qui, 9 out', priority: 'high', assignee: 'm3', status: 'progress', desc: 'Versão final do roteiro com locução e indicação de cenas.', subtasks: [{ t: 'Abertura', done: true }, { t: 'Depoimentos', done: false }, { t: 'Encerramento', done: false }] },
    { id: 't7', title: 'Protótipo do onboarding', project: 'p3', due: 'tomorrow', when: 'qui, 9 out', dueLabel: 'Amanhã · qui, 9 out', priority: 'medium', assignee: 'm1', status: 'todo', desc: 'Fluxo de 3 telas para o primeiro acesso no app.', subtasks: [] },
    { id: 't8', title: 'Testes de usabilidade', project: 'p3', due: 'week', when: 'sex, 10 out', dueLabel: 'sex, 10 out', priority: 'medium', assignee: 'm3', status: 'todo', desc: 'Cinco sessões remotas com clientes atuais.', subtasks: [] },
    { id: 't9', title: 'Campanha de lançamento', project: 'p4', due: 'week', when: 'sex, 10 out', dueLabel: 'sex, 10 out', priority: 'high', assignee: 'm2', status: 'review', desc: 'Peças para redes sociais e e-mail de anúncio.', subtasks: [{ t: 'Peças sociais', done: true }, { t: 'E-mail', done: false }] },
    { id: 't10', title: 'Layout da página de preços', project: 'p1', due: 'week', when: 'seg, 6 out', dueLabel: 'seg, 6 out', priority: 'low', assignee: 'm1', status: 'done', desc: 'Tabela de planos com comparação.', subtasks: [] }
  ];
  var week = [
    { label: 'S', value: 6, planned: 8 }, { label: 'T', value: 7, planned: 8 }, { label: 'Q', value: 4, planned: 6, highlight: true },
    { label: 'Q', value: 0, planned: 9 }, { label: 'S', value: 0, planned: 6 }, { label: 'S', value: 0, planned: 2 }, { label: 'D', value: 0, planned: 1 }
  ];
  var byId = function (arr) { var o = {}; arr.forEach(function (x) { o[x.id] = x; }); return o; };
  return {
    user: members[0], workspace: 'Estúdio Norte', today: 'quarta-feira, 8 de outubro',
    members: members, projects: projects, tasks: tasks, week: week,
    memById: byId(members), projById: byId(projects), goalBase: 20, goalTotal: 28
  };
})();
