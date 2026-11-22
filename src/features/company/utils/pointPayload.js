import { POINT_TYPES } from '@/constants'
import { isValidLatLng } from '@/utils/geo'

/**
 * Cria o estado inicial vazio de formulário para ponto operacional (garagem ou destino).
 */
export function createEmptyPointForm(pointType = null) {
  const base = {
    name: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    cep: '',
    latitude: null,
    longitude: null,
  }
  return pointType ? { point_type: pointType, ...base } : base
}

/**
 * Mapeia um ponto operacional existente para os campos de formulário.
 */
export function mapPointToForm(ponto, formatCEP, pointType = null) {
  if (!ponto) return createEmptyPointForm(pointType)
  const base = {
    name: ponto.name || '',
    street: ponto.street || '',
    number: ponto.number || '',
    complement: ponto.complement || '',
    neighborhood: ponto.neighborhood || '',
    city: ponto.city || '',
    state: ponto.state || '',
    cep: formatCEP(ponto.cep || ''),
    latitude: ponto.latitude ?? null,
    longitude: ponto.longitude ?? null,
  }
  return pointType ? { point_type: pointType, ...base } : base
}

/**
 * Valida se um formulário de ponto operacional possui coordenadas explícitas e válidas.
 */
export function parseValidPointCoords(latitude, longitude) {
  if (latitude == null || latitude === '' || longitude == null || longitude === '') {
    return null
  }
  if (!isValidLatLng(latitude, longitude)) return null
  return { lat: Number(latitude), lng: Number(longitude) }
}

/**
 * Normaliza o payload de criação/edição de ponto de destino operacional.
 */
export function buildDestinationPointPayload(form, coords) {
  return {
    point_type: POINT_TYPES.DESTINATION,
    name: form.name.trim(),
    street: form.street.trim(),
    number: form.number.trim(),
    complement: form.complement.trim(),
    neighborhood: form.neighborhood.trim(),
    city: form.city.trim(),
    state: form.state.trim().toUpperCase(),
    cep: form.cep.replace(/\D/g, ''),
    latitude: coords.lat.toFixed(6),
    longitude: coords.lng.toFixed(6),
  }
}
