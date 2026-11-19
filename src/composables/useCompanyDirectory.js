import { onScopeDispose, reactive, ref } from 'vue'
import { searchCompanies } from '@/api/companies'
import { formatApiError } from '@/utils/apiErrors'
import { sessionError } from '@/stores/session'

export function useCompanyDirectory() {
  const filters = reactive({ trade_name: '', city: '', state: '', destination: '' })
  const results = ref([])
  const loading = ref(false)
  const searched = ref(false)
  const error = ref('')
  const page = ref(1)
  const totalPages = ref(1)
  let appliedFilters = { ...filters }
  let controller = null
  let disposed = false

  async function load(targetPage) {
    if (disposed) return
    controller?.abort()
    const request = new AbortController()
    controller = request
    loading.value = true
    searched.value = true
    error.value = ''
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
    appliedFilters = { ...filters }
    return load(1)
  }

  function goToPage(target) {
    if (target >= 1 && target <= totalPages.value) return load(target)
  }

  onScopeDispose(() => {
    disposed = true
    controller?.abort()
  })

  return { filters, results, loading, searched, error, page, totalPages, search, goToPage }
}
