import { onScopeDispose, reactive, shallowRef } from 'vue'
import api from '@/api/client'

const STATUSES = ['pending', 'active', 'rejected', 'ended']

// Conta vínculos por situação pedindo 1 item por página: o total de páginas é o total de registros.
export function useMembershipCounts() {
  const counts = reactive({ pending: null, active: null, rejected: null, ended: null })
  const loading = shallowRef(false)
  let controller = null

  async function loadCounts(scope) {
    if (!scope) return
    controller?.abort()
    controller = new AbortController()
    const { signal } = controller
    loading.value = true
    try {
      const results = await Promise.all(
        STATUSES.map((status) =>
          api
            .get('/memberships/', { params: { ...scope, status, page: 1, page_size: 1 }, signal })
            .then(({ data }) => (data.results?.length ? Number(data.total_pages) : 0))
            .catch(() => null),
        ),
      )
      if (signal.aborted) return
      STATUSES.forEach((status, i) => (counts[status] = results[i]))
    } finally {
      if (!signal.aborted) loading.value = false
    }
  }

  onScopeDispose(() => controller?.abort())
  return { counts, loading, loadCounts }
}
