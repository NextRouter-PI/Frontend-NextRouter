import { nextTick, onMounted, onUnmounted } from 'vue'
import L from 'leaflet'
import { attachThemedTileLayer, createPinIcon, DEFAULT_MAP_CENTER, ensureLeafletIcons } from '@/utils/leafletTiles'

function escapeHtml(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function formatPassengerAddress(item) {
  const streetLine = [item.street, item.number].filter(Boolean).join(', ')
  const extra = [item.complement, item.neighborhood].filter(Boolean).join(' · ')
  const cityLine = [item.city, item.state].filter(Boolean).join('/')
  return [streetLine, extra, cityLine].filter(Boolean).join(' — ') || 'Endereço não informado'
}

function passengerTooltipHtml(item) {
  const safeName = escapeHtml(item.passenger_name || 'Passageiro')
  const avatar = item.profile_picture_url
    ? `<img src="${escapeHtml(item.profile_picture_url)}" alt="${safeName}" class="pmap-tip-avatar" />`
    : `<span class="pmap-tip-fallback">${escapeHtml((item.passenger_name || 'P').trim().charAt(0).toUpperCase())}</span>`
  return `<div class="pmap-tip">${avatar}<span class="pmap-tip-name">${safeName}</span></div>`
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

      const tooltipHtml = passengerTooltipHtml(item)

      if (item.selected) {
        const marker = L.marker([lat, lng], {
          draggable: true,
          icon: createPinIcon({
            icon: 'mdi-account-check',
            avatarUrl: item.profile_picture_url || '',
            avatarAlt: item.passenger_name || 'Passageiro',
          }),
        })
          .bindTooltip(tooltipHtml, {
            direction: 'top',
            offset: [0, -14],
            opacity: 0.98,
            className: 'passenger-map-tooltip',
          })
          .bindPopup(
            `<strong>${escapeHtml(item.passenger_name)}</strong> (selecionado)<br>${escapeHtml(formatPassengerAddress(item))}<br><small>Arraste o pino para ajustar o ponto exato.</small>`,
          )
          .addTo(markersLayer)

        marker.on('dragend', () => {
          const pos = marker.getLatLng()
          item.latitude = Number(pos.lat.toFixed(6))
          item.longitude = Number(pos.lng.toFixed(6))
        })
      } else {
        const marker = L.marker([lat, lng], {
          icon: createPinIcon({
            variant: 'muted',
            icon: 'mdi-account-outline',
            avatarUrl: item.profile_picture_url || '',
            avatarAlt: item.passenger_name || 'Passageiro',
            size: 'sm',
          }),
        })
          .bindTooltip(tooltipHtml, {
            direction: 'top',
            offset: [0, -10],
            opacity: 0.98,
            className: 'passenger-map-tooltip',
          })
          .bindPopup(
            `<strong>${escapeHtml(item.passenger_name)}</strong><br>${escapeHtml(formatPassengerAddress(item))}<br><small>Clique para incluir na rota.</small>`,
          )
          .addTo(markersLayer)

        marker.on('click', () => onTogglePassenger(item))
      }
    }

    if (bounds.length) {
      map.fitBounds(bounds, { padding: [32, 32], maxZoom: 15 })
    }
  }

  function initMap() {
    if (map || !mapContainer.value) return
    map = L.map(mapContainer.value, { zoomControl: true, attributionControl: true }).setView(initialCenter(), 13)
    cleanupTiles = attachThemedTileLayer(map)
    renderMarkers()
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
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      map.setView([lat, lng], 16)
    }
  }

  function invalidateSize() {
    if (map) map.invalidateSize()
  }

  onMounted(async () => {
    await nextTick()
    initMap()
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

  return {
    formatAddress: formatPassengerAddress,
    renderMarkers,
    focusPassenger,
    getCenterCoords,
    invalidateSize,
  }
}
