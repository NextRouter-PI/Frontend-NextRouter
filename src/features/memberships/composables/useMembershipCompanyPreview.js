import { computed, ref, shallowRef, watch } from 'vue'
import { getPublicCompany } from '@/api/companies'
import { sessionError } from '@/stores/session'
import { formatApiError } from '@/utils/apiErrors'

function parsePositiveIntQuery(value) {
  return typeof value === 'string' && /^[1-9]\d*$/.test(value) && Number.isSafeInteger(Number(value))
    ? Number(value)
    : null
}

/**
 * Resolve e carrega a empresa pública selecionada via query string (`?company=&group=`) para solicitação de vínculo.
 */
export function useMembershipCompanyPreview({ route, scope }) {
  const selectedCompany = ref(null)
  const selectedGroupId = shallowRef('')
  const selectionLoading = shallowRef(false)
  const selectionError = shallowRef('')

  const selectedId = computed(() => parsePositiveIntQuery(route.query.company))
  const requestedGroupQueryId = computed(() => parsePositiveIntQuery(route.query.group))

  watch(
    [selectedId, scope],
    async ([id, identity], _previous, onCleanup) => {
      selectedCompany.value = null
      selectedGroupId.value = ''
      selectionError.value = ''
      selectionLoading.value = false
      if (!id || !identity) return

      const controller = new AbortController()
      onCleanup(() => controller.abort())
      selectionLoading.value = true
      try {
        const company = await getPublicCompany(id, { signal: controller.signal })
        if (!controller.signal.aborted) {
          selectedCompany.value = company
          const groups = company.route_groups || []
          const matched = requestedGroupQueryId.value && groups.find((g) => g.id === requestedGroupQueryId.value)
          selectedGroupId.value = matched ? String(matched.id) : groups.length === 1 ? String(groups[0].id) : ''
        }
      } catch (cause) {
        if (!controller.signal.aborted) {
          selectionError.value = sessionError(cause, formatApiError(cause, 'A empresa não está disponível. Volte à busca.'))
        }
      } finally {
        if (!controller.signal.aborted) selectionLoading.value = false
      }
    },
    { immediate: true },
  )

  return {
    selectedId,
    selectedCompany,
    selectedGroupId,
    selectionLoading,
    selectionError,
  }
}
