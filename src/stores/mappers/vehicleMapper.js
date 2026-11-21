import { VEHICLE_STATUS_FROM_API, VEHICLE_STATUS_TO_API } from '@/constants'

export function formatGarageLabel(point) {
  return point ? `${point.name} (${point.city}/${point.state})` : null
}

export function mapVehicleFromApi(vehicle, pointsMap = new Map()) {
  const garagePoint = pointsMap.get(vehicle.garage_point) || null
  return {
    id: vehicle.id,
    company: vehicle.company,
    placa: vehicle.plate,
    modelo: vehicle.model || '',
    ano: vehicle.year ?? '',
    capacidade: vehicle.capacity ?? '',
    status: VEHICLE_STATUS_FROM_API[vehicle.status] || vehicle.status,
    rawStatus: vehicle.status,
    garagePointId: vehicle.garage_point ?? null,
    garagePointName: formatGarageLabel(garagePoint),
    cor: vehicle.color || '',
    caracteristicas: Array.isArray(vehicle.features) ? vehicle.features : [],
  }
}

export function mapVehicleToApi(vehicle) {
  const payload = {}
  if (vehicle.placa !== undefined) payload.plate = vehicle.placa
  if (vehicle.modelo !== undefined) payload.model = vehicle.modelo
  if (vehicle.ano !== undefined) payload.year = vehicle.ano
  if (vehicle.capacidade !== undefined) payload.capacity = vehicle.capacidade
  if (vehicle.status !== undefined) payload.status = VEHICLE_STATUS_TO_API[vehicle.status] || vehicle.status
  if (vehicle.garagePointId !== undefined) payload.garage_point_id = vehicle.garagePointId
  if (vehicle.cor !== undefined) payload.color = vehicle.cor
  if (vehicle.caracteristicas !== undefined) payload.features = vehicle.caracteristicas
  return payload
}
