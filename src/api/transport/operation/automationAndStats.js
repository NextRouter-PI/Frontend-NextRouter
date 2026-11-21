import api from '../../client'
import { trimString } from '../helpers'

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

export async function getCompanyStats(params = {}, { signal } = {}) {
  const { data } = await api.get('/companies/me/stats/', { params, signal })
  return data
}
