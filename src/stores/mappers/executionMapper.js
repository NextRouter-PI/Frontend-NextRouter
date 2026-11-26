import { markRaw } from 'vue'
import { formatTimeBr as formatTime } from '@/utils/formatters'
import { pointLabel } from '@/stores/transport/helpers'

export function selectActiveDriverTravel(travels, selectedTravelId) {
  // A API lista da data mais nova para a mais antiga; a próxima viagem é a agendada mais próxima.
  const upcoming = travels
    .filter((t) => t.status === 'scheduled')
    .sort((a, b) => String(a.date || '').localeCompare(String(b.date || '')) || a.id - b.id)
  return (
    (selectedTravelId && travels.find((t) => t.id === Number(selectedTravelId))) ||
    travels.find((t) => t.status === 'in_progress') ||
    upcoming.find((t) => t.publication_current) ||
    upcoming[0] ||
    travels[0] ||
    null
  )
}

export function buildDriverTransportState({ driver, travels, invitations, currentTravel, participations, snapshot, stops }) {
  const partsById = new Map(participations.map((p) => [p.id, p]))
  const rawSnapshot = snapshot ? markRaw(snapshot) : null
  const enrichedStops = []
  for (const stop of stops) {
    const enrichedParticipants = []
    for (const sp of stop.participants || []) {
      const part = partsById.get(sp.participation)
      enrichedParticipants.push(
        Object.assign({}, sp, {
          name: part?.name || `Participante #${sp.participation}`,
          status: part?.status || 'allocated',
        }),
      )
    }
    enrichedStops.push(
      Object.assign({}, stop, {
        pointLabel: pointLabel(stop.point_snapshot),
        enrichedParticipants,
      }),
    )
  }

  let naRota = 0
  let embarcados = 0
  let pendentes = 0
  for (const p of participations) {
    if (p.status === 'allocated') {
      naRota++
      pendentes++
    } else if (p.status === 'on_board') {
      naRota++
      embarcados++
    } else if (p.status === 'dropped_off') {
      naRota++
    }
  }

  return {
    driverId: driver.id,
    locationConsentAt: driver.location_consent_at || null,
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
    snapshot: rawSnapshot,
    rota: {
      ponto_origem: pointLabel(rawSnapshot?.origin),
      ponto_destino: pointLabel(rawSnapshot?.destination),
      horario_saida: formatTime(currentTravel?.started_at || currentTravel?.planned_start),
      horario_chegada: formatTime(currentTravel?.finished_at || currentTravel?.planned_end),
      distanciaKm: rawSnapshot?.distance_meters != null ? (rawSnapshot.distance_meters / 1000).toFixed(1) : null,
      duracaoMin: rawSnapshot?.duration_seconds != null ? Math.round(rawSnapshot.duration_seconds / 60) : null,
    },
    participations,
    stops: enrichedStops,
    passageirosNaRota: naRota,
    passageirosEmbarcados: embarcados,
    passageirosPendentes: pendentes,
  }
}

export function enrichPassengerParticipations(participations, travels) {
  const travelsMap = new Map(travels.map((t) => [t.id, t]))
  const result = []
  for (const p of participations) {
    const travel = travelsMap.get(p.travel) || null
    result.push(
      Object.assign({}, p, {
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
      }),
    )
  }
  return result
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
    snapshot: snapshot ? markRaw(snapshot) : null,
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
