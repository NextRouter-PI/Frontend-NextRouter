import { computed, ref, onMounted } from 'vue'
import { useAccountScope } from '@/composables/useAccountScope'
import { sessionError } from '@/stores/session'
import { formatApiError } from '@/utils/apiErrors'
import {
  listServiceDays,
  listEligibilities,
  answerEligibility,
  requestEligibilityChange,
  withdrawEligibilityLeg,
  listChangeRequests,
  withdrawChangeRequest,
  listTravelParticipations,
  listTravels,
} from '@/api/transport'

function formatTime(value) {
  if (!value) return ''
  return String(value).slice(0, 5)
}

export function useTransportQuestionnaire() {
  const scope = useAccountScope()
  const loading = ref(false)
  const busy = ref(false)
  const error = ref('')
  const notice = ref('')

  const days = ref([])
  const eligibilities = ref([])
  const changeRequests = ref([])
  const participations = ref([])
  const travels = ref([])

  const selectedEligibilityId = ref(null)
  const outboundChoice = ref('')
  const returnChoice = ref('')
  const changeLeg = ref('outbound')
  const proposedServiceId = ref('')

  const enrichedEligibilities = computed(() => {
    const daysMap = new Map(days.value.map((d) => [d.id, d]))
    const travelsMap = new Map(travels.value.map((t) => [t.id, t]))

    return eligibilities.value
      .map((elig) => {
        const day = daysMap.get(elig.day) || { id: elig.day, date: 'Data não informada', window: 'unknown' }
        const services = Array.isArray(elig.authorized_services) ? elig.authorized_services : []
        const outboundServices = services
          .filter((s) => s.direction === 'outbound')
          .map((s) => ({ ...s, targetTimeLabel: formatTime(s.target_time) }))
        const returnServices = services
          .filter((s) => s.direction === 'return')
          .map((s) => ({ ...s, targetTimeLabel: formatTime(s.target_time) }))

        const response = elig.response || null
        const requests = response
          ? changeRequests.value.filter((cr) => cr.response === response.id)
          : []

        const myParticipations = participations.value
          .filter((p) => p.eligibility === elig.id)
          .map((p) => {
            const travel = travelsMap.get(p.travel) || null
            return {
              ...p,
              travelData: travel,
              isPublished: Boolean(travel?.published_revision != null),
              isPublicationCurrent: Boolean(travel?.publication_current),
            }
          })

        return {
          ...elig,
          dayData: day,
          outboundServices,
          returnServices,
          response,
          requests,
          participations: myParticipations,
        }
      })
      .toSorted((a, b) => String(a.dayData.date).localeCompare(String(b.dayData.date)))
  })

  const selectedEligibility = computed(() => {
    if (!enrichedEligibilities.value.length) return null
    return (
      enrichedEligibilities.value.find((e) => e.id === selectedEligibilityId.value) ||
      enrichedEligibilities.value[0]
    )
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
    const found = enrichedEligibilities.value.find((e) => e.id === id)
    syncDraftWithSelection(found)
    error.value = ''
    notice.value = ''
  }

  async function refresh() {
    if (!scope.current() || busy.value) return false
    loading.value = true
    error.value = ''
    try {
      const [daysList, eligList, reqList, partList, travelList] = await Promise.all([
        listServiceDays({}, { signal: scope.signal }),
        listEligibilities({}, { signal: scope.signal }),
        listChangeRequests({}, { signal: scope.signal }),
        listTravelParticipations({}, { signal: scope.signal }),
        listTravels({}, { signal: scope.signal }),
      ])
      if (!scope.current()) return false
      days.value = daysList
      eligibilities.value = eligList
      changeRequests.value = reqList
      participations.value = partList
      travels.value = travelList

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

  async function sendNormalAnswer() {
    const elig = selectedEligibility.value
    if (!scope.current() || busy.value || !elig) return false
    busy.value = true
    error.value = ''
    notice.value = ''
    try {
      const expectedRevision = elig.response?.revision ?? 0
      await answerEligibility(
        elig.id,
        {
          outbound_service_id: outboundChoice.value === '' ? null : Number(outboundChoice.value),
          return_service_id: returnChoice.value === '' ? null : Number(returnChoice.value),
          expected_revision: expectedRevision,
        },
        { signal: scope.signal },
      )
      if (!scope.current()) return false
      notice.value =
        'Intenção de ida e retorno registrada na janela normal. Isso não equivale a alocação nem a viagem publicada.'
      await refresh()
      return true
    } catch (cause) {
      if (scope.current()) {
        error.value = sessionError(cause, formatApiError(cause, 'Não foi possível enviar a resposta diária.'))
      }
      return false
    } finally {
      if (scope.current()) busy.value = false
    }
  }

  async function sendExtensionRequest() {
    const elig = selectedEligibility.value
    if (!scope.current() || busy.value || !elig) return false
    if (!proposedServiceId.value) {
      error.value = 'Selecione um serviço autorizado para solicitar inclusão ou troca na prorrogação.'
      return false
    }
    busy.value = true
    error.value = ''
    notice.value = ''
    try {
      const expectedRevision = elig.response?.revision ?? 0
      await requestEligibilityChange(
        elig.id,
        {
          leg: changeLeg.value,
          proposed_service_id: Number(proposedServiceId.value),
          expected_revision: expectedRevision,
        },
        { signal: scope.signal },
      )
      if (!scope.current()) return false
      notice.value =
        'Pedido enviado na prorrogação. Sua escolha e alocação anteriores permanecem vigentes até a aprovação, o cálculo e a aplicação pela empresa.'
      proposedServiceId.value = ''
      await refresh()
      return true
    } catch (cause) {
      if (scope.current()) {
        error.value = sessionError(cause, formatApiError(cause, 'Não foi possível solicitar alteração na prorrogação.'))
      }
      return false
    } finally {
      if (scope.current()) busy.value = false
    }
  }

  async function cancelPendingRequest(requestId) {
    if (!scope.current() || busy.value) return false
    busy.value = true
    error.value = ''
    notice.value = ''
    try {
      await withdrawChangeRequest(requestId, { signal: scope.signal })
      if (!scope.current()) return false
      notice.value = 'Pedido de alteração na prorrogação retirado.'
      await refresh()
      return true
    } catch (cause) {
      if (scope.current()) {
        error.value = sessionError(cause, formatApiError(cause, 'Não foi possível retirar o pedido de alteração.'))
      }
      return false
    } finally {
      if (scope.current()) busy.value = false
    }
  }

  async function withdrawLeg(leg) {
    const elig = selectedEligibility.value
    if (!scope.current() || busy.value || !elig) return false
    busy.value = true
    error.value = ''
    notice.value = ''
    try {
      await withdrawEligibilityLeg(elig.id, leg, { signal: scope.signal })
      if (!scope.current()) return false
      notice.value = `Desistência do trecho de ${leg === 'outbound' ? 'ida' : 'retorno'} registrada antes do embarque.`
      await refresh()
      return true
    } catch (cause) {
      if (scope.current()) {
        error.value = sessionError(cause, formatApiError(cause, 'Não foi possível registrar a desistência do trecho.'))
      }
      return false
    } finally {
      if (scope.current()) busy.value = false
    }
  }

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
    sendNormalAnswer,
    sendExtensionRequest,
    cancelPendingRequest,
    withdrawLeg,
  }
}
