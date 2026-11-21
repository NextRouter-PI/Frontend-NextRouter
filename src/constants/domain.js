export const WEEKDAY_OPTIONS = Object.freeze([
  { bit: 1, label: 'Seg' },
  { bit: 2, label: 'Ter' },
  { bit: 4, label: 'Qua' },
  { bit: 8, label: 'Qui' },
  { bit: 16, label: 'Sex' },
  { bit: 32, label: 'Sáb' },
  { bit: 64, label: 'Dom' },
])

export const SERVICE_DIRECTIONS = Object.freeze({
  OUTBOUND: 'outbound',
  RETURN: 'return',
})

export const POINT_TYPES = Object.freeze({
  GARAGE: 'garage',
  DESTINATION: 'destination',
  STOP: 'stop',
})

export const WINDOW_STATES = Object.freeze({
  NOT_OPEN: 'not_open',
  NORMAL: 'normal',
  EXTENSION: 'extension',
  CLOSED: 'closed',
  CANCELED: 'canceled',
})

export const WINDOW_SHORT_LABELS = Object.freeze({
  [WINDOW_STATES.NOT_OPEN]: 'Aguardando abertura',
  [WINDOW_STATES.NORMAL]: 'Janela aberta',
  [WINDOW_STATES.EXTENSION]: 'Prorrogação',
  [WINDOW_STATES.CLOSED]: 'Encerrada',
  [WINDOW_STATES.CANCELED]: 'Cancelada',
})

export const WINDOW_FULL_LABELS = Object.freeze({
  [WINDOW_STATES.NOT_OPEN]: 'Janela ainda não aberta',
  [WINDOW_STATES.NORMAL]: 'Janela aberta (confirme ida e volta)',
  [WINDOW_STATES.EXTENSION]: 'Em prorrogação (pedidos de inclusão/troca)',
  [WINDOW_STATES.CLOSED]: 'Janela encerrada',
  [WINDOW_STATES.CANCELED]: 'Atendimento cancelado pela empresa',
})

export const PARTICIPATION_STATUS_LABELS = Object.freeze({
  allocated: 'Alocado (aguardando embarque)',
  on_board: 'Embarcado',
  dropped_off: 'Desembarcado',
  no_show: 'Ausente (no-show)',
  withdrawn: 'Desistiu antes do embarque',
})

export const VEHICLE_STATUS_TO_API = Object.freeze({
  Ativo: 'active',
  Manutenção: 'maintenance',
  active: 'active',
  maintenance: 'maintenance',
})

export const VEHICLE_STATUS_FROM_API = Object.freeze({
  active: 'Ativo',
  maintenance: 'Manutenção',
})

export const TRAVEL_STATUS_LABELS = Object.freeze({
  scheduled: 'Agendada',
  in_progress: 'Em andamento',
  finished: 'Finalizada',
  canceled: 'Cancelada',
})

export const PLANNING_STATUS_LABELS = Object.freeze({
  draft: 'Rascunho',
  pending: 'Pendente',
  preparing: 'Em preparação',
  calculating: 'Calculando',
  ready: 'Pronta',
  published: 'Publicada',
  stale: 'Desatualizada',
  failed: 'Falhou',
  canceled: 'Cancelada',
})

export const SNAPSHOT_STATE_LABELS = Object.freeze({
  pending: 'Pendente',
  preparing: 'Em preparação',
  calculating: 'Calculando',
  ready: 'Pronto',
  valid: 'Válido',
  stale: 'Desatualizado',
  failed: 'Falhou',
  invalid: 'Inválido',
})

export const JOB_STATUS_LABELS = Object.freeze({
  pending: 'Na fila',
  running: 'Em execução',
  completed: 'Concluído',
  succeeded: 'Concluído',
  failed: 'Falhou',
  canceled: 'Cancelado',
})

export const CHANGE_REQUEST_STATUS_LABELS = Object.freeze({
  pending: 'Pendente',
  approved: 'Aprovado',
  rejected: 'Recusado',
  withdrawn: 'Retirado',
  canceled: 'Cancelado',
})

export const CHANGE_REQUEST_APPLICATION_LABELS = Object.freeze({
  not_applicable: 'Não aplicável',
  pending: 'Pendente',
  preparing: 'Em preparação',
  applied: 'Aplicado',
  failed: 'Falhou',
})

export const NOTIFICATION_KIND_LABELS = Object.freeze({
  operation: 'Operação',
  publication: 'Publicação',
  membership: 'Vínculo',
  change_request: 'Pedido de alteração',
  invitation: 'Convite',
  driver_invitation: 'Convite de motorista',
  lost_item: 'Objeto perdido',
  rating: 'Avaliação',
  service_day: 'Dia de atendimento',
  cancellation: 'Cancelamento',
  system: 'Sistema',
})

export const RESOURCE_TYPE_LABELS = Object.freeze({
  travel: 'Viagem',
  membership: 'Vínculo',
  service_day: 'Atendimento',
  change_request: 'Pedido',
  driver_invitation: 'Convite',
  lost_item: 'Objeto perdido',
  route_group: 'Grupo de rota',
  vehicle: 'Veículo',
  operational_point: 'Ponto operacional',
  company: 'Empresa',
})

export const DOMAIN_STATUS_LABELS = Object.freeze({
  ...TRAVEL_STATUS_LABELS,
  ...PLANNING_STATUS_LABELS,
  ...CHANGE_REQUEST_STATUS_LABELS,
  ...CHANGE_REQUEST_APPLICATION_LABELS,
  active: 'Ativo',
  ended: 'Encerrado',
  reported: 'Relatado',
  found: 'Encontrado',
  returned: 'Devolvido',
  accepted: 'Aceito',
  declined: 'Recusado',
  expired: 'Expirado',
  open: 'Aberto',
  closed: 'Encerrado',
  not_open: 'Aguardando abertura',
  normal: 'Janela aberta',
  extension: 'Prorrogação',
  allocated: 'Alocado',
  on_board: 'Embarcado',
  dropped_off: 'Desembarcado',
  no_show: 'Ausente',
})
