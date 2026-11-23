import L from 'leaflet'
import { createPinIcon } from '@/utils/leafletTiles'
import { pointToLatLng } from '@/utils/geo'
import { escapeHtml } from '@/utils/leafletMarkers'

export function animateDashedCalculationRoute({ map, routeAnimLayer, coordsLatLng, onStop }) {
  onStop?.()
  if (!map || !coordsLatLng.length) return { routeAnimLayer, stop: () => {} }
  if (routeAnimLayer) routeAnimLayer.clearLayers()
  else routeAnimLayer = L.layerGroup().addTo(map)

  L.polyline(coordsLatLng, { color: '#df801a', weight: 4, opacity: 0.2 }).addTo(routeAnimLayer)
  const animatedLine = L.polyline([coordsLatLng[0]], {
    color: '#df801a', weight: 5, opacity: 0.95, className: 'nr-route-animated-dash',
  }).addTo(routeAnimLayer)

  const total = coordsLatLng.length
  const durationMs = Math.min(2200, Math.max(800, total * 12))
  const startTime = performance.now()
  let rafId = null
  const step = (now) => {
    const progress = Math.min(1, (now - startTime) / durationMs)
    animatedLine.setLatLngs(coordsLatLng.slice(0, Math.max(1, Math.floor(progress * total))))
    if (progress < 1) {
      rafId = requestAnimationFrame(step)
    } else {
      animatedLine.setLatLngs(coordsLatLng)
      rafId = null
    }
  }
  rafId = requestAnimationFrame(step)

  return {
    routeAnimLayer,
    stop: () => {
      if (rafId) {
        cancelAnimationFrame(rafId)
        rafId = null
      }
    },
  }
}

export function renderCalculationMarkers({ markersLayer, snapshot, originPoint, destinationPoint, participants }) {
  const bounds = []
  const origin = snapshot?.origin || originPoint
  const originCoord = pointToLatLng(origin)
  if (originCoord) {
    bounds.push(originCoord)
    L.marker(originCoord, { icon: createPinIcon({ variant: 'success', icon: 'mdi-flag-outline' }) })
      .bindTooltip(`Origem: ${escapeHtml(origin?.name || 'Garagem / Início')}`, { direction: 'top' })
      .bindPopup(`<strong>Origem:</strong> ${escapeHtml(origin?.name || 'Início')}`)
      .addTo(markersLayer)
  }

  for (const participant of participants || []) {
    const coord = pointToLatLng(participant.point_snapshot)
    if (!coord) continue
    bounds.push(coord)
    const name = participant.name || `Passageiro #${participant.eligibility}`
    L.marker(coord, {
      icon: createPinIcon({
        variant: 'primary',
        icon: 'mdi-account',
        avatarUrl: participant.profile_picture_url || '',
        avatarAlt: name,
      }),
    })
      .bindTooltip(escapeHtml(name), { direction: 'top', offset: [0, -10] })
      .bindPopup(
        `<strong>${escapeHtml(name)}</strong><br><small>${escapeHtml(participant.point_snapshot?.street || 'Ponto do passageiro')}</small>`,
      )
      .addTo(markersLayer)
  }

  const dest = snapshot?.destination || destinationPoint
  const destCoord = pointToLatLng(dest)
  if (destCoord) {
    bounds.push(destCoord)
    L.marker(destCoord, { icon: createPinIcon({ variant: 'danger', icon: 'mdi-flag-checkered' }) })
      .bindTooltip(`Destino: ${escapeHtml(dest?.name || 'Destino')}`, { direction: 'top' })
      .bindPopup(`<strong>Destino:</strong> ${escapeHtml(dest?.name || 'Destino')}`)
      .addTo(markersLayer)
  }
  return bounds
}
