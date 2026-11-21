import { computed, shallowRef, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ROUTE_NAMES, USER_ROLES } from '@/constants'
import { useAuthStore } from '@/stores/useAuthStore'
import api from '@/api/client'
import { sessionError } from '@/stores/session'
import { formatApiError } from '@/utils/apiErrors'
import { useLinkedPassengerMap } from './useLinkedPassengerMap'

export function useLinkedProfile(mapContainer) {
  const auth = useAuthStore()
  const route = useRoute()
  const { renderMap, destroyMap } = useLinkedPassengerMap(mapContainer)
  const driver = computed(() => route.name === ROUTE_NAMES.LINKED_DRIVER)
  const profile = shallowRef(null)
  const loading = shallowRef(false)
  const error = shallowRef('')
  const reloadToken = shallowRef(0)

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

  watch(
    [() => route.params.id, driver, () => auth.roleIdentityKey, reloadToken],
    async (_value, _old, onCleanup) => {
      destroyMap()
      profile.value = null
      error.value = ''
      loading.value = false
      if (!auth.logged || auth.role !== USER_ROLES.COMPANY) return

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
          if (!driver.value && hasCoordinates.value) {
            await renderMap({
              latitude: profile.value.latitude,
              longitude: profile.value.longitude,
              name: profile.value.name,
              formattedAddress: formattedAddress.value,
            })
          }
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

  return {
    driver, profile, loading, error, hasCoordinates, avatarUrl, initials,
    reload: () => { reloadToken.value += 1 },
  }
}
