import { shallowRef, watch } from 'vue'
import api from '@/api/client'

export function useCepLookup({ cep, street, neighborhood, city, state, onCoordinates }) {
  const loadingCep = shallowRef(false)
  const cepFeedback = shallowRef('')
  let lastFetchedCep = ''

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
          onCoordinates?.(data.latitude, data.longitude)
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

  return { loadingCep, cepFeedback }
}
