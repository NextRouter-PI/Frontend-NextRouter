import api from './client'

function publicRouteGroup({ id, name, city, state }) {
  return {
    id,
    name: String(name || ''),
    city: String(city || ''),
    state: String(state || ''),
  }
}

// Mesmo para o titular/staff, a descoberta usa somente os campos públicos.
function publicCompany({ id, trade_name, city, state, profile_picture_url = null, route_groups = [] }) {
  return {
    id,
    trade_name,
    city,
    state,
    profile_picture_url: profile_picture_url || null,
    route_groups: Array.isArray(route_groups) ? route_groups.map(publicRouteGroup) : [],
  }
}

export async function searchCompanies(filters, { page = 1, signal } = {}) {
  const params = { page, page_size: 12 }
  for (const field of ['destination', 'city', 'state', 'ordering']) {
    const value = String(filters[field] || '').trim()
    if (value) params[field] = field === 'state' ? value.toUpperCase() : value
  }
  // Página explícita: o cliente HTTP não deve agregar todas as páginas.
  const { data } = await api.get('/companies/', { params, signal })
  return {
    results: data.results.map(publicCompany),
    page: data.page,
    totalPages: data.total_pages,
  }
}

export async function getServedCities(state = '', { signal } = {}) {
  const params = {}
  const uf = String(state || '').trim().toUpperCase()
  if (uf) params.state = uf
  const { data } = await api.get('/companies/served-cities/', { params, signal })
  const items = Array.isArray(data?.cities) ? data.cities : []
  return items.map(({ city, state: itemState }) => ({
    city: String(city || ''),
    state: String(itemState || ''),
  }))
}

export async function getPublicCompany(id, { signal } = {}) {
  const { data } = await api.get(`/companies/${id}/`, { signal })
  return publicCompany(data)
}
