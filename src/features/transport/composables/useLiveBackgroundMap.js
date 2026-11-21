import { nextTick, onMounted, onUnmounted, watch } from 'vue'
import L from 'leaflet'
import { useAuthStore } from '@/stores/useAuthStore'
import { usePageVisibility } from '@/composables/usePageVisibility'
import { attachThemedTileLayer, createPinIcon, DEFAULT_MAP_CENTER } from '@/utils/leafletTiles'
import { pointToLatLng } from '@/utils/geo'
import { animateLngLatMarker } from '@/utils/mapAnimation'
import {
  frameBackgroundViewport,
  plannedCoordsLatLng,
  renderBackgroundPlannedRoute,
  renderConsumedPolylineLayers,
} from '@/features/transport/utils/leafletRouteLayers'

export function useLiveBackgroundMap({
  mapContainer, tracking, getSnapshot, getStops, getTargetPoint, getSelfLabel, getTrackingLabel, getTrackingIcon,
}) {
  const auth = useAuthStore()
  const { isVisible } = usePageVisibility()
  let map = null, trackingMarker = null, targetMarker = null, routeLayer = null
  let passedLine = null, remainingLine = null, trailLine = null, cleanupTiles = null
  let stopAnim = null, lastRenderedPos = null, cachedSnapshotRef = null
  let trailCoords = [], cachedPlannedCoords = []

  function getPlannedCoords() {
    const snap = getSnapshot()
    if (snap === cachedSnapshotRef) return cachedPlannedCoords
    cachedSnapshotRef = snap
    cachedPlannedCoords = plannedCoordsLatLng(snap)
    return cachedPlannedCoords
  }

  function initialCenter() {
    const target = pointToLatLng(getTargetPoint())
    if (target) return target
    if (auth.user?.latitude != null && auth.user?.longitude != null) return [auth.user.latitude, auth.user.longitude]
    return DEFAULT_MAP_CENTER
  }

  function renderTargetMarker() {
    if (!map) return
    if (targetMarker) {
      map.removeLayer(targetMarker)
      targetMarker = null
    }
    const target = pointToLatLng(getTargetPoint())
    if (!target) return
    targetMarker = L.marker(target, {
      icon: createPinIcon({ variant: 'success', icon: 'mdi-map-marker-account', size: 'md' }),
    })
      .addTo(map)
      .bindPopup(getTargetPoint()?.name || getSelfLabel())
  }

  function renderPlannedRoute() {
    const res = renderBackgroundPlannedRoute({
      map, routeLayer, snapshot: getSnapshot(), stops: getStops(), remainingLine, hasLiveLat: tracking.latitude != null,
    })
    routeLayer = res.routeLayer
    remainingLine = res.remainingLine
  }

  function updateTrailPolyline(nextPos) {
    const last = trailCoords[trailCoords.length - 1]
    if (last && last[0] === nextPos[0] && last[1] === nextPos[1]) return
    trailCoords.push(nextPos)
    if (!trailLine) {
      trailLine = L.polyline(trailCoords, {
        color: '#df801a', weight: 5, opacity: 0.92, className: 'nr-route-animated-dash',
      }).addTo(map)
    } else {
      trailLine.setLatLngs(trailCoords)
    }
  }

  watch(isVisible, (visible) => {
    if (!visible) { stopAnim?.(); stopAnim = null }
  })
  watch(() => [getSnapshot()?.id, getStops()?.length], renderPlannedRoute)
  watch(() => [getTargetPoint()?.latitude, getTargetPoint()?.longitude], renderTargetMarker)

  watch(() => [tracking.latitude, tracking.longitude], ([lat, lng]) => {
    if (!map || lat == null || lng == null) return
    const nextPos = [lat, lng]
    const coords = getPlannedCoords()
    if (coords.length >= 2) {
      const res = renderConsumedPolylineLayers({ map, coords, busPos: nextPos, passedLine, remainingLine })
      passedLine = res.passedLine
      remainingLine = res.remainingLine
    } else {
      updateTrailPolyline(nextPos)
    }

    if (!trackingMarker) {
      trackingMarker = L.marker(nextPos, {
        icon: createPinIcon({ icon: getTrackingIcon(), pulse: true }),
      }).addTo(map).bindPopup(getTrackingLabel())
      lastRenderedPos = nextPos
    } else if (!isVisible.value) {
      stopAnim?.()
      stopAnim = null
      trackingMarker.setLatLng(nextPos)
      lastRenderedPos = nextPos
    } else {
      stopAnim?.()
      stopAnim = animateLngLatMarker({
        startLngLat: lastRenderedPos || nextPos, nextLngLat: nextPos, duration: 1800,
        onStep: (pos) => { trackingMarker?.setLatLng(pos); lastRenderedPos = pos },
        onDone: () => { stopAnim = null; lastRenderedPos = nextPos },
      })
    }
    if (isVisible.value) frameBackgroundViewport(map, nextPos, getTargetPoint())
  })

  watch(() => tracking.tracking, (isTracking) => {
    if (isTracking || !map) return
    stopAnim?.()
    if (trackingMarker) { map.removeLayer(trackingMarker); trackingMarker = null }
    if (trailLine) { map.removeLayer(trailLine); trailLine = null }
    trailCoords = []
    lastRenderedPos = null
  })

  onMounted(async () => {
    await nextTick()
    if (map || !mapContainer.value) return
    map = L.map(mapContainer.value, {
      zoomControl: false, attributionControl: true, dragging: false, touchZoom: false,
      doubleClickZoom: false, scrollWheelZoom: false, boxZoom: false, keyboard: false,
    }).setView(initialCenter(), 14)
    cleanupTiles = attachThemedTileLayer(map)
    renderTargetMarker()
    renderPlannedRoute()
  })

  onUnmounted(() => {
    stopAnim?.()
    cleanupTiles?.()
    cleanupTiles = null
    map?.remove()
    map = routeLayer = passedLine = remainingLine = trailLine = trackingMarker = targetMarker = null
  })
}
