import api from '../../client'
import { asList, trimString } from '../helpers'

export async function listTravels(params = {}, { signal } = {}) {
  const { data } = await api.get('/travels/', { params, signal })
  return asList(data)
}

export async function calculateTravel(travelId, expectedRevision, { signal } = {}) {
  const { data } = await api.post(
    `/travels/${encodeURIComponent(travelId)}/calculate/`,
    { expected_revision: Number(expectedRevision) },
    { signal },
  )
  return data
}

export async function publishTravel(travelId, expectedRevision, { signal } = {}) {
  const { data } = await api.post(
    `/travels/${encodeURIComponent(travelId)}/publish/`,
    { expected_revision: Number(expectedRevision) },
    { signal },
  )
  return data
}

export async function startTravel(travelId, expectedRevision, { signal } = {}) {
  const { data } = await api.post(
    `/travels/${encodeURIComponent(travelId)}/start/`,
    { expected_revision: Number(expectedRevision) },
    { signal },
  )
  return data
}

export async function finishTravel(travelId, { signal } = {}) {
  const { data } = await api.post(`/travels/${encodeURIComponent(travelId)}/finish/`, {}, { signal })
  return data
}

// Desembarca de uma vez todos que estão a bordo (fim do percurso).
export async function dropAllTravel(travelId, { signal } = {}) {
  const { data } = await api.post(`/travels/${encodeURIComponent(travelId)}/drop-all/`, {}, { signal })
  return data
}

export async function cancelTravel(travelId, { signal } = {}) {
  const { data } = await api.post(`/travels/${encodeURIComponent(travelId)}/cancel/`, {}, { signal })
  return data
}

export async function assignTravelVehicle(travelId, vehicleId, { signal } = {}) {
  const { data } = await api.post(
    `/travels/${encodeURIComponent(travelId)}/assign-vehicle/`,
    { vehicle_id: Number(vehicleId) },
    { signal },
  )
  return data
}

export async function inviteTravelDriver(travelId, { driver_membership_id, expires_at }, { signal } = {}) {
  const { data } = await api.post(
    `/travels/${encodeURIComponent(travelId)}/invite-driver/`,
    { driver_membership_id: Number(driver_membership_id), expires_at: trimString(expires_at) },
    { signal },
  )
  return data
}

export async function reportTravelUnavailability(travelId, operationId, { signal } = {}) {
  const { data } = await api.post(
    `/travels/${encodeURIComponent(travelId)}/unavailability/`,
    { operation_id: operationId },
    { signal },
  )
  return data
}

export async function readTravelLocation(travelId, { signal } = {}) {
  const { data } = await api.get(`/travels/${encodeURIComponent(travelId)}/location/`, { signal })
  return data
}

// Caminho de rua da última posição enviada pelo motorista até a próxima parada pendente.
export async function readTravelApproach(travelId, { signal } = {}) {
  const { data } = await api.get(`/travels/${encodeURIComponent(travelId)}/approach/`, { signal })
  return data
}

// Só para o próprio passageiro: traçado do motorista até ele e dele até o destino ([lng, lat]).
export async function readParticipationRoute(participationId, { signal } = {}) {
  const { data } = await api.get(`/travel-participations/${encodeURIComponent(participationId)}/route/`, { signal })
  return data
}

export async function listTravelParticipations(params = {}, { signal } = {}) {
  const { data } = await api.get('/travel-participations/', { params, signal })
  return asList(data)
}

export async function recordParticipationPresence(participationId, { kind, operation_id }, { signal } = {}) {
  const { data } = await api.post(
    `/travel-participations/${encodeURIComponent(participationId)}/record/`,
    { kind, operation_id },
    { signal },
  )
  return data
}

export async function getRouteSnapshot(snapshotId, { signal } = {}) {
  const { data } = await api.get(`/route-snapshots/${encodeURIComponent(snapshotId)}/`, { signal })
  return data
}

export async function listRouteSnapshots(params = {}, { signal } = {}) {
  const { data } = await api.get('/route-snapshots/', { params, signal })
  return asList(data)
}

export async function listRouteStops(params = {}, { signal } = {}) {
  const { data } = await api.get('/route-stops/', { params, signal })
  return asList(data)
}

export async function handleRouteStop(stopId, { skipped = false } = {}, { signal } = {}) {
  const { data } = await api.post(
    `/route-stops/${encodeURIComponent(stopId)}/handle/`,
    { skipped: Boolean(skipped) },
    { signal },
  )
  return data
}

export async function listOptimizationJobs(params = {}, { signal } = {}) {
  const { data } = await api.get('/optimization-jobs/', { params, signal })
  return asList(data)
}

export async function listDriverInvitations(params = {}, { signal } = {}) {
  const { data } = await api.get('/driver-invitations/', { params, signal })
  return asList(data)
}

export async function respondDriverInvitation(invitationId, accept, { signal } = {}) {
  const { data } = await api.post(
    `/driver-invitations/${encodeURIComponent(invitationId)}/respond/`,
    { accept: Boolean(accept) },
    { signal },
  )
  return data
}
