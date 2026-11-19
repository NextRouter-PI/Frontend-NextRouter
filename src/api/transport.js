import api from './client'

function asList(data) {
  return Array.isArray(data) ? data : data?.results || []
}

function trimString(value) {
  return typeof value === 'string' ? value.trim() : ''
}

export async function listOperationalPoints(params = {}, { signal } = {}) {
  const { data } = await api.get('/operational-points/', { params, signal })
  return asList(data)
}

export async function createOperationalPoint(input, { signal } = {}) {
  const payload = normalizePointInput(input)
  const { data } = await api.post('/operational-points/', payload, { signal })
  return data
}

export async function updateOperationalPoint(id, input, { signal } = {}) {
  const payload = normalizePointInput(input, true)
  const { data } = await api.patch(`/operational-points/${encodeURIComponent(id)}/`, payload, { signal })
  return data
}

function normalizePointInput(input, partial = false) {
  const fields = ['name', 'street', 'number', 'complement', 'neighborhood', 'city', 'state', 'cep']
  const payload = {}
  for (const field of fields) {
    if (partial && !(field in input)) continue
    let value = trimString(input[field])
    if (field === 'state') value = value.toUpperCase()
    if (field === 'cep') value = value.replace(/\D/g, '')
    payload[field] = value
  }
  for (const coord of ['latitude', 'longitude']) {
    if (partial && !(coord in input)) continue
    const num = Number(input[coord])
    if (!Number.isFinite(num)) throw new Error('Informe coordenadas numéricas válidas.')
    payload[coord] = num
  }
  return payload
}

export async function listVehicles(params = {}, { signal } = {}) {
  const { data } = await api.get('/vehicles/', { params, signal })
  return asList(data)
}

export async function getVehicle(id, { signal } = {}) {
  const { data } = await api.get(`/vehicles/${encodeURIComponent(id)}/`, { signal })
  return data
}

export async function createVehicle(input, { signal } = {}) {
  const { data } = await api.post('/vehicles/', normalizeVehicleInput(input), { signal })
  return data
}

export async function updateVehicle(id, input, { signal } = {}) {
  const { data } = await api.patch(`/vehicles/${encodeURIComponent(id)}/`, normalizeVehicleInput(input, true), { signal })
  return data
}

function normalizeVehicleInput(input, partial = false) {
  const payload = {}
  if (!partial || 'plate' in input) payload.plate = trimString(input.plate).toUpperCase()
  if (!partial || 'model' in input) payload.model = trimString(input.model)
  if (!partial || 'color' in input) payload.color = trimString(input.color)
  if (!partial || 'status' in input) payload.status = input.status === 'maintenance' ? 'maintenance' : 'active'
  if (!partial || 'capacity' in input) payload.capacity = Number(input.capacity)
  if (!partial || 'year' in input) {
    payload.year = input.year === '' || input.year == null ? null : Number(input.year)
  }
  if (!partial || 'garage_point_id' in input) {
    payload.garage_point_id = input.garage_point_id === '' || input.garage_point_id == null
      ? null : Number(input.garage_point_id)
  }
  if (!partial || 'features' in input) {
    payload.features = Array.isArray(input.features)
      ? input.features.map(trimString).filter(Boolean) : []
  }
  return payload
}

export async function listRouteGroups(params = {}, { signal } = {}) {
  const { data } = await api.get('/company-route-groups/', { params, signal })
  return asList(data)
}

export async function getRouteGroup(id, { signal } = {}) {
  const { data } = await api.get(`/company-route-groups/${encodeURIComponent(id)}/`, { signal })
  return data
}

export async function createRouteGroup({ name, destination_id }, { signal } = {}) {
  const { data } = await api.post('/company-route-groups/', {
    name: trimString(name),
    destination_id: Number(destination_id),
  }, { signal })
  return data
}

export async function updateRouteGroup(id, { name, destination_id }, { signal } = {}) {
  const payload = {}
  if (name !== undefined) payload.name = trimString(name)
  if (destination_id !== undefined) payload.destination_id = Number(destination_id)
  const { data } = await api.patch(`/company-route-groups/${encodeURIComponent(id)}/`, payload, { signal })
  return data
}

export async function listResponsePolicies(params = {}, { signal } = {}) {
  const { data } = await api.get('/response-policies/', { params, signal })
  return asList(data)
}

export async function saveResponsePolicy(groupId, input, { signal } = {}) {
  const hasExtension = input.extension_days_before !== '' && input.extension_days_before != null &&
    trimString(input.extension_time) !== ''
  const payload = {
    opens_days_before: Number(input.opens_days_before),
    opens_time: trimString(input.opens_time),
    normal_days_before: Number(input.normal_days_before),
    normal_time: trimString(input.normal_time),
    extension_days_before: hasExtension ? Number(input.extension_days_before) : null,
    extension_time: hasExtension ? trimString(input.extension_time) : null,
  }
  const { data } = await api.post(`/company-route-groups/${encodeURIComponent(groupId)}/policy/`, payload, { signal })
  return data
}

export async function listRecurringServices(params = {}, { signal } = {}) {
  const { data } = await api.get('/recurring-services/', { params, signal })
  return asList(data)
}

