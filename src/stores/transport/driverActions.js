import api from '@/api/client'
import { sessionError } from '@/stores/session'
import { formatApiError } from '@/utils/apiErrors'
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
import { buildDriverTransportState, selectActiveDriverTravel } from '@/stores/mappers/executionMapper'
import { createOperationId } from './helpers'

const PRESENCE_LABELS = {
  boarded: 'Embarque registrado.',
  no_show: 'Ausência registrada.',
  dropped_off: 'Desembarque registrado.',
}

export function createDriverTransportActions({ state, auth, nextSignal }) {
  async function loadDriverData(selectedTravelId = null) {
    const signal = nextSignal()
    const ownerId = auth.user?.id
    state.loading = true
    state.error = null

    try {
      const { data: driver } = await api.get('/drivers/me/', { signal })
      if (signal.aborted || auth.user?.id !== ownerId) return

      const [travels, invitations] = await Promise.all([
        listTravels({ driver: driver.id }, { signal }),
        listDriverInvitations({}, { signal }),
      ])
      if (signal.aborted || auth.user?.id !== ownerId) return

      const currentTravel = selectActiveDriverTravel(travels, selectedTravelId)
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
        if (signal.aborted || auth.user?.id !== ownerId) return
        participations = partsRes
        snapshot = snapsRes.find((s) => s.id === snapshotId) || snapsRes[0] || null
        stops = stopsRes
      }

      state.driver = buildDriverTransportState({
        driver,
        travels,
        invitations,
        currentTravel,
        participations,
        snapshot,
        stops,
      })
    } catch (error) {
      if (!signal.aborted && auth.user?.id === ownerId) {
        state.error = sessionError(error, formatApiError(error, 'Erro ao carregar dados operacionais do motorista.'))
        state.driver = null
      }
    } finally {
      if (!signal.aborted && auth.user?.id === ownerId) state.loading = false
    }
  }

  async function runDriverMutation(operation, successMessage, reloadTravelId = null) {
    if (state.busy || !auth.logged) return false
    const ownerId = auth.user?.id
    state.busy = true
    state.error = null
    state.notice = null
    try {
      await operation()
      if (auth.user?.id !== ownerId) return false
      state.notice = successMessage
      await loadDriverData(reloadTravelId ?? state.driver?.travelId)
      return true
    } catch (error) {
      if (auth.user?.id === ownerId) {
        state.error = sessionError(error, formatApiError(error, 'Não foi possível concluir a operação.'))
      }
      return false
    } finally {
      if (auth.user?.id === ownerId) state.busy = false
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
      return runDriverMutation(() => finishTravel(travel.id), `Viagem #${travel.id} finalizada.`, travel.id)
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
