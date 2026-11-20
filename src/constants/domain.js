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
