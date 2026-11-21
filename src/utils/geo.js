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
