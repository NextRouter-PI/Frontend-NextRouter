import { nextTick, onUnmounted, watch } from 'vue'
import L from 'leaflet'
import { attachThemedTileLayer, DEFAULT_MAP_CENTER } from '@/utils/leafletTiles'
import {
  animateDashedCalculationRoute,
  renderCalculationMarkers,
} from '@/features/company/utils/routeCalculationMapLayers'

export function useRouteCalculationMap({
  mapEl,
  isOpen,
  getSnapshot,
  getParticipants,
  getOriginPoint,
  getDestinationPoint,
}) {
  let map = null
  let cleanupTiles = null
  let markersLayer = null
  let routeAnimLayer = null
  let stopAnim = null
  let lastAnimatedSnapshotId = null

  function renderMapContents() {
    if (!map) return
    if (markersLayer) markersLayer.clearLayers()
    else markersLayer = L.layerGroup().addTo(map)

    const snapshot = getSnapshot()
    const bounds = renderCalculationMarkers({
      markersLayer,
      snapshot,
      originPoint: getOriginPoint(),
      destinationPoint: getDestinationPoint(),
      participants: getParticipants(),
    })

    const rawCoords = snapshot?.geometry?.coordinates
    if (snapshot?.state === 'ready' && Array.isArray(rawCoords) && rawCoords.length >= 2) {
      const latLngs = rawCoords.map(([lng, lat]) => [lat, lng])
      for (const pt of latLngs) bounds.push(pt)
      if (lastAnimatedSnapshotId !== snapshot.id || !routeAnimLayer || !routeAnimLayer.getLayers().length) {
        lastAnimatedSnapshotId = snapshot.id
        const anim = animateDashedCalculationRoute({
          map,
          routeAnimLayer,
          coordsLatLng: latLngs,
          onStop: () => stopAnim?.(),
        })
        routeAnimLayer = anim.routeAnimLayer
        stopAnim = anim.stop
      }
    } else if (routeAnimLayer) {
      stopAnim?.()
      routeAnimLayer.clearLayers()
    }

    if (bounds.length >= 2) map.fitBounds(L.latLngBounds(bounds), { padding: [36, 36], maxZoom: 15 })
    else if (bounds.length === 1) map.setView(bounds[0], 14)
  }

  function destroyMap() {
    stopAnim?.()
    stopAnim = null
    cleanupTiles?.()
    cleanupTiles = null
    if (map) {
      map.remove()
      map = markersLayer = routeAnimLayer = null
    }
    lastAnimatedSnapshotId = null
  }

  async function initMap() {
    await nextTick()
    if (!mapEl.value || map) return
    map = L.map(mapEl.value, { zoomControl: true, attributionControl: true }).setView(DEFAULT_MAP_CENTER, 13)
    cleanupTiles = attachThemedTileLayer(map)
    renderMapContents()
    setTimeout(() => map?.invalidateSize(), 120)
  }

  watch(isOpen, (opened) => (opened ? initMap() : destroyMap()))
  watch(
    () => [getSnapshot()?.id, getSnapshot()?.state, getParticipants()?.length, getOriginPoint(), getDestinationPoint()],
    () => { if (isOpen() && map) renderMapContents() },
  )
  onUnmounted(destroyMap)
}
