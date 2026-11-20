import api from '@/api/client'
import { state as authState } from '@/stores/state'
import { sessionError } from '@/stores/session'
import { formatApiError } from '@/utils/apiErrors'
import { formatTimeBr as formatTime } from '@/utils/formatters'
import {
  listTravels,
  listTravelParticipations,
  listRouteSnapshots,
  listRouteStops,
  listDriverInvitations,
  startTravel,
  finishTravel,
  reportTravelUnavailability,
  recordParticipationPresence,
  handleRouteStop,
  respondDriverInvitation,
} from '@/api/transport'
import { createOperationId, pointLabel } from './helpers'

const PRESENCE_LABELS = {
  boarded: 'Embarque registrado.',
  no_show: 'Ausência registrada.',
  dropped_off: 'Desembarque registrado.',
}

export function createDriverTransportActions({ state, nextSignal }) {
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
        snapshot,
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

  return {
    loadDriverData,
    iniciarViagemDesignada(travel) {
      if (!travel) return false
      return runDriverMutation(
        () => startTravel(travel.id, travel.revision),
        `Viagem #${travel.id} iniciada na revisão publicada ${travel.revision}.`,
        travel.id,
      )
    },
    finalizarViagemDesignada(travel) {
      if (!travel) return false
      return runDriverMutation(
        () => finishTravel(travel.id),
        `Viagem #${travel.id} finalizada.`,
        travel.id,
      )
    },
    informarIndisponibilidade(travel) {
      if (!travel) return false
      return runDriverMutation(
        () => reportTravelUnavailability(travel.id, createOperationId()),
        `Indisponibilidade informada para a viagem #${travel.id}. A empresa foi notificada para convidar substituto.`,
      )
    },
    registrarPresencaParticipante(participationId, kind) {
      return runDriverMutation(
        () => recordParticipationPresence(participationId, { kind, operation_id: createOperationId() }),
        PRESENCE_LABELS[kind] || 'Evento de presença registrado.',
      )
    },
    tratarParadaPercurso(stopId, skipped = false) {
      return runDriverMutation(
        () => handleRouteStop(stopId, { skipped }),
        skipped ? 'Parada marcada como ignorada.' : 'Parada marcada como concluída.',
      )
    },
    responderConviteMotorista(invitationId, accept) {
      return runDriverMutation(
        () => respondDriverInvitation(invitationId, accept),
        accept
          ? 'Convite aceito. A empresa deverá recalcular e publicar a viagem antes do início.'
          : 'Convite recusado.',
      )
    },
  }
}
