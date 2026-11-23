import L from 'leaflet'
import { createPinIcon } from '@/utils/leafletTiles'
import { pointToLatLng, splitPolylineAtPosition } from '@/utils/geo'

export function plannedCoordsLatLng(snapshot) {
  const raw = snapshot?.geometry?.coordinates
  if (!Array.isArray(raw) || raw.length < 2) return []
  return raw.map(([lng, lat]) => [lat, lng])
}

export function renderConsumedPolylineLayers({ map, coords, busPos, passedLine, remainingLine }) {
  if (!map || !coords.length) return { passedLine, remainingLine }
  const { passed, remaining } = splitPolylineAtPosition(coords, busPos[0], busPos[1])
  if (passedLine) map.removeLayer(passedLine)
  if (remainingLine) map.removeLayer(remainingLine)

  const nextPassed =
    passed.length >= 2
      ? L.polyline(passed, { color: '#71717a', weight: 4, opacity: 0.45 }).addTo(map)
      : null
  const nextRemaining =
    remaining.length >= 2
      ? L.polyline(remaining, {
          color: '#df801a',
          weight: 5,
          opacity: 0.92,
          className: 'nr-route-animated-dash',
        }).addTo(map)
      : null

  return { passedLine: nextPassed, remainingLine: nextRemaining }
}

export function renderBackgroundPlannedRoute({
  map,
  routeLayer,
  snapshot,
  stops,
  remainingLine,
  hasLiveLat,
}) {
  if (!map) return { routeLayer, remainingLine }
  if (routeLayer) routeLayer.clearLayers()
  else routeLayer = L.layerGroup().addTo(map)

  if (!snapshot) return { routeLayer, remainingLine }
  const bounds = []
  let nextRemaining = remainingLine

  const coords = plannedCoordsLatLng(snapshot)
  if (coords.length >= 2 && !hasLiveLat) {
    if (nextRemaining) map.removeLayer(nextRemaining)
    nextRemaining = L.polyline(coords, {
      color: '#df801a',
      weight: 4,
      opacity: 0.85,
      className: 'nr-route-animated-dash',
    }).addTo(map)
    for (const pt of coords) bounds.push(pt)
  }

  const originCoord = pointToLatLng(snapshot.origin)
  if (originCoord) {
    bounds.push(originCoord)
    L.marker(originCoord, {
      icon: createPinIcon({ variant: 'success', icon: 'mdi-flag-outline', size: 'sm' }),
    }).addTo(routeLayer)
  }

  for (const stop of stops || []) {
    const coord = pointToLatLng(stop.point_snapshot)
    if (!coord) continue
    bounds.push(coord)
    const firstPassenger = (stop.participants || []).find((p) => p.profile_picture_url || p.passenger_name)
    L.marker(coord, {
      icon: createPinIcon({
        variant: stop.state === 'handled' || stop.state === 'completed' ? 'success' : 'primary',
        label: firstPassenger?.profile_picture_url ? '' : String(stop.position ?? ''),
        avatarUrl: firstPassenger?.profile_picture_url || '',
        avatarAlt: firstPassenger?.passenger_name || `Parada #${stop.position}`,
        size: 'sm',
      }),
    }).addTo(routeLayer)
  }

  const destCoord = pointToLatLng(snapshot.destination)
  if (destCoord) {
    bounds.push(destCoord)
    L.marker(destCoord, {
      icon: createPinIcon({ variant: 'danger', icon: 'mdi-flag-checkered', size: 'sm' }),
    }).addTo(routeLayer)
  }

  if (bounds.length >= 2 && !hasLiveLat) {
    map.fitBounds(L.latLngBounds(bounds), { padding: [48, 48], maxZoom: 15 })
  }
  return { routeLayer, remainingLine: nextRemaining }
}

export function frameBackgroundViewport(map, busPos, targetPoint) {
  if (!map) return
  const target = pointToLatLng(targetPoint)
  if (!target) {
    map.panTo(busPos, { animate: true })
    return
  }
  const dist = L.latLng(busPos).distanceTo(target)
  if (dist <= 450) {
    map.setView(busPos, 16, { animate: true })
  } else {
    map.fitBounds(L.latLngBounds([busPos, target]), {
      paddingTopLeft: [48, 80],
      paddingBottomRight: [48, 220],
      maxZoom: 15,
      animate: true,
    })
  }
}
