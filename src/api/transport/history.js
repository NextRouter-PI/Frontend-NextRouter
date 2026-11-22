import api from '../client'
import { asList, trimString } from './helpers'

export async function listNotifications(params = {}, { signal } = {}) {
  const { data } = await api.get('/notifications/', { params, signal })
  return asList(data)
}

export async function markNotificationRead(id, { signal } = {}) {
  const { data } = await api.post(`/notifications/${encodeURIComponent(id)}/read/`, {}, { signal })
  return data
}

export async function listDriverRatings(params = {}, { signal } = {}) {
  const { data } = await api.get('/driver-ratings/', { params, signal })
  return asList(data)
}

export async function createDriverRating({ travel_id, score, comment = '' }, { signal } = {}) {
  const { data } = await api.post(
    '/driver-ratings/',
    {
      travel_id: Number(travel_id),
      score: Number(score),
      comment: trimString(comment),
    },
    { signal },
  )
  return data
}

export async function listLostItems(params = {}, { signal } = {}) {
  const { data } = await api.get('/lost-items/', { params, signal })
  return asList(data)
}

export async function createLostItem({ travel_id, item_description, operation_id }, { signal } = {}) {
  const { data } = await api.post(
    '/lost-items/',
    {
      travel_id: Number(travel_id),
      item_description: trimString(item_description),
      operation_id,
    },
    { signal },
  )
  return data
}

export async function transitionLostItem(id, { target_status, operation_id }, { signal } = {}) {
  if (!['found', 'returned'].includes(target_status)) throw new Error('Estado de custódia inválido.')
  const { data } = await api.post(
    `/lost-items/${encodeURIComponent(id)}/transition/`,
    { target_status, operation_id },
    { signal },
  )
  return data
}

export async function listParticipationEvents(params = {}, { signal } = {}) {
  const { data } = await api.get('/participation-events/', { params, signal })
  return asList(data)
}

export async function correctParticipationPresence(
  participationId,
  { corrects_event_id, target_status, reason, operation_id },
  { signal } = {},
) {
  const { data } = await api.post(
    `/travel-participations/${encodeURIComponent(participationId)}/correct/`,
    {
      corrects_event_id: Number(corrects_event_id),
      target_status,
      reason: trimString(reason),
      operation_id,
    },
    { signal },
  )
  return data
}
