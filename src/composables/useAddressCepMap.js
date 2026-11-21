import { computed, nextTick, onMounted, onUnmounted, shallowRef, watch } from 'vue'
import L from 'leaflet'
import { attachThemedTileLayer, createPinIcon, DEFAULT_MAP_CENTER, ensureLeafletIcons } from '@/utils/leafletTiles'
import { useCepLookup } from '@/composables/useCepLookup'

export function useAddressCepMap({
  mapEl,
  cep,
  street,
  neighborhood,
  city,
  state,
  latitude,
  longitude,
  isDisabled,
}) {
  ensureLeafletIcons()

  const isFullscreen = shallowRef(false)
  let map = null
  let cleanupTiles = null
  let marker = null

  const hasCoordinates = computed(
    () =>
      latitude.value != null &&
      longitude.value != null &&
      Number.isFinite(Number(latitude.value)) &&
      Number.isFinite(Number(longitude.value)),
  )

  function setPin(lat, lng, pan = true) {
    const nLat = Number(lat)
    const nLng = Number(lng)
    if (!Number.isFinite(nLat) || !Number.isFinite(nLng)) return
    latitude.value = Number(nLat.toFixed(6))
    longitude.value = Number(nLng.toFixed(6))

    if (!map) return
    if (!marker) {
      marker = L.marker([nLat, nLng], {
        draggable: true,
        icon: createPinIcon({ icon: 'mdi-map-marker' }),
      })
        .addTo(map)
        .bindPopup('<strong>Localização selecionada</strong><br><small>Arraste o pino para ajustar.</small>')
      marker.on('dragend', () => {
        const pos = marker.getLatLng()
        latitude.value = Number(pos.lat.toFixed(6))
        longitude.value = Number(pos.lng.toFixed(6))
      })
    } else {
      marker.setLatLng([nLat, nLng])
    }
    if (pan) map.setView([nLat, nLng], 16)
  }

  const { loadingCep, cepFeedback } = useCepLookup({
    cep,
    street,
    neighborhood,
    city,
    state,
    onCoordinates: (lat, lng) => setPin(lat, lng, true),
  })

  function initMap() {
    if (map || !mapEl.value) return
    const center = hasCoordinates.value
      ? [Number(latitude.value), Number(longitude.value)]
      : DEFAULT_MAP_CENTER
    map = L.map(mapEl.value, { zoomControl: true, attributionControl: true }).setView(
      center,
      hasCoordinates.value ? 16 : 13,
    )
    cleanupTiles = attachThemedTileLayer(map)
    map.on('click', (event) => {
      if (!isDisabled()) setPin(event.latlng.lat, event.latlng.lng, false)
    })
    if (hasCoordinates.value) setPin(latitude.value, longitude.value, false)
  }

  async function toggleFullscreen() {
    isFullscreen.value = !isFullscreen.value
    await nextTick()
    if (map) map.invalidateSize()
  }

  function onKeydown(event) {
    if (event.key === 'Escape' && isFullscreen.value) toggleFullscreen()
  }

  watch(
    () => [latitude.value, longitude.value],
    ([lat, lng]) => {
      if (!map) return
      if (lat == null || lat === '' || lng == null || lng === '') {
        if (marker) {
          map.removeLayer(marker)
          marker = null
        }
        return
      }
      const nLat = Number(lat)
      const nLng = Number(lng)
      if (!Number.isFinite(nLat) || !Number.isFinite(nLng)) return
      if (!marker) {
        setPin(nLat, nLng, true)
      } else {
        const current = marker.getLatLng()
        if (Math.abs(current.lat - nLat) > 1e-6 || Math.abs(current.lng - nLng) > 1e-6) {
          marker.setLatLng([nLat, nLng])
          map.panTo([nLat, nLng])
        }
      }
    },
  )

  onMounted(async () => {
    document.addEventListener('keydown', onKeydown)
    await nextTick()
    initMap()
  })

  onUnmounted(() => {
    document.removeEventListener('keydown', onKeydown)
    cleanupTiles?.()
    cleanupTiles = null
    if (map) {
      map.remove()
      map = null
      marker = null
    }
  })

  return { loadingCep, cepFeedback, isFullscreen, hasCoordinates, toggleFullscreen }
}