export async function createRecurringService(input, { signal } = {}) {
  const { data } = await api.post('/recurring-services/', normalizeServiceInput(input), { signal })
  return data
}

export async function updateRecurringService(id, input, { signal } = {}) {
  const payload = normalizeServiceInput(input, true)
  delete payload.route_group_id
  const { data } = await api.patch(`/recurring-services/${encodeURIComponent(id)}/`, payload, { signal })
  return data
}

function normalizeServiceInput(input, partial = false) {
  const payload = {}
  if (!partial || 'route_group_id' in input) payload.route_group_id = Number(input.route_group_id)
  if (!partial || 'name' in input) payload.name = trimString(input.name)
  if (!partial || 'direction' in input) payload.direction = input.direction
  if (!partial || 'weekdays' in input) payload.weekdays = Number(input.weekdays)
  if (!partial || 'target_time' in input) payload.target_time = trimString(input.target_time)
  if (!partial || 'valid_from' in input) payload.valid_from = trimString(input.valid_from)
  if (!partial || 'valid_until' in input) payload.valid_until = trimString(input.valid_until) || null
  for (const fk of ['driver_membership_id', 'vehicle_id', 'origin_id', 'destination_id']) {
    if (!partial || fk in input) {
      payload[fk] = input[fk] === '' || input[fk] == null ? null : Number(input[fk])
    }
  }
  for (const dur of ['planned_duration', 'turnaround_duration']) {
    if (!partial || dur in input) {
      payload[dur] = trimString(input[dur]) || null
    }
  }
  return payload
}

export async function saveServiceStops(serviceId, pointIds, { signal } = {}) {
  const ids = Array.isArray(pointIds) ? pointIds.map(Number).filter((n) => Number.isInteger(n) && n > 0) : []
  const { data } = await api.post(`/recurring-services/${encodeURIComponent(serviceId)}/stops/`, { point_ids: ids }, { signal })
  return data
}

export async function listGroupMemberships(params = {}, { signal } = {}) {
  const { data } = await api.get('/group-memberships/', { params, signal })
  return asList(data)
}

export async function assignPassengerGroup(membershipId, { route_group_id, transport_point_id }, { signal } = {}) {
  const payload = {
    route_group_id: Number(route_group_id),
    transport_point_id: transport_point_id === '' || transport_point_id == null ? null : Number(transport_point_id),
  }
  const { data } = await api.post(`/memberships/${encodeURIComponent(membershipId)}/assign-group/`, payload, { signal })
  return data
}

export async function authorizeGroupMemberServices(groupMembershipId, { service_ids, habitual_outbound_id }, { signal } = {}) {
  const payload = {
    service_ids: Array.isArray(service_ids) ? service_ids.map(Number).filter((n) => Number.isInteger(n) && n > 0) : [],
    habitual_outbound_id: habitual_outbound_id === '' || habitual_outbound_id == null ? null : Number(habitual_outbound_id),
  }
  const { data } = await api.post(
    `/group-memberships/${encodeURIComponent(groupMembershipId)}/authorize-services/`,
    payload,
    { signal },
  )
  return data
}

export async function generateGroupHorizon(groupId, { start_date, horizon_days, batch_size }, { signal } = {}) {
  const payload = {
    start_date: trimString(start_date),
    horizon_days: Number(horizon_days),
    batch_size: Number(batch_size),
  }
  const { data } = await api.post(`/company-route-groups/${encodeURIComponent(groupId)}/generate/`, payload, { signal })
  return asList(data)
}

export async function cancelGroupDate(groupId, { date, reason }, { signal } = {}) {
  const { data } = await api.post(`/company-route-groups/${encodeURIComponent(groupId)}/cancel-date/`, {
    date: trimString(date),
    reason: trimString(reason),
  }, { signal })
  return data
}

export async function getAutomationStatus(groupId, { signal } = {}) {
  const { data } = await api.get(`/company-route-groups/${encodeURIComponent(groupId)}/automation-status/`, { signal })
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
  const { data } = await api.post(`/company-route-groups/${encodeURIComponent(groupId)}/automation/`, payload, { signal })
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

export async function answerEligibility(eligibilityId, { outbound_service_id, return_service_id, expected_revision }, { signal } = {}) {
  const payload = {
    outbound_service_id: outbound_service_id === '' || outbound_service_id == null ? null : Number(outbound_service_id),
    return_service_id: return_service_id === '' || return_service_id == null ? null : Number(return_service_id),
    expected_revision: Number(expected_revision ?? 0),
  }
  const { data } = await api.post(`/eligibilities/${encodeURIComponent(eligibilityId)}/answer/`, payload, { signal })
  return data
}

export async function requestEligibilityChange(eligibilityId, { leg, proposed_service_id, expected_revision }, { signal } = {}) {
  const payload = {
    leg,
    proposed_service_id: Number(proposed_service_id),
    expected_revision: Number(expected_revision ?? 0),
  }
  const { data } = await api.post(
    `/eligibilities/${encodeURIComponent(eligibilityId)}/request-change/`,
    payload,
    { signal },
  )
  return data
}

export async function withdrawEligibilityLeg(eligibilityId, leg, { signal } = {}) {
  const { data } = await api.post(`/eligibilities/${encodeURIComponent(eligibilityId)}/withdraw-leg/`, { leg }, { signal })
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
