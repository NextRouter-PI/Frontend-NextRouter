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
  listGroupMemberships,
  listEligibilities,
} from '@/api/transport'
import { pointLabel } from './helpers'

export function createPassengerTransportActions({ state, nextSignal }) {
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
        enrichedParticipations.find(
          (p) => p.travelStatus === 'in_progress' && ['allocated', 'on_board'].includes(p.status),
        ) ||
        enrichedParticipations.find(
          (p) => p.publicationCurrent && ['allocated', 'on_board'].includes(p.status),
        ) ||
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
        pointSnapshot: currentEligibility?.point_snapshot || null,
        pointLabel: pointLabel(currentEligibility?.point_snapshot),
        rota: {
          ponto_origem:
            currentTravel?.direction === 'outbound'
              ? pointLabel(currentEligibility?.point_snapshot)
              : 'Destino do grupo',
          ponto_destino:
            currentTravel?.direction === 'outbound'
              ? 'Destino do grupo'
              : pointLabel(currentEligibility?.point_snapshot),
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

  return { loadPassengerData }
}
