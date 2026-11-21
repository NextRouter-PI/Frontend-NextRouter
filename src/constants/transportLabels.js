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

export const PARTICIPATION_STATUS_LABELS = Object.freeze({
  allocated: 'Alocado (aguardando embarque)',
  on_board: 'Embarcado',
  dropped_off: 'Desembarcado',
  no_show: 'Ausente (no-show)',
  withdrawn: 'Desistiu antes do embarque',
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
