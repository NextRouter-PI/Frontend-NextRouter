import { reactive, watch } from 'vue'
import api from '@/api/client'
import { state as authState } from '@/stores/state'
import { sessionError } from '@/stores/session'
import { formatApiError } from '@/utils/apiErrors'
import {
  listTravels,
  listTravelParticipations,
  listRouteSnapshots,
  listRouteStops,
  listGroupMemberships,
  listEligibilities,
  listDriverInvitations,
  startTravel,
  finishTravel,
  reportTravelUnavailability,
  recordParticipationPresence,
  handleRouteStop,
  respondDriverInvitation,
} from '@/api/transport'

const state = reactive({
  passenger: null,
  driver: null,
  loading: false,
  busy: false,
  error: null,
  notice: null,
})

let activeController = null

function formatTime(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function pointLabel(point) {
  if (!point || typeof point !== 'object') return '—'
  const parts = [point.name, point.street && point.number ? `${point.street}, ${point.number}` : point.street, point.city && point.state ? `${point.city}/${point.state}` : point.city].filter(Boolean)
  return parts.length ? parts.join(' · ') : '—'
}

function nextSignal() {
  activeController?.abort()
  activeController = new AbortController()
  return activeController.signal
}

function resetTransportState() {
  activeController?.abort()
  activeController = null
  state.passenger = null
  state.driver = null
  state.loading = false
  state.busy = false
  state.error = null
  state.notice = null
}

watch(() => `${authState.logged}:${authState.user?.id || ''}:${authState.role || ''}`, () => {
  resetTransportState()
}, { flush: 'sync' })

async function loadDriverData(selectedTravelId = null) {
  const signal = nextSignal()
  const ownerId = authState.user?.id
  state.loading = true
  state.error = null

  try {
    const { data: driver } = await api.get('/drivers/me/', { signal })
    if (signal.aborted || authState.user?.id !== ownerId) return

    const [travels, invitations] = await Promise.all([
      listTravels({ driver: driver.id }, { signal }),
      listDriverInvitations({}, { signal }),
    ])
    if (signal.aborted || authState.user?.id !== ownerId) return

    const currentTravel =
      (selectedTravelId && travels.find((t) => t.id === Number(selectedTravelId))) ||
      travels.find((t) => t.status === 'in_progress') ||
      travels.find((t) => t.status === 'scheduled' && t.publication_current) ||
      travels.find((t) => t.status === 'scheduled') ||
      travels[0] ||
      null

    let participations = []
    let snapshot = null
    let stops = []

    if (currentTravel) {
      const snapshotId = currentTravel.published_snapshot || currentTravel.current_snapshot
      const [partsRes, snapsRes, stopsRes] = await Promise.all([
        listTravelParticipations({ travel: currentTravel.id }, { signal }),
        snapshotId ? listRouteSnapshots({ travel: currentTravel.id }, { signal }) : Promise.resolve([]),
        snapshotId ? listRouteStops({ snapshot: snapshotId }, { signal }) : Promise.resolve([]),
      ])
      if (signal.aborted || authState.user?.id !== ownerId) return
      participations = partsRes
      snapshot = snapsRes.find((s) => s.id === snapshotId) || snapsRes[0] || null
      stops = stopsRes
    }

    const partsById = new Map(participations.map((p) => [p.id, p]))
    const enrichedStops = stops.map((stop) => ({
      ...stop,
      pointLabel: pointLabel(stop.point_snapshot),
      enrichedParticipants: (stop.participants || []).map((sp) => {
        const part = partsById.get(sp.participation)
        return {
          ...sp,
          name: part?.name || `Participante #${sp.participation}`,
          status: part?.status || 'allocated',
        }
      }),
    }))

    state.driver = {
      driverId: driver.id,
      travels,
      invitations,
      travel: currentTravel,
      travelId: currentTravel?.id || null,
      travelStatus: currentTravel?.status || null,
      planningStatus: currentTravel?.planning_status || null,
      revision: currentTravel?.revision ?? null,
      publishedRevision: currentTravel?.published_revision ?? null,
      publicationCurrent: Boolean(currentTravel?.publication_current),
      vehicleId: currentTravel?.vehicle || null,
      rota: {
        ponto_origem: pointLabel(snapshot?.origin),
        ponto_destino: pointLabel(snapshot?.destination),
        horario_saida: formatTime(currentTravel?.started_at || currentTravel?.planned_start),
        horario_chegada: formatTime(currentTravel?.finished_at || currentTravel?.planned_end),
        distanciaKm: snapshot?.distance_meters != null ? (snapshot.distance_meters / 1000).toFixed(1) : null,
        duracaoMin: snapshot?.duration_seconds != null ? Math.round(snapshot.duration_seconds / 60) : null,
      },
      participations,
      stops: enrichedStops,
      passageirosNaRota: participations.filter((p) => ['allocated', 'on_board', 'dropped_off'].includes(p.status)).length,
      passageirosEmbarcados: participations.filter((p) => p.status === 'on_board').length,
      passageirosPendentes: participations.filter((p) => p.status === 'allocated').length,
    }
  } catch (error) {
    if (!signal.aborted && authState.user?.id === ownerId) {
      state.error = sessionError(error, formatApiError(error, 'Erro ao carregar dados operacionais do motorista.'))
      state.driver = null
    }
  } finally {
    if (!signal.aborted && authState.user?.id === ownerId) state.loading = false
  }
}

async function loadPassengerData(selectedTravelId = null) {
  const signal = nextSignal()
  const ownerId = authState.user?.id
  state.loading = true
  state.error = null

  try {
    await api.get('/passengers/me/', { signal })
    if (signal.aborted || authState.user?.id !== ownerId) return

    const [groupMemberships, eligibilities, participations, travels] = await Promise.all([
      listGroupMemberships({}, { signal }),
      listEligibilities({}, { signal }),
      listTravelParticipations({}, { signal }),
      listTravels({}, { signal }),
    ])
    if (signal.aborted || authState.user?.id !== ownerId) return

    const activeGroups = groupMemberships.filter((gm) => !gm.ended_at)
    const travelsMap = new Map(travels.map((t) => [t.id, t]))

    const enrichedParticipations = participations.map((p) => {
      const travel = travelsMap.get(p.travel) || null
      return {
        ...p,
        travelData: travel,
        date: travel?.date || '—',
        direction: travel?.direction || p.leg,
        travelStatus: travel?.status || 'scheduled',
        planningStatus: travel?.planning_status || 'draft',
        revision: travel?.revision ?? null,
        publishedRevision: travel?.published_revision ?? null,
        publicationCurrent: Boolean(travel?.publication_current),
        plannedStartLabel: formatTime(travel?.planned_start),
        plannedEndLabel: formatTime(travel?.planned_end),
        startedAtLabel: formatTime(travel?.started_at),
        finishedAtLabel: formatTime(travel?.finished_at),
      }
    })

    const currentParticipation =
      (selectedTravelId && enrichedParticipations.find((p) => p.travel === Number(selectedTravelId))) ||
      enrichedParticipations.find((p) => p.travelStatus === 'in_progress' && ['allocated', 'on_board'].includes(p.status)) ||
      enrichedParticipations.find((p) => p.publicationCurrent && ['allocated', 'on_board'].includes(p.status)) ||
      enrichedParticipations[0] ||
      null

    const currentTravel = currentParticipation?.travelData || null
    const currentEligibility = currentParticipation
      ? eligibilities.find((e) => e.id === currentParticipation.eligibility) || null
      : eligibilities[0] || null

    let snapshot = null
    let stops = []
    const snapshotId = currentTravel?.published_snapshot || currentTravel?.current_snapshot
    if (currentTravel && snapshotId) {
      try {
        const [snapsRes, stopsRes] = await Promise.all([
          listRouteSnapshots({ travel: currentTravel.id }, { signal }),
          listRouteStops({ snapshot: snapshotId }, { signal }),
        ])
        if (!signal.aborted && authState.user?.id === ownerId) {
          snapshot = snapsRes.find((s) => s.id === snapshotId) || snapsRes[0] || null
          stops = stopsRes
        }
      } catch {
        // Snapshot/paradas podem estar indisponíveis conforme permissão ou estado da publicação
      }
    }

    state.passenger = {
      attached: activeGroups.length > 0,
      activeGroups,
      eligibilitiesCount: eligibilities.length,
      participations: enrichedParticipations,
      currentParticipation,
      travel: currentTravel,
      travelId: currentTravel?.id || null,
      travelStatus: currentTravel?.status || null,
      publicationCurrent: Boolean(currentTravel?.publication_current),
      publishedRevision: currentTravel?.published_revision ?? null,
      snapshot,
      stops,
      pointLabel: pointLabel(currentEligibility?.point_snapshot),
      rota: {
        ponto_origem: currentTravel?.direction === 'outbound' ? pointLabel(currentEligibility?.point_snapshot) : 'Destino do grupo',
        ponto_destino: currentTravel?.direction === 'outbound' ? 'Destino do grupo' : pointLabel(currentEligibility?.point_snapshot),
        horario_saida: formatTime(currentTravel?.started_at || currentTravel?.planned_start),
        horario_chegada: formatTime(currentTravel?.finished_at || currentTravel?.planned_end),
      },
    }
  } catch (error) {
    if (!signal.aborted && authState.user?.id === ownerId) {
      state.error = sessionError(error, formatApiError(error, 'Erro ao carregar dados de transporte do passageiro.'))
      state.passenger = null
    }
  } finally {
    if (!signal.aborted && authState.user?.id === ownerId) state.loading = false
  }
}

async function runDriverMutation(operation, successMessage, reloadTravelId = null) {
  if (state.busy || !authState.logged) return false
  const ownerId = authState.user?.id
  state.busy = true
  state.error = null
  state.notice = null
  try {
    await operation()
    if (authState.user?.id !== ownerId) return false
    state.notice = successMessage
    await loadDriverData(reloadTravelId ?? state.driver?.travelId)
    return true
  } catch (error) {
    if (authState.user?.id === ownerId) {
      state.error = sessionError(error, formatApiError(error, 'Não foi possível concluir a operação.'))
    }
    return false
  } finally {
    if (authState.user?.id === ownerId) state.busy = false
  }
}

function iniciarViagemDesignada(travel) {
  if (!travel) return false
  return runDriverMutation(
    () => startTravel(travel.id, travel.revision),
    `Viagem #${travel.id} iniciada na revisão publicada ${travel.revision}.`,
    travel.id,
  )
}

function finalizarViagemDesignada(travel) {
  if (!travel) return false
  return runDriverMutation(
    () => finishTravel(travel.id),
    `Viagem #${travel.id} finalizada.`,
    travel.id,
  )
}

function informarIndisponibilidade(travel) {
  if (!travel) return false
  const operationId = globalThis.crypto?.randomUUID?.() || `00000000-0000-4000-8000-${String(Date.now()).padStart(12, '0').slice(-12)}`
  return runDriverMutation(
    () => reportTravelUnavailability(travel.id, operationId),
    `Indisponibilidade informada para a viagem #${travel.id}. A empresa foi notificada para convidar substituto.`,
  )
}

function registrarPresencaParticipante(participationId, kind) {
  const operationId = globalThis.crypto?.randomUUID?.() || `00000000-0000-4000-8000-${String(Date.now()).padStart(12, '0').slice(-12)}`
  const labels = {
    boarded: 'Embarque registrado.',
    no_show: 'Ausência registrada.',
    dropped_off: 'Desembarque registrado.',
  }
  return runDriverMutation(
    () => recordParticipationPresence(participationId, { kind, operation_id: operationId }),
    labels[kind] || 'Evento de presença registrado.',
  )
}

function tratarParadaPercurso(stopId, skipped = false) {
  return runDriverMutation(
    () => handleRouteStop(stopId, { skipped }),
    skipped ? 'Parada marcada como ignorada.' : 'Parada marcada como concluída.',
  )
}

function responderConviteMotorista(invitationId, accept) {
  return runDriverMutation(
    () => respondDriverInvitation(invitationId, accept),
    accept ? 'Convite aceito. A empresa deverá recalcular e publicar a viagem antes do início.' : 'Convite recusado.',
  )
}

export function useTransportState() {
  return {
    state,
    loadPassengerData,
    loadDriverData,
    iniciarViagemDesignada,
    finalizarViagemDesignada,
    informarIndisponibilidade,
    registrarPresencaParticipante,
    tratarParadaPercurso,
    responderConviteMotorista,
  }
}
