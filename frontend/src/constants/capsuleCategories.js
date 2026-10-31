export const CAPSULE_SCOPES = [
  {
    id: 'pessoal',
    label: 'Pessoal',
    description: 'Memórias íntimas, vida familiar, reflexões e jornada individual',
    color: '#7c3aed',
    bgLight: 'rgba(124, 58, 237, 0.12)',
    icon: '👤',
  },
  {
    id: 'profissional',
    label: 'Profissional',
    description: 'Carreira, projetos, negócios, estudos e conquistas no trabalho',
    color: '#0284c7',
    bgLight: 'rgba(2, 132, 199, 0.12)',
    icon: '💼',
  },
];

export const CAPSULE_THEMES = [
  {
    id: 'amor',
    label: 'Amor',
    recommendedScope: 'pessoal',
    color: '#e11d48',
    bgLight: 'rgba(225, 29, 72, 0.12)',
    icon: '❤️',
    description: 'Relacionamentos, família, amizades e afetos',
  },
  {
    id: 'trabalho',
    label: 'Trabalho',
    recommendedScope: 'profissional',
    color: '#0284c7',
    bgLight: 'rgba(2, 132, 199, 0.12)',
    icon: '🚀',
    description: 'Metas de carreira, promoções, empreendedorismo e finanças',
  },
  {
    id: 'crescimento_pessoal',
    label: 'Crescimento Pessoal',
    recommendedScope: 'pessoal',
    color: '#10b981',
    bgLight: 'rgba(16, 185, 129, 0.12)',
    icon: '🌱',
    description: 'Saúde, hábitos, aprendizado, autoconhecimento e evolução',
  },
  {
    id: 'religiao',
    label: 'Religião',
    recommendedScope: 'pessoal',
    color: '#d97706',
    bgLight: 'rgba(217, 119, 6, 0.12)',
    icon: '🕊️',
    description: 'Fé, espiritualidade, gratidão, propósitos e orações',
  },
];

