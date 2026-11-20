import { computed, onScopeDispose, reactive, ref, shallowRef, watch } from 'vue'
import { getServedCities, searchCompanies } from '@/api/companies'
import { formatApiError } from '@/utils/apiErrors'
import { sessionError } from '@/stores/session'

export function useCompanyDirectory() {
  const filters = reactive({
    destination: '',
    state: '',
    city: '',
    ordering: 'trade_name',
  })
  const results = ref([])
  const loading = shallowRef(false)
  const searched = shallowRef(false)
  const error = shallowRef('')
  const validationError = shallowRef('')
  const page = shallowRef(1)
  const totalPages = shallowRef(1)

  const servedCities = ref([])
  const citiesLoading = shallowRef(false)
  const citiesError = shallowRef('')

  const hasSearchCriteria = computed(() =>
    Boolean(filters.destination.trim() || filters.city.trim() || filters.state.trim())
  )
  const activeFilterCount = computed(() => (filters.state ? 1 : 0) + (filters.city ? 1 : 0))

  let appliedFilters = { ...filters }
  let controller = null
  let disposed = false

  watch(
    () => filters.state,
    async (selectedState, _previous, onCleanup) => {
      const request = new AbortController()
      let current = true
      onCleanup(() => {
        current = false
        request.abort()
      })
      citiesLoading.value = true
      citiesError.value = ''
      try {
        const list = await getServedCities(selectedState, { signal: request.signal })
        if (!current) return
        servedCities.value = list
        if (filters.city && !list.some((item) => item.city.toLowerCase() === filters.city.toLowerCase())) {
          filters.city = ''
        }
      } catch (cause) {
        if (!current || request.signal.aborted) return
        servedCities.value = []
        citiesError.value = formatApiError(cause, 'Não foi possível carregar as cidades atendidas.')
      } finally {
        if (current) citiesLoading.value = false
      }
    },
    { immediate: true }
  )

  async function load(targetPage) {
    if (disposed) return
    controller?.abort()
    const request = new AbortController()
    controller = request
    loading.value = true
    searched.value = true
    error.value = ''
    validationError.value = ''
    results.value = []
    try {
      const data = await searchCompanies(appliedFilters, { page: targetPage, signal: request.signal })
      if (request.signal.aborted) return
      results.value = data.results
      page.value = data.page
      totalPages.value = data.totalPages
    } catch (cause) {
      if (!request.signal.aborted) {
        error.value = sessionError(cause, formatApiError(cause, 'Não foi possível pesquisar empresas.'))
      }
    } finally {
      if (!request.signal.aborted) loading.value = false
    }
  }

  function search() {
    if (!hasSearchCriteria.value) {
      validationError.value = 'Informe o nome do grupo de rota ou selecione estado/cidade nos filtros.'
      return
    }
    validationError.value = ''
    appliedFilters = { ...filters }
    return load(1)
  }

  function clearFilters() {
    filters.state = ''
    filters.city = ''
    filters.ordering = 'trade_name'
    validationError.value = ''
    if (filters.destination.trim()) {
      appliedFilters = { ...filters }
      return load(1)
    }
    searched.value = false
    results.value = []
    error.value = ''
  }

  function goToPage(target) {
    if (target >= 1 && target <= totalPages.value) return load(target)
  }

  onScopeDispose(() => {
    disposed = true
    controller?.abort()
  })

  return {
    filters,
    results,
    loading,
    searched,
    error,
    validationError,
    page,
    totalPages,
    servedCities,
    citiesLoading,
    citiesError,
    hasSearchCriteria,
    activeFilterCount,
    search,
    clearFilters,
    goToPage,
  }
}
