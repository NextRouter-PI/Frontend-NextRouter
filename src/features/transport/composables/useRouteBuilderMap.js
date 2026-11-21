import { nextTick, onMounted, onUnmounted } from 'vue'
import L from 'leaflet'
import { attachThemedTileLayer, createPinIcon, DEFAULT_MAP_CENTER, ensureLeafletIcons } from '@/utils/leafletTiles'
import { buildPassengerTooltipHtml, escapeHtml } from '@/utils/leafletMarkers'

function formatPassengerAddress(item) {
  const streetLine = [item.street, item.number].filter(Boolean).join(', ')
  const extra = [item.complement, item.neighborhood].filter(Boolean).join(' · ')
  const cityLine = [item.city, item.state].filter(Boolean).join('/')
  return [streetLine, extra, cityLine].filter(Boolean).join(' — ') || 'Endereço não informado'
}

export function useRouteBuilderMap({ mapContainer, candidates, getDestinationCoords, onTogglePassenger }) {
  ensureLeafletIcons()

  let map = null
  let cleanupTiles = null
  let markersLayer = null

  function initialCenter() {
    const coords = getDestinationCoords()
    return Array.isArray(coords) && coords.length === 2 ? coords : DEFAULT_MAP_CENTER
  }

  function renderMarkers() {
    if (!map) return
    if (markersLayer) markersLayer.clearLayers()
    else markersLayer = L.layerGroup().addTo(map)

    const bounds = []
    for (const item of candidates.value) {
      const lat = Number(item.latitude)
      const lng = Number(item.longitude)
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue
      bounds.push([lat, lng])

      const tooltipHtml = buildPassengerTooltipHtml(item)
      const marker = L.marker([lat, lng], {
        draggable: Boolean(item.selected),
        icon: createPinIcon({
          variant: item.selected ? 'primary' : 'muted',
          icon: item.selected ? 'mdi-account-check' : 'mdi-account-outline',
          avatarUrl: item.profile_picture_url || '',
          avatarAlt: item.passenger_name || 'Passageiro',
          size: item.selected ? 'md' : 'sm',
        }),
      })
        .bindTooltip(tooltipHtml, {
          direction: 'top',
          offset: [0, item.selected ? -14 : -10],
          opacity: 0.98,
          className: 'passenger-map-tooltip',
        })
        .bindPopup(
          `<strong>${escapeHtml(item.passenger_name)}</strong>${item.selected ? ' (selecionado)' : ''}<br>${escapeHtml(formatPassengerAddress(item))}<br><small>${item.selected ? 'Arraste o pino para ajustar o ponto exato.' : 'Clique para incluir na rota.'}</small>`,
        )
        .addTo(markersLayer)

      if (item.selected) {
        marker.on('dragend', () => {
          const pos = marker.getLatLng()
          item.latitude = Number(pos.lat.toFixed(6))
          item.longitude = Number(pos.lng.toFixed(6))
        })
      } else {
        marker.on('click', () => onTogglePassenger(item))
      }
    }

    if (bounds.length) map.fitBounds(bounds, { padding: [32, 32], maxZoom: 15 })
  }

  function getCenterCoords() {
    if (map) {
      const c = map.getCenter()
      return { lat: Number(c.lat.toFixed(6)), lng: Number(c.lng.toFixed(6)) }
    }
    const [lat, lng] = initialCenter()
    return { lat, lng }
  }

  function focusPassenger(item) {
    if (!map) return
    const lat = Number(item.latitude)
    const lng = Number(item.longitude)
    if (Number.isFinite(lat) && Number.isFinite(lng)) map.setView([lat, lng], 16)
  }

  function invalidateSize() {
    if (map) map.invalidateSize()
  }

  onMounted(async () => {
    await nextTick()
    if (map || !mapContainer.value) return
    map = L.map(mapContainer.value, { zoomControl: true, attributionControl: true }).setView(initialCenter(), 13)
    cleanupTiles = attachThemedTileLayer(map)
    renderMarkers()
  })

  onUnmounted(() => {
    cleanupTiles?.()
    cleanupTiles = null
    if (map) {
      map.remove()
      map = null
      markersLayer = null
    }
  })

  return { formatAddress: formatPassengerAddress, renderMarkers, focusPassenger, getCenterCoords, invalidateSize }
}
