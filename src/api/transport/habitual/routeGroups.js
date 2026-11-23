import api from '../../client'
import { asList, trimString } from '../helpers'

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
