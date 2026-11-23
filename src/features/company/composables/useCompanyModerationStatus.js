import { computed, onScopeDispose, ref, shallowRef, watch } from 'vue'
import api from '@/api/client'
import { useAuthStore } from '@/stores/useAuthStore'
import { sessionError } from '@/stores/session'
import { formatApiError } from '@/utils/apiErrors'

const MODERATION_LABELS = {
  pending: 'Pendente de moderação',
  approved: 'Aprovado',
  rejected: 'Recusado na moderação',
}

/**
 * Carrega e acompanha o estado cadastral da empresa autenticada (`/companies/me/`).
 */
export function useCompanyModerationStatus({
  watchIdentity = true,
  canLoad = () => true,
  onIdentityReset = null,
} = {}) {
  const auth = useAuthStore()
  const company = ref(null)
  const companyLoading = shallowRef(false)
  const companyError = shallowRef('')

  const approved = computed(
    () => Boolean(company.value?.is_approved && company.value.review_status === 'approved'),
  )
  const moderationLabel = computed(
    () => MODERATION_LABELS[company.value?.review_status] || 'Estado cadastral não reconhecido',
  )

  let companyRequest = null
  let disposed = false

  function abortCompanyRequest() {
    companyRequest?.abort()
    companyRequest = null
  }

  async function loadCompany() {
    if (disposed || !canLoad()) return null
    abortCompanyRequest()
    company.value = null
    companyError.value = ''
    companyLoading.value = false
    if (!auth.logged || auth.role !== 'company') return null

    const controller = new AbortController()
    companyRequest = controller
    companyLoading.value = true
    try {
      const { data } = await api.get('/companies/me/', { signal: controller.signal })
      if (!controller.signal.aborted) company.value = data
      return data
    } catch (cause) {
      if (!controller.signal.aborted) {
        company.value = null
        companyError.value = sessionError(
          cause,
          formatApiError(cause, 'Não foi possível consultar seu cadastro empresarial.'),
        )
      }
      return null
    } finally {
      if (!controller.signal.aborted) companyLoading.value = false
    }
  }

  if (watchIdentity) {
    watch(
      () => `${auth.logged}:${auth.role}:${auth.user?.id || ''}`,
      () => {
        abortCompanyRequest()
        company.value = null
        onIdentityReset?.()
        loadCompany()
      },
      { immediate: true, flush: 'sync' },
    )
  }

  onScopeDispose(() => {
    disposed = true
    abortCompanyRequest()
  })

  return {
    auth,
    company,
    companyLoading,
    companyError,
    approved,
    moderationLabel,
    loadCompany,
  }
}
