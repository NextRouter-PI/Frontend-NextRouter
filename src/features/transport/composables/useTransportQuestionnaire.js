import { computed, onMounted, ref, shallowRef } from 'vue'
import { useAccountScope } from '@/composables/useAccountScope'
import { useAsyncAction } from '@/composables/useAsyncAction'
import { sessionError } from '@/stores/session'
import { formatApiError } from '@/utils/apiErrors'
import { buildEnrichedEligibilities } from '@/features/transport/utils/questionnaireMapper'
import { fetchQuestionnaireSnapshot } from '@/features/transport/services/questionnaireService'
import { createQuestionnaireActions } from '@/features/transport/composables/useQuestionnaireActions'

/**
 * Gerencia elegibilidades, seleção por data e ações do questionário do passageiro.
 */
export function useTransportQuestionnaire() {
  const scope = useAccountScope()
  const loading = shallowRef(false)
  const { busy, error, notice, run, clearFeedback } = useAsyncAction(scope)

  const days = ref([])
  const eligibilities = ref([])
  const changeRequests = ref([])
  const participations = ref([])
  const travels = ref([])

  const selectedEligibilityId = shallowRef(null)
  const outboundChoice = shallowRef('')
  const returnChoice = shallowRef('')
  const changeLeg = shallowRef('outbound')
  const proposedServiceId = shallowRef('')

  const enrichedEligibilities = computed(() =>
    buildEnrichedEligibilities({
      days: days.value,
      eligibilities: eligibilities.value,
      changeRequests: changeRequests.value,
      participations: participations.value,
      travels: travels.value,
    }),
  )

  const selectedEligibility = computed(() => {
    if (!enrichedEligibilities.value.length) return null
    return enrichedEligibilities.value.find((e) => e.id === selectedEligibilityId.value) || enrichedEligibilities.value[0]
  })

  function syncDraftWithSelection(elig) {
    if (!elig) return
    const r = elig.response
    outboundChoice.value = r && r.outbound_service && !r.outbound_withdrawn_at ? String(r.outbound_service) : ''
    returnChoice.value = r && r.return_service && !r.return_withdrawn_at ? String(r.return_service) : ''
    proposedServiceId.value = ''
  }

  function selectEligibility(id) {
    selectedEligibilityId.value = id
    syncDraftWithSelection(enrichedEligibilities.value.find((e) => e.id === id))
    clearFeedback()
  }

  async function refresh({ force = false } = {}) {
    if (!scope.current() || (!force && busy.value)) return false
    loading.value = true
    error.value = ''
    try {
      const data = await fetchQuestionnaireSnapshot(scope.signal)
      if (!scope.current()) return false
      days.value = data.days
      eligibilities.value = data.eligibilities
      changeRequests.value = data.changeRequests
      participations.value = data.participations
      travels.value = data.travels
      if (selectedEligibility.value) {
        selectedEligibilityId.value = selectedEligibility.value.id
        syncDraftWithSelection(selectedEligibility.value)
      }
      return true
    } catch (cause) {
      if (scope.current()) {
        error.value = sessionError(cause, formatApiError(cause, 'Não foi possível consultar os atendimentos e respostas.'))
      }
      return false
    } finally {
      if (scope.current()) loading.value = false
    }
  }

  const actions = createQuestionnaireActions({
    scope,
    busy,
    error,
    run,
    selectedEligibility,
    outboundChoice,
    returnChoice,
    changeLeg,
    proposedServiceId,
    refresh,
  })

  onMounted(refresh)

  return {
    loading,
    busy,
    error,
    notice,
    enrichedEligibilities,
    selectedEligibility,
    outboundChoice,
    returnChoice,
    changeLeg,
    proposedServiceId,
    selectEligibility,
    refresh,
    ...actions,
  }
}
