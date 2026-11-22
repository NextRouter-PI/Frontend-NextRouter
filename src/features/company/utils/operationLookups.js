import { SERVICE_DIRECTIONS } from '@/constants'
import { formatServiceSummary } from '@/utils/formatters'

export function nomeGrupo(grupos, groupId) {
  return grupos.find((g) => g.id === groupId)?.name || `Grupo #${groupId}`
}

export function nomeServico(servicos, serviceId) {
  const s = servicos.find((item) => item.id === serviceId)
  return s ? formatServiceSummary(s) : `Serviço #${serviceId}`
}

export function viagensDoDia(viagensDia, dayId) {
  return viagensDia.filter((t) => t.service_day === dayId)
}

export function categoriaDia(viagensDia, day) {
  if (day.canceled_at) return 'canceladas'
  const travels = viagensDoDia(viagensDia, day.id)
  const todasFinalizadas =
    travels.length > 0 && travels.every((t) => t.status === 'finished' || t.status === 'canceled')
  if (day.window === 'closed' || todasFinalizadas) return 'encerradas'
  return 'em_andamento'
}

export function summarizeEligibilities(list) {
  let semResposta = 0
  let negativas = 0
  let comIda = 0
  let comRetorno = 0
  for (const e of list) {
    const r = e.response
    if (!r || !r.answered_at) {
      semResposta++
      continue
    }
    const idaAtiva = r.outbound_service && !r.outbound_withdrawn_at
    const voltaAtiva = r.return_service && !r.return_withdrawn_at
    if (!idaAtiva && !voltaAtiva) negativas++
    else {
      if (idaAtiva) comIda++
      if (voltaAtiva) comRetorno++
    }
  }
  return { total: list.length, semResposta, negativas, comIda, comRetorno }
}

export function resumoRespostasDia(elegibilidadesDia, dayId) {
  return summarizeEligibilities(elegibilidadesDia.filter((e) => e.day === dayId))
}

export function participacoesListaDaViagem(participacoesViagem, travelId) {
  return participacoesViagem.filter(
    (p) => p.travel === travelId && ['allocated', 'on_board'].includes(p.status),
  )
}

export function originPointForTravel({ travel, servicos, todosVeiculos, pontosOperacionais }) {
  if (!travel) return null
  const service = (servicos || []).find((s) => s.id === travel.service)
  const vehicle = (todosVeiculos || []).find((v) => v.id === (travel.vehicle || service?.vehicle))
  const originId = service?.origin || vehicle?.garage_point
  return originId ? (pontosOperacionais || []).find((p) => p.id === originId) || null : null
}

export function destinationPointForTravel({ travel, servicos, grupos, todosVeiculos, pontosOperacionais }) {
  if (!travel) return null
  const service = (servicos || []).find((s) => s.id === travel.service)
  const group = (grupos || []).find((g) => g.id === service?.route_group)
  const vehicle = (todosVeiculos || []).find((v) => v.id === (travel.vehicle || service?.vehicle))
  const destId =
    service?.destination ||
    (service?.direction === SERVICE_DIRECTIONS.OUTBOUND ? group?.destination : vehicle?.garage_point)
  return destId ? (pontosOperacionais || []).find((p) => p.id === destId) || null : null
}

export function snapshotDaViagem(snapshotsViagem, travel) {
  if (travel.current_snapshot) {
    const current = snapshotsViagem.find((s) => s.id === travel.current_snapshot)
    if (current) return current
  }
  let latest = null
  for (const snapshot of snapshotsViagem) {
    if (snapshot.travel === travel.id && (!latest || snapshot.id > latest.id)) latest = snapshot
  }
  return latest
}

export function jobDoSnapshot(snapshotsViagem, jobsCalculo, travel) {
  const snapshot = snapshotDaViagem(snapshotsViagem, travel)
  return snapshot ? jobsCalculo.find((j) => j.snapshot === snapshot.id) || null : null
}

export function tomorrowIsoString() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function buildBatchDatesPreview(startDate, horizonDays, batchSize) {
  const total = Math.min(Number(horizonDays) || 0, Number(batchSize) || 0, 31)
  if (!startDate || total < 1) return []
  const base = new Date(`${startDate}T12:00:00`)
  if (Number.isNaN(base.getTime())) return []
  const dias = []
  for (let i = 0; i < total; i++) {
    const d = new Date(base)
    d.setDate(base.getDate() + i)
    dias.push({
      iso: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' }),
    })
  }
  return dias
}
