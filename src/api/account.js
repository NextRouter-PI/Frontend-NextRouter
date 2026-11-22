import api from './client'

export async function readAccount({ signal }) {
  return (await api.get('/users/me/', { signal })).data
}
export function requestEmailChange(email, { signal }) {
  return api.post('/email-change/request/', { new_email: email.trim().toLowerCase() }, { signal })
}
export function verifyEmailChange(code, { signal }) {
  return api.post('/email-change/verify/', { code }, { signal })
}
export function confirmEmailChange(code, password, { signal }) {
  return api.post('/email-change/confirm/', { code, password }, { signal })
}
export async function readSessions({ signal }) {
  return (await api.get('/sessions/', { signal })).data
}
export function revokeOtherSession(id, { signal }) {
  return api.delete(`/sessions/${encodeURIComponent(id)}/`, { signal })
}
export function revokeAllSessions({ signal }) {
  return api.post('/me/revoke-sessions/', undefined, { signal })
}
export function deactivateAccount({ signal }) {
  return api.post('/me/deactivate/', undefined, { signal })
}
