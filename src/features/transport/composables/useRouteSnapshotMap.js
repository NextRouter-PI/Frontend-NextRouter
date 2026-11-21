import { computed, nextTick, onMounted, onUnmounted, watch } from 'vue'
import L from 'leaflet'
import { attachThemedTileLayer, createPinIcon, DEFAULT_MAP_CENTER } from '@/utils/leafletTiles'

export function pointLatLng(point) {
  if (!point) return null
  const lat = Number(point.latitude)
  const lng = Number(point.longitude)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  return [lat, lng]
}

export function useRouteSnapshotMap({ mapContainer, getSnapshot, getStops }) {
  let map = null
  let cleanupTiles = null
  let routeLayer = null

  const orderedStops = computed(() =>
    [...(getStops() || [])].toSorted((a, b) => (a.position ?? 0) - (b.position ?? 0)),
  )

  const distanceLabel = computed(() => {
    const meters = Number(getSnapshot()?.distance_meters)
    return Number.isFinite(meters) && meters > 0 ? `${(meters / 1000).toFixed(1)} km` : ''
  })

  const durationLabel = computed(() => {
    const seconds = Number(getSnapshot()?.duration_seconds)
    return Number.isFinite(seconds) && seconds > 0 ? `${Math.max(1, Math.round(seconds / 60))} min` : ''
  })

  const hasMapData = computed(() => {
    const snapshot = getSnapshot()
    if (snapshot?.geometry?.coordinates?.length) return true
    if (pointLatLng(snapshot?.origin) || pointLatLng(snapshot?.destination)) return true
    return orderedStops.value.some((s) => pointLatLng(s.point_snapshot))
  })

  function renderRoute() {
    if (!map) return
    if (routeLayer) routeLayer.clearLayers()
    else routeLayer = L.layerGroup().addTo(map)

    const snapshot = getSnapshot()
    const boundsPoints = []

    if (snapshot?.geometry?.type && Array.isArray(snapshot.geometry.coordinates)) {
      const geo = L.geoJSON(snapshot.geometry, {
        style: { color: '#df801a', weight: 4, opacity: 0.9, className: 'nr-route-animated-dash' },
      }).addTo(routeLayer)
      const geoBounds = geo.getBounds()
      if (geoBounds.isValid()) {
        boundsPoints.push(geoBounds.getSouthWest(), geoBounds.getNorthEast())
      }
    }

    const fallbackCoords = []

    const originCoord = pointLatLng(snapshot?.origin)
    if (originCoord) {
      fallbackCoords.push(originCoord)
      boundsPoints.push(originCoord)
      L.marker(originCoord, {
        icon: createPinIcon({ variant: 'success', icon: 'mdi-flag-outline', size: 'sm' }),
      })
        .bindPopup(`<strong>Origem:</strong> ${snapshot.origin.name || 'Início'}`)
        .addTo(routeLayer)
    }

    for (const stop of orderedStops.value) {
      const coord = pointLatLng(stop.point_snapshot)
      if (!coord) continue
      fallbackCoords.push(coord)
      boundsPoints.push(coord)
      const handled = stop.state === 'handled' || stop.state === 'completed'
      const firstPassenger = (stop.participants || []).find((p) => p.profile_picture_url || p.passenger_name)
      const names = (stop.participants || []).map((p) => p.passenger_name).filter(Boolean).join(', ')
      L.marker(coord, {
        icon: createPinIcon({
          variant: handled ? 'success' : 'primary',
          label: firstPassenger?.profile_picture_url ? '' : String(stop.position ?? ''),
          avatarUrl: firstPassenger?.profile_picture_url || '',
          avatarAlt: firstPassenger?.passenger_name || `Parada #${stop.position}`,
          size: firstPassenger?.profile_picture_url ? 'md' : 'sm',
        }),
      })
        .bindTooltip(names ? `#${stop.position} · ${names}` : `#${stop.position}`, {
          direction: 'top',
          offset: [0, -6],
        })
        .bindPopup(
          `<strong>Parada #${stop.position}:</strong> ${stop.point_snapshot?.name || 'Ponto'}${names ? `<br>${names}` : ''}<br><small>Estado: ${stop.state || 'pendente'}</small>`,
        )
        .addTo(routeLayer)
    }

    const destCoord = pointLatLng(snapshot?.destination)
    if (destCoord) {
      fallbackCoords.push(destCoord)
      boundsPoints.push(destCoord)
      L.marker(destCoord, {
        icon: createPinIcon({ variant: 'danger', icon: 'mdi-flag-checkered', size: 'sm' }),
      })
        .bindPopup(`<strong>Destino:</strong> ${snapshot.destination.name || 'Destino'}`)
        .addTo(routeLayer)
    }

    if (!snapshot?.geometry?.coordinates?.length && fallbackCoords.length >= 2) {
      L.polyline(fallbackCoords, {
        color: '#df801a',
        weight: 3,
        dashArray: '6 6',
        opacity: 0.85,
      }).addTo(routeLayer)
    }

    if (boundsPoints.length >= 2) {
      map.fitBounds(L.latLngBounds(boundsPoints), { padding: [28, 28], maxZoom: 15 })
    } else if (boundsPoints.length === 1) {
      map.setView(boundsPoints[0], 14)
    }
  }

  function initMap() {
    if (map || !mapContainer.value) return
    map = L.map(mapContainer.value, {
      zoomControl: true,
      attributionControl: true,
      scrollWheelZoom: false,
    }).setView(DEFAULT_MAP_CENTER, 13)
    cleanupTiles = attachThemedTileLayer(map)
    renderRoute()
  }

  watch(
    () => [getSnapshot(), getStops()],
    () => renderRoute(),
    { deep: true },
  )

  onMounted(async () => {
    if (!hasMapData.value) return
    await nextTick()
    initMap()
  })

  watch(hasMapData, async (available) => {
    if (available && !map) {
      await nextTick()
      initMap()
    }
  })

  onUnmounted(() => {
    cleanupTiles?.()
    cleanupTiles = null
    if (map) {
      map.remove()
      map = null
      routeLayer = null
    }
  })

  return { orderedStops, distanceLabel, durationLabel, hasMapData }
}
