import { trimString } from '../helpers'

export function normalizePointInput(input, partial = false) {
  const fields = ['point_type', 'name', 'street', 'number', 'complement', 'neighborhood', 'city', 'state', 'cep']
  const payload = {}
  for (const field of fields) {
    if (partial && !(field in input)) continue
    if (field === 'point_type' && !input[field]) continue
    let value = trimString(input[field])
    if (field === 'state') value = value.toUpperCase()
    if (field === 'cep') value = value.replace(/\D/g, '')
    payload[field] = value
  }
  for (const coord of ['latitude', 'longitude']) {
    if (partial && !(coord in input)) continue
    const num = Number(input[coord])
    if (!Number.isFinite(num)) throw new Error('Informe coordenadas numéricas válidas.')
    payload[coord] = num
  }
  return payload
}

export function normalizeVehicleInput(input, partial = false) {
  const payload = {}
  if (!partial || 'plate' in input) payload.plate = trimString(input.plate).toUpperCase()
  if (!partial || 'model' in input) payload.model = trimString(input.model)
  if (!partial || 'color' in input) payload.color = trimString(input.color)
  if (!partial || 'status' in input) payload.status = input.status === 'maintenance' ? 'maintenance' : 'active'
  if (!partial || 'capacity' in input) payload.capacity = Number(input.capacity)
  if (!partial || 'year' in input) {
    payload.year = input.year === '' || input.year == null ? null : Number(input.year)
  }
  if (!partial || 'garage_point_id' in input) {
    payload.garage_point_id =
      input.garage_point_id === '' || input.garage_point_id == null ? null : Number(input.garage_point_id)
  }
  if (!partial || 'features' in input) {
    payload.features = Array.isArray(input.features) ? input.features.map(trimString).filter(Boolean) : []
  }
  return payload
}

export function normalizeServiceInput(input, partial = false) {
  const payload = {}
  if (!partial || 'route_group_id' in input) payload.route_group_id = Number(input.route_group_id)
  if (!partial || 'name' in input) payload.name = trimString(input.name)
  if (!partial || 'direction' in input) payload.direction = input.direction
  if (!partial || 'is_shared' in input) payload.is_shared = Boolean(input.is_shared)
  if (!partial || 'weekdays' in input) payload.weekdays = Number(input.weekdays)
  if (!partial || 'target_time' in input) payload.target_time = trimString(input.target_time)
  if ('valid_from' in input) payload.valid_from = trimString(input.valid_from) || null
  if ('valid_until' in input) payload.valid_until = trimString(input.valid_until) || null
  for (const fk of ['driver_membership_id', 'vehicle_id', 'origin_id', 'destination_id']) {
    if (!partial || fk in input) {
      payload[fk] = input[fk] === '' || input[fk] == null ? null : Number(input[fk])
    }
  }
  for (const dur of ['planned_duration', 'turnaround_duration']) {
    if (dur in input) payload[dur] = trimString(input[dur]) || null
  }
  return payload
}
