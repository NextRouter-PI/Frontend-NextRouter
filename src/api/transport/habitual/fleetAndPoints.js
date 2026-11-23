import api from '../../client'
import { asList } from '../helpers'
import { normalizePointInput, normalizeVehicleInput } from './normalizers'

export async function listOperationalPoints(params = {}, { signal } = {}) {
  const { data } = await api.get('/operational-points/', { params, signal })
  return asList(data)
}

export async function createOperationalPoint(input, { signal } = {}) {
  const { data } = await api.post('/operational-points/', normalizePointInput(input), { signal })
  return data
}

export async function updateOperationalPoint(id, input, { signal } = {}) {
  const { data } = await api.patch(
    `/operational-points/${encodeURIComponent(id)}/`,
    normalizePointInput(input, true),
    { signal },
  )
  return data
}

export async function listVehicles(params = {}, { signal } = {}) {
  const { data } = await api.get('/vehicles/', { params, signal })
  return asList(data)
}

export async function getVehicle(id, { signal } = {}) {
  const { data } = await api.get(`/vehicles/${encodeURIComponent(id)}/`, { signal })
  return data
}

export async function createVehicle(input, { signal } = {}) {
  const { data } = await api.post('/vehicles/', normalizeVehicleInput(input), { signal })
  return data
}

export async function updateVehicle(id, input, { signal } = {}) {
  const { data } = await api.patch(
    `/vehicles/${encodeURIComponent(id)}/`,
    normalizeVehicleInput(input, true),
    { signal },
  )
  return data
}
