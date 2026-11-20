import api from '../client'
import { asList, trimString } from './helpers'

export async function generateGroupHorizon(
  groupId,
  { start_date, horizon_days, batch_size, excluded_dates = [] },
  { signal } = {},
) {
  const payload = {
    start_date: trimString(start_date),
    horizon_days: Number(horizon_days),
    batch_size: Number(batch_size),
  }
  if (Array.isArray(excluded_dates) && excluded_dates.length) {
    payload.excluded_dates = excluded_dates
  }
  const { data } = await api.post(`/company-route-groups/${encodeURIComponent(groupId)}/generate/`, payload, {
    signal,
  })
  return asList(data)
}

export async function cancelGroupDate(groupId, { date, reason }, { signal } = {}) {
  const { data } = await api.post(
    `/company-route-groups/${encodeURIComponent(groupId)}/cancel-date/`,
    { date: trimString(date), reason: trimString(reason) },
    { signal },
  )
  return data
}

export async function getAutomationStatus(groupId, { signal } = {}) {
  const { data } = await api.get(`/company-route-groups/${encodeURIComponent(groupId)}/automation-status/`, {
    signal,
  })
  return data
}

export async function saveAutomationSchedule(groupId, input, { signal } = {}) {
  const payload = {
    enabled: Boolean(input.enabled),
    horizon_days: Number(input.horizon_days),
    batch_size: Number(input.batch_size),
    interval_seconds: Number(input.interval_seconds),
    next_run_at: trimString(input.next_run_at),
    expected_revision: Number(input.expected_revision ?? 0),
  }
  const { data } = await api.post(`/company-route-groups/${encodeURIComponent(groupId)}/automation/`, payload, {
    signal,
  })
  return data
}

export async function listServiceDays(params = {}, { signal } = {}) {
  const { data } = await api.get('/service-days/', { params, signal })
  return asList(data)
}

export async function closeServiceDay(dayId, { signal } = {}) {
  const { data } = await api.post(`/service-days/${encodeURIComponent(dayId)}/close/`, {}, { signal })
  return data
}

export async function reviseServiceDay(dayId, expectedRevision, { signal } = {}) {
  const { data } = await api.post(
    `/service-days/${encodeURIComponent(dayId)}/revise/`,
    { expected_revision: Number(expectedRevision) },
    { signal },
  )
  return data
}

export async function cancelServiceDay(dayId, reason, { signal } = {}) {
  const { data } = await api.post(
    `/service-days/${encodeURIComponent(dayId)}/cancel/`,
    { reason: trimString(reason) },
    { signal },
  )
  return data
}

export async function listEligibilities(params = {}, { signal } = {}) {
  const { data } = await api.get('/eligibilities/', { params, signal })
  return asList(data)
}

export async function answerEligibility(
  eligibilityId,
  { outbound_service_id, return_service_id, expected_revision },
  { signal } = {},
) {
  const payload = {
    outbound_service_id: outbound_service_id === '' || outbound_service_id == null ? null : Number(outbound_service_id),
    return_service_id: return_service_id === '' || return_service_id == null ? null : Number(return_service_id),
    expected_revision: Number(expected_revision ?? 0),
  }
  const { data } = await api.post(`/eligibilities/${encodeURIComponent(eligibilityId)}/answer/`, payload, { signal })
  return data
}

export async function requestEligibilityChange(
  eligibilityId,
  { leg, proposed_service_id, expected_revision },
  { signal } = {},
) {
  const payload = {
    leg,
    proposed_service_id: Number(proposed_service_id),
    expected_revision: Number(expected_revision ?? 0),
  }
  const { data } = await api.post(`/eligibilities/${encodeURIComponent(eligibilityId)}/request-change/`, payload, {
    signal,
  })
  return data
}

export async function withdrawEligibilityLeg(eligibilityId, leg, { signal } = {}) {
  const { data } = await api.post(
    `/eligibilities/${encodeURIComponent(eligibilityId)}/withdraw-leg/`,
    { leg },
    { signal },
  )
  return data
}

export async function listChangeRequests(params = {}, { signal } = {}) {
  const { data } = await api.get('/change-requests/', { params, signal })
  return asList(data)
}

export async function decideChangeRequest(requestId, action, reason = '', { signal } = {}) {
  if (!['approve', 'reject'].includes(action)) throw new Error('Decisão inválida.')
  const { data } = await api.post(
    `/change-requests/${encodeURIComponent(requestId)}/${action}/`,
    { reason: trimString(reason) },
    { signal },
  )
  return data
}

export async function withdrawChangeRequest(requestId, { signal } = {}) {
  const { data } = await api.post(`/change-requests/${encodeURIComponent(requestId)}/withdraw/`, {}, { signal })
  return data
}

export async function applyChangeRequest(requestId, { signal } = {}) {
  const { data } = await api.post(`/change-requests/${encodeURIComponent(requestId)}/apply/`, {}, { signal })
  return data
}

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

export async function getCompanyStats(params = {}, { signal } = {}) {
  const { data } = await api.get('/companies/me/stats/', { params, signal })
  return data
}
