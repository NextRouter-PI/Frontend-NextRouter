import * as maplibregl from 'maplibre-gl'
import { pointToLatLng } from '@/utils/geo'
import { renderIconSvg } from '@/utils/icons'
import { escapeHtml } from '@/utils/leafletMarkers'

export const MAPLIBRE_STYLE_URLS = {
  light: 'https://tiles.openfreemap.org/styles/liberty',
  dark: 'https://tiles.openfreemap.org/styles/dark',
}

export function currentDocumentTheme() {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

export function createNavPuckElement() {
  const el = document.createElement('div')
  el.className = 'gps-nav-puck'
  el.innerHTML = `
    <div class="gps-nav-puck__halo"></div>
    <div class="gps-nav-puck__core">
      ${renderIconSvg('mdi-navigation')}
    </div>
  `
  return el
}

export function createStopMarkerElement({
  variant = 'primary',
  icon = 'mdi-map-marker',
  label = '',
  avatarUrl = '',
  avatarAlt = '',
}) {
  const el = document.createElement('div')
  el.className = `nr-map-pin nr-map-pin--${variant} nr-map-pin--sm${avatarUrl ? ' nr-map-pin--avatar' : ''}`
  const inner = avatarUrl
    ? `<img src="${escapeHtml(avatarUrl)}" alt="${escapeHtml(avatarAlt)}" class="nr-map-pin__avatar" />`
    : label
      ? `<span class="nr-map-pin__label">${escapeHtml(label)}</span>`
      : renderIconSvg(icon)
  el.innerHTML = `<span class="nr-map-pin__body">${inner}</span>`
  return el
}

export function makeLineFeature(coords) {
  if (!coords || coords.length < 2) {
    return { type: 'FeatureCollection', features: [] }
  }
  return {
    type: 'FeatureCollection',
    features: [{ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: coords } }],
  }
}

export function ensureDriverRouteLayers(map) {
  if (!map) return
  if (!map.getSource('nr-route-passed')) {
    map.addSource('nr-route-passed', { type: 'geojson', data: makeLineFeature([]) })
    map.addLayer({
      id: 'nr-route-passed-line',
      type: 'line',
      source: 'nr-route-passed',
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: { 'line-color': '#71717a', 'line-width': 6, 'line-opacity': 0.5 },
    })
  }
  if (!map.getSource('nr-route-remaining')) {
    map.addSource('nr-route-remaining', { type: 'geojson', data: makeLineFeature([]) })
    map.addLayer({
      id: 'nr-route-remaining-casing',
      type: 'line',
      source: 'nr-route-remaining',
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: { 'line-color': '#18181b', 'line-width': 11, 'line-opacity': 0.75 },
    })
    map.addLayer({
      id: 'nr-route-remaining-line',
      type: 'line',
      source: 'nr-route-remaining',
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: { 'line-color': '#ec8314', 'line-width': 7, 'line-opacity': 0.96 },
    })
  }
}

export function renderDriverStopMarkers({ map, snapshot, stops, stopMarkers }) {
  for (const m of stopMarkers) m.remove()
  stopMarkers.length = 0
  if (!map || !snapshot) return

  const origin = pointToLatLng(snapshot.origin)
  if (origin) {
    stopMarkers.push(
      new maplibregl.Marker({
        element: createStopMarkerElement({ variant: 'success', icon: 'mdi-flag-outline' }),
        anchor: 'bottom',
      })
        .setLngLat([origin[1], origin[0]])
        .addTo(map),
    )
  }

  for (const stop of stops || []) {
    const pt = pointToLatLng(stop.point_snapshot)
    if (!pt) continue
    const handled = stop.state === 'handled' || stop.state === 'completed'
    const firstPassenger = (stop.participants || []).find((p) => p.profile_picture_url || p.passenger_name)
    stopMarkers.push(
      new maplibregl.Marker({
        element: createStopMarkerElement({
          variant: handled ? 'success' : 'primary',
          label: firstPassenger?.profile_picture_url ? '' : String(stop.position ?? ''),
          avatarUrl: firstPassenger?.profile_picture_url || '',
          avatarAlt: firstPassenger?.passenger_name || `Parada #${stop.position}`,
        }),
        anchor: 'bottom',
      })
        .setLngLat([pt[1], pt[0]])
        .addTo(map),
    )
  }

  const dest = pointToLatLng(snapshot.destination)
  if (dest) {
    stopMarkers.push(
      new maplibregl.Marker({
        element: createStopMarkerElement({ variant: 'danger', icon: 'mdi-flag-checkered' }),
        anchor: 'bottom',
      })
        .setLngLat([dest[1], dest[0]])
        .addTo(map),
    )
  }
}
