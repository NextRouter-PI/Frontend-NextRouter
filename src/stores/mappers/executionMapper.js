import { formatTimeBr as formatTime } from '@/utils/formatters'
import { pointLabel } from '@/stores/transport/helpers'

export function selectActiveDriverTravel(travels, selectedTravelId) {
  return (
    (selectedTravelId && travels.find((t) => t.id === Number(selectedTravelId))) ||
    travels.find((t) => t.status === 'in_progress') ||
    travels.find((t) => t.status === 'scheduled' && t.publication_current) ||
    travels.find((t) => t.status === 'scheduled') ||
    travels[0] ||
    null
  )
}

export function buildDriverTransportState({ driver, travels, invitations, currentTravel, participations, snapshot, stops }) {
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

  return {
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
}

export function enrichPassengerParticipations(participations, travels) {
  const travelsMap = new Map(travels.map((t) => [t.id, t]))
  return participations.map((p) => {
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
}

export function buildPassengerTransportState({
  activeGroups,
  eligibilities,
  enrichedParticipations,
  currentParticipation,
  currentTravel,
  currentEligibility,
  snapshot,
  stops,
}) {
  return {
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
}
