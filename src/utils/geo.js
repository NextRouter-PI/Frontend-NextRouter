const EARTH_RADIUS_M = 6371000

function toRad(deg) {
  return (deg * Math.PI) / 180
}

export function haversineMeters(lat1, lng1, lat2, lng2) {
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_M * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function estimateEtaMinutes(distanceMeters, speedKmh = 30) {
  if (!Number.isFinite(distanceMeters) || distanceMeters <= 0) return 0
  const speedMs = (speedKmh * 1000) / 3600
  return Math.max(1, Math.round(distanceMeters / speedMs / 60))
}

export function formatDistanceLabel(distanceMeters) {
  if (!Number.isFinite(distanceMeters) || distanceMeters < 0) return ''
  if (distanceMeters < 1000) return `${Math.round(distanceMeters)} m`
  return `${(distanceMeters / 1000).toFixed(1)} km`
}

export function bearingDegrees(lat1, lng1, lat2, lng2) {
  const phi1 = toRad(lat1)
  const phi2 = toRad(lat2)
  const dLambda = toRad(lng2 - lng1)
  const y = Math.sin(dLambda) * Math.cos(phi2)
  const x =
    Math.cos(phi1) * Math.sin(phi2) -
    Math.sin(phi1) * Math.cos(phi2) * Math.cos(dLambda)
  const theta = Math.atan2(y, x)
  return ((theta * 180) / Math.PI + 360) % 360
}

export function isValidLatLng(lat, lng) {
  if (lat == null || lat === '' || lng == null || lng === '') return false
  const nLat = Number(lat)
  const nLng = Number(lng)
  return (
    Number.isFinite(nLat) &&
    nLat >= -90 &&
    nLat <= 90 &&
    Number.isFinite(nLng) &&
    nLng >= -180 &&
    nLng <= 180
  )
}

export function pointToLatLng(point) {
  if (!point) return null
  const lat = Number(point.latitude)
  const lng = Number(point.longitude)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  return [lat, lng]
}

export function splitPolylineAtPosition(coords, posLat, posLng, { isLngLat = false } = {}) {
  if (posLat == null || posLng == null || !Array.isArray(coords) || coords.length < 2) {
    return { passed: [], remaining: coords || [] }
  }
  const latIdx = isLngLat ? 1 : 0
  const lngIdx = isLngLat ? 0 : 1
  let closestIdx = 0
  let bestDist = Infinity
  for (let i = 0; i < coords.length; i += 1) {
    const d = haversineMeters(posLat, posLng, coords[i][latIdx], coords[i][lngIdx])
    if (d < bestDist) {
      bestDist = d
      closestIdx = i
    }
  }
  return {
    passed: coords.slice(0, closestIdx + 1),
    remaining: coords.slice(closestIdx),
  }
}
