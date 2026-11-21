import { nextTick, onUnmounted } from 'vue'
import L from 'leaflet'
import { attachThemedTileLayer, createPinIcon, ensureLeafletIcons } from '@/utils/leafletTiles'
import { escapeHtml } from '@/utils/leafletMarkers'

export function useLinkedPassengerMap(mapContainer) {
  ensureLeafletIcons()
  let map = null
  let cleanupTiles = null

  function destroyMap() {
    cleanupTiles?.()
    cleanupTiles = null
    if (map) {
      map.remove()
      map = null
    }
  }

  async function renderMap({ latitude, longitude, name, formattedAddress }) {
    destroyMap()
    await nextTick()
    if (!mapContainer.value) return
    const lat = Number(latitude)
    const lng = Number(longitude)
    map = L.map(mapContainer.value, { zoomControl: true, attributionControl: true }).setView([lat, lng], 15)
    cleanupTiles = attachThemedTileLayer(map)
    const popupText = [`<strong>${escapeHtml(name || 'Passageiro')}</strong>`, escapeHtml(formattedAddress)]
      .filter(Boolean)
      .join('<br>')
    L.marker([lat, lng], { icon: createPinIcon({ icon: 'mdi-account' }) })
      .addTo(map)
      .bindPopup(popupText)
      .openPopup()
  }

  onUnmounted(destroyMap)
  return { renderMap, destroyMap }
}
