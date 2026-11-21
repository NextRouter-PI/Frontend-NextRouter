import api from '@/api/client'
import { sessionError } from '@/stores/session'
import { formatApiError } from '@/utils/apiErrors'
import {
  listTravels,
  listTravelParticipations,
  listRouteSnapshots,
  listRouteStops,
  listGroupMemberships,
  listEligibilities,
} from '@/api/transport'
import {
  buildPassengerTransportState,
  enrichPassengerParticipations,
} from '@/stores/mappers/executionMapper'

function selectCurrentParticipation(enrichedParticipations, selectedTravelId) {
  return (
    (selectedTravelId && enrichedParticipations.find((p) => p.travel === Number(selectedTravelId))) ||
    enrichedParticipations.find(
      (p) => p.travelStatus === 'in_progress' && ['allocated', 'on_board'].includes(p.status),
    ) ||
    enrichedParticipations.find(
      (p) => p.publicationCurrent && ['allocated', 'on_board'].includes(p.status),
    ) ||
    enrichedParticipations[0] ||
    null
  )
}

export function createPassengerTransportActions({ state, auth, nextSignal }) {
  async function loadPassengerData(selectedTravelId = null) {
    const signal = nextSignal()
    const ownerId = auth.user?.id
    state.loading = true
    state.error = null

    try {
      await api.get('/passengers/me/', { signal })
      if (signal.aborted || auth.user?.id !== ownerId) return

      const [groupMemberships, eligibilities, participations, travels] = await Promise.all([
        listGroupMemberships({}, { signal }),
        listEligibilities({}, { signal }),
        listTravelParticipations({}, { signal }),
        listTravels({}, { signal }),
      ])
      if (signal.aborted || auth.user?.id !== ownerId) return

      const activeGroups = groupMemberships.filter((gm) => !gm.ended_at)
      const enrichedParticipations = enrichPassengerParticipations(participations, travels)
      const currentParticipation = selectCurrentParticipation(enrichedParticipations, selectedTravelId)
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
          if (!signal.aborted && auth.user?.id === ownerId) {
            snapshot = snapsRes.find((s) => s.id === snapshotId) || snapsRes[0] || null
            stops = stopsRes
          }
        } catch {
          // Snapshot/paradas podem estar indisponíveis conforme permissão ou estado da publicação
        }
      }

      state.passenger = buildPassengerTransportState({
        activeGroups,
        eligibilities,
        enrichedParticipations,
        currentParticipation,
        currentTravel,
        currentEligibility,
        snapshot,
        stops,
      })
    } catch (error) {
      if (!signal.aborted && auth.user?.id === ownerId) {
        state.error = sessionError(error, formatApiError(error, 'Erro ao carregar dados de transporte do passageiro.'))
        state.passenger = null
      }
    } finally {
      if (!signal.aborted && auth.user?.id === ownerId) state.loading = false
    }
  }

  return { loadPassengerData }
}
