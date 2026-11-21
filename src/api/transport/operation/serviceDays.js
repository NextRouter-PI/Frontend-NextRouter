import api from '../../client'
import { asList, trimString } from '../helpers'

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
