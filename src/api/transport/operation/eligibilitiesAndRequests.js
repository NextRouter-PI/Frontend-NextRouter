import api from '../../client'
import { asList, trimString } from '../helpers'

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
