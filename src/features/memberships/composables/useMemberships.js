import { computed, onScopeDispose, ref, watch } from 'vue'
import { loadMemberships, requestMembership, transitionMembership } from '@/api/memberships'
import { sessionError } from '@/stores/session'
import { formatApiError } from '@/utils/apiErrors'

// Uma instância por tela/identidade. Uma escrita nunca é abortada por trocar a página da lista.
export function useMemberships(scope, status = ref('')) {
  const records = ref([])
  const openMembership = ref(null)
  const openCompany = ref(null)
  const page = ref(1)
  const totalPages = ref(1)
  const loading = ref(false)
  const busy = ref(false)
  const ready = ref(false)
  const error = ref('')
  const notice = ref('')
  const canRequest = computed(() => ready.value && !loading.value && !busy.value && !openMembership.value)
  let reader = null
  let lifetime = new AbortController()
  let disposed = false

  async function refresh(targetPage = page.value) {
    if (disposed || !scope.value) return false
    reader?.abort()
    const request = new AbortController()
    reader = request
    const signal = AbortSignal.any([request.signal, lifetime.signal])
    loading.value = true
    ready.value = false
    error.value = ''
    records.value = []
    try {
      const data = await loadMemberships(scope.value, { page: targetPage, status: status.value, signal })
      if (signal.aborted) return false
      records.value = data.results
      openMembership.value = data.openMembership
      openCompany.value = data.openCompany
      page.value = data.page
      totalPages.value = data.totalPages
      ready.value = true
      return true
    } catch (cause) {
      if (!signal.aborted) {
        error.value = sessionError(cause, formatApiError(cause, 'Não foi possível consultar os vínculos.'))
        error.value += ' Atualize a consulta antes de realizar outra ação.'
      }
      return false
    } finally {
      if (!signal.aborted) loading.value = false
    }
  }

  async function write(operation, successMessage) {
    if (disposed || busy.value || loading.value || !ready.value || !scope.value) return false
    const signal = lifetime.signal
    reader?.abort()
    busy.value = true
    ready.value = false
    error.value = ''
    notice.value = ''
    try {
      await operation(signal)
      if (signal.aborted) return false
      notice.value = successMessage
      // Confirmação da escrita e sucesso da releitura são estados distintos.
      await refresh(1)
      return !signal.aborted
    } catch (cause) {
      if (signal.aborted) return false
      error.value = sessionError(cause, formatApiError(cause, 'Não foi possível concluir a ação de vínculo.'))
      if (!cause.response || cause.response.status >= 500) {
        error.value += ' O resultado é incerto. A operação não foi repetida.'
      }
      error.value += ' Atualize os vínculos antes de tentar novamente.'
      return false
    } finally {
      if (!signal.aborted) busy.value = false
    }
  }

  function request(companyId, routeGroupId = null, contactPhone = '') {
    const profile = scope.value?.passenger ? 'passenger' : scope.value?.driver ? 'driver' : null
    if (!profile || !canRequest.value) return false
    const message =
      profile === 'passenger' && routeGroupId
        ? 'Pedido enviado. Ao ser aprovado pela empresa, você será adicionado automaticamente ao grupo de rota selecionado.'
        : 'Pedido enviado. Aguarde a decisão da empresa.'
    return write(
      (signal) => requestMembership(companyId, profile, { routeGroupId, contactPhone, signal }),
      message
    )
  }

  function transition(record, action, reason) {
    const expectedStatus = action === 'end' ? 'active' : 'pending'
    if (!record || record.status !== expectedStatus || typeof reason !== 'string' || reason.length > 500) return false
    const personal = Boolean(scope.value?.passenger || scope.value?.driver)
    if (personal ? !['withdraw', 'end'].includes(action) : !['approve', 'reject', 'end'].includes(action)) return false
    const known = records.value.some((item) => item.id === record.id && item.status === expectedStatus) ||
      (openMembership.value?.id === record.id && openMembership.value.status === expectedStatus)
    if (!known) return false
    const messages = {
      approve: 'Vínculo aprovado. Grupo, ponto e serviços são configurações posteriores.',
      reject: 'Pedido recusado. A conta do titular foi preservada.',
      withdraw: 'Pedido retirado. Sua conta foi preservada.',
      end: 'Vínculo encerrado. Conta e registros foram preservados; o acesso operacional à empresa terminou.',
    }
    return write((signal) => transitionMembership(record.id, action, reason.trim(), { signal }), messages[action])
  }

  function goToPage(target) {
    if (!busy.value && target >= 1 && target <= totalPages.value) return refresh(target)
  }

  watch(scope, () => {
    lifetime.abort()
    lifetime = new AbortController()
    reader?.abort()
    records.value = []
    openMembership.value = null
    openCompany.value = null
    notice.value = ''
    error.value = ''
    ready.value = false
    busy.value = false
    loading.value = false
    page.value = 1
    totalPages.value = 1
    if (scope.value) refresh(1)
  }, { immediate: true, flush: 'sync' })

  watch(status, () => {
    if (!busy.value) refresh(1)
  })

  onScopeDispose(() => {
    disposed = true
    lifetime.abort()
    reader?.abort()
  })

  return {
    records, openMembership, openCompany, page, totalPages, loading, busy, ready,
    error, notice, canRequest, refresh, goToPage, request, transition,
  }
}
