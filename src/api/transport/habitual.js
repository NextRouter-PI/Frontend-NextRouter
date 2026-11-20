import api from '../client'
import { asList, trimString } from './helpers'

function normalizePointInput(input, partial = false) {
  const fields = ['point_type', 'name', 'street', 'number', 'complement', 'neighborhood', 'city', 'state', 'cep']
  const payload = {}
  for (const field of fields) {
    if (partial && !(field in input)) continue
    if (field === 'point_type' && !input[field]) continue
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
    payload.garage_point_id =
      input.garage_point_id === '' || input.garage_point_id == null ? null : Number(input.garage_point_id)
  }
  if (!partial || 'features' in input) {
    payload.features = Array.isArray(input.features) ? input.features.map(trimString).filter(Boolean) : []
  }
  return payload
}

function normalizeServiceInput(input, partial = false) {
  const payload = {}
  if (!partial || 'route_group_id' in input) payload.route_group_id = Number(input.route_group_id)
  if (!partial || 'name' in input) payload.name = trimString(input.name)
  if (!partial || 'direction' in input) payload.direction = input.direction
  if (!partial || 'is_shared' in input) payload.is_shared = Boolean(input.is_shared)
  if (!partial || 'weekdays' in input) payload.weekdays = Number(input.weekdays)
  if (!partial || 'target_time' in input) payload.target_time = trimString(input.target_time)
  if ('valid_from' in input) payload.valid_from = trimString(input.valid_from) || null
  if ('valid_until' in input) payload.valid_until = trimString(input.valid_until) || null
  for (const fk of ['driver_membership_id', 'vehicle_id', 'origin_id', 'destination_id']) {
    if (!partial || fk in input) {
      payload[fk] = input[fk] === '' || input[fk] == null ? null : Number(input[fk])
    }
  }
  for (const dur of ['planned_duration', 'turnaround_duration']) {
    if (dur in input) payload[dur] = trimString(input[dur]) || null
  }
  return payload
}

export async function listOperationalPoints(params = {}, { signal } = {}) {
  const { data } = await api.get('/operational-points/', { params, signal })
  return asList(data)
}

export async function createOperationalPoint(input, { signal } = {}) {
  const { data } = await api.post('/operational-points/', normalizePointInput(input), { signal })
  return data
}

export async function updateOperationalPoint(id, input, { signal } = {}) {
  const { data } = await api.patch(
    `/operational-points/${encodeURIComponent(id)}/`,
    normalizePointInput(input, true),
    { signal },
  )
  return data
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
  const { data } = await api.patch(
    `/vehicles/${encodeURIComponent(id)}/`,
    normalizeVehicleInput(input, true),
    { signal },
  )
  return data
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
  const { data } = await api.post(
    '/company-route-groups/',
    { name: trimString(name), destination_id: Number(destination_id) },
    { signal },
  )
  return data
}

export async function updateRouteGroup(id, { name, destination_id }, { signal } = {}) {
  const payload = {}
  if (name !== undefined) payload.name = trimString(name)
  if (destination_id !== undefined) payload.destination_id = Number(destination_id)
  const { data } = await api.patch(`/company-route-groups/${encodeURIComponent(id)}/`, payload, { signal })
  return data
}

export async function listUnassignedGroupPassengers(groupId, { signal } = {}) {
  const { data } = await api.get(
    `/company-route-groups/${encodeURIComponent(groupId)}/unassigned-passengers/`,
    { signal },
  )
  return asList(data)
}

export async function listHabitualRoutes(params = {}, { signal } = {}) {
  const { data } = await api.get('/habitual-routes/', { params, signal })
  return asList(data)
}

export async function createHabitualRoute({ route_group_id, name, kind = 'habitual', passengers }, { signal } = {}) {
  const payload = { route_group_id: Number(route_group_id), name: trimString(name), kind }
  if (kind === 'habitual' && Array.isArray(passengers)) {
    payload.passengers = passengers.map((item) => ({
      group_membership_id: Number(item.group_membership_id),
      latitude: Number(item.latitude),
      longitude: Number(item.longitude),
    }))
  }
  const { data } = await api.post('/habitual-routes/', payload, { signal })
  return data
}

export async function updateHabitualRoute(id, { name, kind, passengers }, { signal } = {}) {
  const payload = {}
  if (name !== undefined) payload.name = trimString(name)
  if (kind !== undefined) payload.kind = kind
  if (Array.isArray(passengers)) {
    payload.passengers = passengers.map((item) => ({
      group_membership_id: Number(item.group_membership_id),
      latitude: Number(item.latitude),
      longitude: Number(item.longitude),
    }))
  }
  const { data } = await api.patch(`/habitual-routes/${encodeURIComponent(id)}/`, payload, { signal })
  return data
}

export async function listResponsePolicies(params = {}, { signal } = {}) {
  const { data } = await api.get('/response-policies/', { params, signal })
  return asList(data)
}

export async function saveResponsePolicy(groupId, input, { signal } = {}) {
  const hasExtension =
    input.extension_days_before !== '' &&
    input.extension_days_before != null &&
    trimString(input.extension_time) !== ''
  const payload = {
    opens_days_before: Number(input.opens_days_before),
    opens_time: trimString(input.opens_time),
    normal_days_before: Number(input.normal_days_before),
    normal_time: trimString(input.normal_time),
    extension_days_before: hasExtension ? Number(input.extension_days_before) : null,
    extension_time: hasExtension ? trimString(input.extension_time) : null,
  }
  const { data } = await api.post(`/company-route-groups/${encodeURIComponent(groupId)}/policy/`, payload, {
    signal,
  })
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

export async function saveServiceStops(serviceId, pointIds, { signal } = {}) {
  const ids = Array.isArray(pointIds) ? pointIds.map(Number).filter((n) => Number.isInteger(n) && n > 0) : []
  const { data } = await api.post(`/recurring-services/${encodeURIComponent(serviceId)}/stops/`, { point_ids: ids }, {
    signal,
  })
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
  const { data } = await api.post(`/memberships/${encodeURIComponent(membershipId)}/assign-group/`, payload, {
    signal,
  })
  return data
}

export async function authorizeGroupMemberServices(
  groupMembershipId,
  { service_ids, habitual_outbound_id },
  { signal } = {},
) {
  const payload = {
    service_ids: Array.isArray(service_ids) ? service_ids.map(Number).filter((n) => Number.isInteger(n) && n > 0) : [],
    habitual_outbound_id:
      habitual_outbound_id === '' || habitual_outbound_id == null ? null : Number(habitual_outbound_id),
  }
  const { data } = await api.post(
    `/group-memberships/${encodeURIComponent(groupMembershipId)}/authorize-services/`,
    payload,
    { signal },
  )
  return data
}
