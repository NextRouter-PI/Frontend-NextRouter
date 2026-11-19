import api from './client'

// Mesmo para o titular/staff, a descoberta usa somente os campos públicos.
function publicCompany({ id, trade_name, city, state }) {
  return { id, trade_name, city, state }
}

export async function searchCompanies(filters, { page = 1, signal } = {}) {
  const params = { page, page_size: 12 }
  for (const field of ['trade_name', 'city', 'state', 'destination']) {
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

export async function getPublicCompany(id, { signal } = {}) {
  const { data } = await api.get(`/companies/${id}/`, { signal })
  return publicCompany(data)
}
