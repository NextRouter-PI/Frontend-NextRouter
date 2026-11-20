import api from './client'
import { getPublicCompany } from './companies'

async function list(scope, { page = 1, status = '', pageSize = 12, signal } = {}) {
  const params = { ...scope, page, page_size: pageSize }
  if (status) params.status = status
  const { data } = await api.get('/memberships/', { params, signal })
  return { results: data.results, page: data.page, totalPages: data.total_pages }
}

export async function loadMemberships(scope, { page, status, signal }) {
  const personal = Boolean(scope.passenger || scope.driver)
  const [history, pending, active] = await Promise.all([
    list(scope, { page, status, signal }),
    personal ? list(scope, { status: 'pending', pageSize: 1, signal }) : null,
    personal ? list(scope, { status: 'active', pageSize: 1, signal }) : null,
  ])
  // O ciclo aberto pode estar fora da página atual do histórico.
  const openMembership = active?.results[0] || pending?.results[0] || null
  let openCompany = null
  if (openMembership) {
    try {
      openCompany = await getPublicCompany(openMembership.company, { signal })
    } catch (error) {
      if (signal.aborted) throw error
      // Nome é complementar: indisponibilidade pública não apaga o ciclo nem
      // impede o titular de retirar um pedido que a consulta privada confirmou.
    }
  }
  return { ...history, openMembership, openCompany }
}

export async function requestMembership(companyId, profile, { routeGroupId = null, signal } = {}) {
  const payload = { company_id: companyId, profile }
  if (profile === 'passenger' && routeGroupId) {
    payload.route_group_id = Number(routeGroupId)
  }
  const { data } = await api.post('/memberships/', payload, { signal })
  return data
}

export async function transitionMembership(id, action, reason, { signal }) {
  if (!['approve', 'reject', 'withdraw', 'end'].includes(action)) throw new Error('Ação de vínculo inválida.')
  const { data } = await api.post(`/memberships/${id}/${action}/`, { reason }, { signal })
  return data
}
