import { computed, onScopeDispose, ref, shallowRef } from 'vue'
import api from '@/api/client'

/**
 * Carrega estatísticas diárias de rotas e passageiros da empresa (`/companies/me/stats/`).
 */
export function useCompanyStats() {
  const routesToday = shallowRef(null)
  const statsDate = shallowRef('')
  const serviceSlots = ref([])
  const statsLoading = shallowRef(false)
  let controller = null

  const todayLabel = computed(() =>
    new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
  )

  const passageirosHoje = computed(() =>
    serviceSlots.value.reduce(
      (acc, slot) => acc + (slot.allocated || 0) + (slot.on_board || 0) + (slot.dropped_off || 0),
      0,
    ),
  )

  async function fetchStats() {
    controller?.abort()
    controller = new AbortController()
    const signal = controller.signal
    statsLoading.value = true
    try {
      const { data: stats } = await api.get('/companies/me/stats/', { signal })
      if (signal.aborted) return
      routesToday.value = stats.routes_today
      statsDate.value = stats.date || ''
      serviceSlots.value = Array.isArray(stats.services) ? stats.services : []
    } catch {
      if (signal.aborted) return
      routesToday.value = null
      statsDate.value = ''
      serviceSlots.value = []
    } finally {
      if (!signal.aborted) statsLoading.value = false
    }
  }

  onScopeDispose(() => {
    controller?.abort()
  })

  return {
    routesToday,
    statsDate,
    serviceSlots,
    statsLoading,
    todayLabel,
    passageirosHoje,
    fetchStats,
  }
}
