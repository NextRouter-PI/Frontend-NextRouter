import { formatServiceSummary } from '@/utils/formatters'
import { summarizeEligibilities } from '@/features/company/utils/operationLookups'

const EMPTY_SUMMARY = Object.freeze({ total: 0, semResposta: 0, negativas: 0, comIda: 0, comRetorno: 0 })

/**
 * Pré-indexa coleções da operação datada em Maps O(1) para evitar varreduras O(N²) nos templates.
 */
export function buildOperationIndexes(store) {
  const groupNames = new Map()
  for (const g of store.grupos || []) groupNames.set(g.id, g.name)

  const serviceNames = new Map()
  for (const s of store.servicos || []) serviceNames.set(s.id, formatServiceSummary(s))

  const travelsByDay = new Map()
  for (const t of store.viagensDia || []) {
    const bucket = travelsByDay.get(t.service_day)
    if (bucket) bucket.push(t)
    else travelsByDay.set(t.service_day, [t])
  }

  const eligByDay = new Map()
  for (const e of store.elegibilidadesDia || []) {
    const bucket = eligByDay.get(e.day)
    if (bucket) bucket.push(e)
    else eligByDay.set(e.day, [e])
  }
  const resumoByDay = new Map()
  for (const [dayId, list] of eligByDay) {
    resumoByDay.set(dayId, summarizeEligibilities(list))
  }

  const activeParticipantsCountByTravel = new Map()
  for (const p of store.participacoesViagem || []) {
    if (p.status === 'allocated' || p.status === 'on_board') {
      activeParticipantsCountByTravel.set(p.travel, (activeParticipantsCountByTravel.get(p.travel) || 0) + 1)
    }
  }

  const snapshotById = new Map()
  const latestSnapshotByTravel = new Map()
  for (const snap of store.snapshotsViagem || []) {
    snapshotById.set(snap.id, snap)
    const prev = latestSnapshotByTravel.get(snap.travel)
    if (!prev || snap.id > prev.id) latestSnapshotByTravel.set(snap.travel, snap)
  }

  const jobBySnapshot = new Map()
  for (const job of store.jobsCalculo || []) {
    if (!jobBySnapshot.has(job.snapshot)) jobBySnapshot.set(job.snapshot, job)
  }

  const getSnapshot = (travel) =>
    (travel.current_snapshot && snapshotById.get(travel.current_snapshot)) ||
    latestSnapshotByTravel.get(travel.id) ||
    null

  return {
    getGroupName: (id) => groupNames.get(id) || `Grupo #${id}`,
    getServiceName: (id) => serviceNames.get(id) || `Serviço #${id}`,
    getTravels: (dayId) => travelsByDay.get(dayId) || [],
    getResumo: (dayId) => resumoByDay.get(dayId) || EMPTY_SUMMARY,
    getParticipantsCount: (travelId) => activeParticipantsCountByTravel.get(travelId) || 0,
    getSnapshot,
    getJob: (travel) => {
      const snap = getSnapshot(travel)
      return snap ? jobBySnapshot.get(snap.id) || null : null
    },
  }
}
