import { computed, nextTick, onMounted, onUnmounted, shallowRef, watch } from 'vue'
import L from 'leaflet'
import api from '@/api/client'
import { attachThemedTileLayer, DEFAULT_MAP_CENTER, ensureLeafletIcons } from '@/utils/leafletTiles'

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

  const loadingCep = shallowRef(false)
  const cepFeedback = shallowRef('')
  const isFullscreen = shallowRef(false)

  let map = null
  let cleanupTiles = null
  let marker = null
  let lastFetchedCep = ''

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
      marker = L.marker([nLat, nLng], { draggable: true })
        .addTo(map)
        .bindPopup('Localização selecionada (arraste para ajustar)')
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
      if (isDisabled()) return
      setPin(event.latlng.lat, event.latlng.lng, false)
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
    () => String(cep.value || '').replace(/\D/g, ''),
    async (cleanCep, _prev, onCleanup) => {
      if (cleanCep.length !== 8) {
        lastFetchedCep = ''
        loadingCep.value = false
        cepFeedback.value = ''
        street.value = ''
        neighborhood.value = ''
        city.value = ''
        state.value = ''
        return
      }
      if (cleanCep === lastFetchedCep) return

      const controller = new AbortController()
      let current = true
      onCleanup(() => {
        current = false
        controller.abort()
      })

      loadingCep.value = true
      cepFeedback.value = ''
      try {
        const { data } = await api.get(`/cep/${cleanCep}/`, { signal: controller.signal })
        if (!current) return
        lastFetchedCep = cleanCep
        state.value = data.state || ''
        city.value = data.city || ''
        street.value = data.street || ''
        neighborhood.value = data.neighborhood || ''
        if (data.latitude != null && data.longitude != null) {
          setPin(data.latitude, data.longitude, true)
          cepFeedback.value =
            'Endereço e posição aproximada preenchidos pelo CEP. Ajuste o pino no mapa se necessário.'
        } else {
          cepFeedback.value = 'Endereço preenchido pelo CEP. Clique no mapa abaixo para marcar o ponto exato.'
        }
      } catch {
        if (!current || controller.signal.aborted) return
        cepFeedback.value = 'Não foi possível consultar o CEP agora. Marque a localização diretamente no mapa.'
      } finally {
        if (current) loadingCep.value = false
      }
    },
  )

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

  return {
    loadingCep,
    cepFeedback,
    isFullscreen,
    hasCoordinates,
    toggleFullscreen,
  }
}
