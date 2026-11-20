import { computed, nextTick, onUnmounted, shallowRef, watch } from 'vue'
import { useRoute } from 'vue-router'
import L from 'leaflet'
import { ROUTE_NAMES, USER_ROLES } from '@/constants'
import { state } from '@/stores/state'
import api from '@/api/client'
import { sessionError } from '@/stores/session'
import { formatApiError } from '@/utils/apiErrors'
import { attachThemedTileLayer, ensureLeafletIcons } from '@/utils/leafletTiles'

export function useLinkedProfile(mapContainer) {
  ensureLeafletIcons()

  const route = useRoute()
  const driver = computed(() => route.name === ROUTE_NAMES.LINKED_DRIVER)
  const profile = shallowRef(null)
  const loading = shallowRef(false)
  const error = shallowRef('')
  const reloadToken = shallowRef(0)

  let map = null
  let cleanupTiles = null

  const hasCoordinates = computed(() => {
    const lat = Number(profile.value?.latitude)
    const lng = Number(profile.value?.longitude)
    return (
      profile.value?.latitude != null &&
      profile.value?.longitude != null &&
      Number.isFinite(lat) &&
      Number.isFinite(lng)
    )
  })

  const formattedAddress = computed(() => {
    if (!profile.value) return ''
    return [
      [profile.value.street, profile.value.number].filter(Boolean).join(', '),
      profile.value.complement,
      profile.value.neighborhood,
      [profile.value.city, profile.value.state].filter(Boolean).join('/'),
    ]
      .filter(Boolean)
      .join(' — ')
  })

  const avatarUrl = computed(() => profile.value?.profile_picture_url || '')
  const initials = computed(() =>
    (profile.value?.name || 'U')
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join(''),
  )

  function destroyMap() {
    cleanupTiles?.()
    cleanupTiles = null
    if (map) {
      map.remove()
      map = null
    }
  }

  async function renderMap() {
    destroyMap()
    if (driver.value || !hasCoordinates.value) return
    await nextTick()
    if (!mapContainer.value) return

    const lat = Number(profile.value.latitude)
    const lng = Number(profile.value.longitude)
    map = L.map(mapContainer.value, { zoomControl: true, attributionControl: true }).setView([lat, lng], 15)
    cleanupTiles = attachThemedTileLayer(map)

    const popupText = [`<strong>${profile.value.name || 'Passageiro'}</strong>`, formattedAddress.value]
      .filter(Boolean)
      .join('<br>')

    L.marker([lat, lng]).addTo(map).bindPopup(popupText).openPopup()
  }

  watch(
    [() => route.params.id, driver, () => `${state.logged}:${state.role}:${state.user?.id}`, reloadToken],
    async (_value, _old, onCleanup) => {
      destroyMap()
      profile.value = null
      error.value = ''
      loading.value = false
      if (!state.logged || state.role !== USER_ROLES.COMPANY) return

      const id = String(route.params.id)
      if (!/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id))) {
        error.value = 'Identificador de perfil inválido.'
        return
      }

      const controller = new AbortController()
      onCleanup(() => controller.abort())
      loading.value = true
      try {
        const { data } = await api.get(`/${driver.value ? 'drivers' : 'passengers'}/${id}/`, {
          signal: controller.signal,
        })
        if (!controller.signal.aborted) {
          const userData = data.user_data || {}
          profile.value = {
            id: data.id,
            name: userData.name || '',
            phone: userData.phone || '',
            profile_picture_url: userData.profile_picture_data?.url || '',
            cep: userData.cep || '',
            street: userData.street || '',
            number: userData.number || '',
            complement: userData.complement || '',
            neighborhood: userData.neighborhood || '',
            city: userData.city || '',
            state: userData.state || '',
            latitude: userData.latitude ?? null,
            longitude: userData.longitude ?? null,
            average: data.average_rating,
            ratings: data.ratings_count,
          }
          await renderMap()
        }
      } catch (cause) {
        if (!controller.signal.aborted) {
          error.value = sessionError(cause, formatApiError(cause, 'O perfil não está disponível para esta empresa.'))
        }
      } finally {
        if (!controller.signal.aborted) loading.value = false
      }
    },
    { immediate: true, flush: 'sync' },
  )

  onUnmounted(destroyMap)

  return {
    driver,
    profile,
    loading,
    error,
    hasCoordinates,
    avatarUrl,
    initials,
    reload: () => {
      reloadToken.value += 1
    },
  }
}
