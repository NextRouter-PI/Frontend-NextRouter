import api from '../../client'
import { asList, trimString } from '../helpers'
import { normalizeServiceInput } from './normalizers'

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