export const INITIAL_CAPSULES = [
  {
    id: 'cap-1',
    title: 'Carta para nosso aniversário de 5 anos',
    message:
      'Espero que, ao abrir esta cápsula, estejamos comemorando todas as viagens que planejamos hoje e que nosso companheirismo esteja ainda mais forte e consolidado.',
    scope: 'pessoal',
    theme: 'amor',
    unlockDate: '2027-06-12T10:00:00.000Z',
    createdAt: '2026-01-15T14:30:00.000Z',
    recipientEmail: 'amor@exemplo.com',
    isOpened: false,
    isUnlocked: false,
    mood: 'Esperançoso',
    priority: 'Alta',
    deliveries: [
      { channel: 'email', status: 'scheduled', scheduledAt: '2027-06-12T10:00:00.000Z', sentAt: null },
      { channel: 'whatsapp', status: 'scheduled', scheduledAt: '2027-06-12T10:00:00.000Z', sentAt: null },
    ],
    actionItems: [
      { id: 't1', text: 'Realizar a viagem planejada em casal', done: true },
      { id: 't2', text: 'Montar o álbum de fotos impresso', done: false },
    ],
  },
  {
    id: 'cap-2',
    title: 'Plano de transição para Tech Lead',
    message:
      'Hoje concluí a arquitetura do projeto Máquina do Tempo. Daqui a 1 ano, quero revisar o quanto evoluí em liderança técnica, sistemas distribuídos e orientação de equipe.',
    scope: 'profissional',
    theme: 'trabalho',
    unlockDate: '2027-10-30T09:00:00.000Z',
    createdAt: '2026-03-10T11:00:00.000Z',
    recipientEmail: 'carreira@exemplo.com',
    isOpened: false,
    isUnlocked: false,
    mood: 'Determinado',
    priority: 'Alta',
    deliveries: [
      { channel: 'email', status: 'scheduled', scheduledAt: '2027-10-30T09:00:00.000Z', sentAt: null },
    ],
    actionItems: [
      { id: 't3', text: 'Concluir certificação de Arquitetura em Nuvem', done: true },
      { id: 't4', text: 'Liderar pelo menos 2 projetos ponta a ponta', done: false },
      { id: 't5', text: 'Mentorar desenvolvedores juniores da equipe', done: false },
    ],
  },
  {
    id: 'cap-3',
    title: 'Hábitos de leitura e corrida matinal',
    message:
      'Comecei a correr 5km três vezes por semana e ler 20 páginas por dia. Esta cápsula prova que a disciplina diária constrói nossa melhor versão física e mental!',
    scope: 'pessoal',
    theme: 'crescimento_pessoal',
    unlockDate: '2026-05-01T08:00:00.000Z',
    createdAt: '2026-02-01T08:00:00.000Z',
    recipientEmail: 'eu@exemplo.com',
    isOpened: true,
    isUnlocked: true,
    mood: 'Motivado',
    priority: 'Média',
    deliveries: [
      { channel: 'email', status: 'sent', scheduledAt: '2026-05-01T08:00:00.000Z', sentAt: '2026-05-01T08:01:00.000Z' },
    ],
    actionItems: [
      { id: 't6', text: 'Completar primeira corrida de 10km', done: true },
      { id: 't7', text: 'Ler 12 livros no ano', done: true },
    ],
  },
  {
    id: 'cap-4',
    title: 'Propósitos de fé e gratidão pela família',
    message:
      'Registro de gratidão pelas bênçãos recebidas neste ano e pelas orações que fizemos juntos em família. Que a paz e a fé continuem guiando cada decisão nossa.',
    scope: 'pessoal',
    theme: 'religiao',
    unlockDate: '2026-12-25T12:00:00.000Z',
    createdAt: '2026-04-05T19:20:00.000Z',
    recipientEmail: 'familia@exemplo.com',
    isOpened: false,
    isUnlocked: false,
    mood: 'Grato',
    priority: 'Alta',
    deliveries: [
      { channel: 'email', status: 'scheduled', scheduledAt: '2026-12-25T12:00:00.000Z', sentAt: null },
      { channel: 'whatsapp', status: 'scheduled', scheduledAt: '2026-12-25T12:00:00.000Z', sentAt: null },
    ],
    actionItems: [
      { id: 't8', text: 'Participar da ação social comunitária do semestre', done: true },
      { id: 't9', text: 'Manter momento semanal de reflexão e leitura espiritual', done: false },
    ],
  },
  {
    id: 'cap-5',
    title: 'Lançamento do meu primeiro produto SaaS',
    message:
      'Estou escrevendo no dia em que definimos o MVP. A coragem de começar valeu a pena! Veja onde chegamos com dedicação, esforço e visão de futuro.',
    scope: 'profissional',
    theme: 'trabalho',
    unlockDate: '2026-08-15T18:00:00.000Z',
    createdAt: '2026-01-20T16:45:00.000Z',
    recipientEmail: 'fundador@exemplo.com',
    isOpened: true,
    isUnlocked: true,
    mood: 'Empolgado',
    priority: 'Alta',
    deliveries: [
      { channel: 'email', status: 'sent', scheduledAt: '2026-08-15T18:00:00.000Z', sentAt: '2026-08-15T18:02:00.000Z' },
    ],
    actionItems: [
      { id: 't10', text: 'Publicar landing page e painel analítico', done: true },
      { id: 't11', text: 'Conquistar os primeiros 50 usuários beta', done: true },
    ],
  },
  {
    id: 'cap-6',
    title: 'Equilíbrio entre carreira e evolução interior',
    message:
      'Lembrete para mim mesmo: o sucesso profissional só é pleno quando caminhamos com ética, aprendizado contínuo, saúde mental e presença com quem amamos.',
    scope: 'profissional',
    theme: 'crescimento_pessoal',
    unlockDate: '2027-03-20T15:00:00.000Z',
    createdAt: '2026-05-12T10:15:00.000Z',
    recipientEmail: 'eu@exemplo.com',
    isOpened: false,
    isUnlocked: false,
    mood: 'Reflexivo',
    priority: 'Média',
    deliveries: [
      { channel: 'email', status: 'scheduled', scheduledAt: '2027-03-20T15:00:00.000Z', sentAt: null },
    ],
    actionItems: [
      { id: 't12', text: 'Fazer curso de comunicação não-violenta e liderança', done: false },
      { id: 't13', text: 'Respeitar horário limite de desconexão diária', done: true },
    ],
  },
];

export function getScopeMeta(scopeId) {
  return CAPSULE_SCOPES.find((s) => s.id === scopeId) || CAPSULE_SCOPES[0];
}

export function getThemeMeta(themeId) {
  return CAPSULE_THEMES.find((t) => t.id === themeId) || CAPSULE_THEMES[0];
}

export function isCapsuleUnlocked(capsule) {
  if (!capsule) return false;
  
  if (typeof capsule === 'object') {
    if (capsule.isUnlocked === true || capsule.isOpened === true) {
      return true;
    }
    const dateStr = capsule.unlockDate || capsule.unlockAt;
    if (!dateStr) return false;
    const unlockTime = new Date(dateStr).getTime();
    return !Number.isNaN(unlockTime) && unlockTime <= Date.now();
  }

  const unlockTime = new Date(capsule).getTime();
  return !Number.isNaN(unlockTime) && unlockTime <= Date.now();
}

export function formatRemainingTime(unlockDateIso) {
  const target = new Date(unlockDateIso).getTime();
  if (Number.isNaN(target)) return 'Data inválida';
  const diff = target - Date.now();

  if (diff <= 0) {
    return 'Liberada para abrir';
  }

  const totalHours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;

  if (days > 365) {
    const years = Math.floor(days / 365);
    const remDays = days % 365;
    return `${years}a ${remDays}d restantes`;
  }
  if (days > 0) {
    return `${days}d ${hours}h restantes`;
  }
  const minutes = Math.max(1, Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)));
  return `${hours}h ${minutes}m restantes`;
}
