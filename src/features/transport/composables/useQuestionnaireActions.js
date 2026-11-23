import {
  submitCancelPendingRequest,
  submitExtensionChangeRequest,
  submitNormalAnswerRequest,
  submitWithdrawLeg,
} from '@/features/transport/services/questionnaireService'

/**
 * Encapsula as ações mutáveis do questionário do passageiro (janela normal, prorrogação e desistência).
 */
export function createQuestionnaireActions({
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
}) {
  async function runAndReload(operation, { successMessage, fallbackError, beforeReload } = {}) {
    const { ok } = await run(operation, {
      successMessage,
      fallbackError,
      onSuccess: async () => {
        beforeReload?.()
        await refresh({ force: true })
      },
    })
    return ok
  }

  function sendNormalAnswer() {
    const elig = selectedEligibility.value
    if (!elig) return Promise.resolve(false)
    return runAndReload(
      (signal) =>
        submitNormalAnswerRequest(elig.id, {
          outboundChoice: outboundChoice.value,
          returnChoice: returnChoice.value,
          expectedRevision: elig.response?.revision ?? 0,
          signal,
        }),
      {
        successMessage: 'Intenção de ida e retorno registrada na janela normal. Isso não equivale a alocação nem a viagem publicada.',
        fallbackError: 'Não foi possível enviar a resposta diária.',
      },
    )
  }

  function sendExtensionRequest() {
    const elig = selectedEligibility.value
    if (!elig || !scope.current() || busy.value) return Promise.resolve(false)
    if (!proposedServiceId.value) {
      error.value = 'Selecione um serviço autorizado para solicitar inclusão ou troca na prorrogação.'
      return Promise.resolve(false)
    }
    return runAndReload(
      (signal) =>
        submitExtensionChangeRequest(elig.id, {
          leg: changeLeg.value,
          proposedServiceId: proposedServiceId.value,
          expectedRevision: elig.response?.revision ?? 0,
          signal,
        }),
      {
        successMessage: 'Pedido enviado na prorrogação. Sua escolha e alocação anteriores permanecem vigentes até a aprovação, o cálculo e a aplicação pela empresa.',
        fallbackError: 'Não foi possível solicitar alteração na prorrogação.',
        beforeReload: () => {
          proposedServiceId.value = ''
        },
      },
    )
  }

  const cancelPendingRequest = (requestId) =>
    runAndReload((signal) => submitCancelPendingRequest(requestId, signal), {
      successMessage: 'Pedido de alteração na prorrogação retirado.',
      fallbackError: 'Não foi possível retirar o pedido de alteração.',
    })

  function withdrawLeg(leg) {
    const elig = selectedEligibility.value
    if (!elig) return Promise.resolve(false)
    return runAndReload((signal) => submitWithdrawLeg(elig.id, leg, signal), {
      successMessage: `Desistência do trecho de ${leg === 'outbound' ? 'ida' : 'retorno'} registrada antes do embarque.`,
      fallbackError: 'Não foi possível registrar a desistência do trecho.',
    })
  }

  return {
    sendNormalAnswer,
    sendExtensionRequest,
    cancelPendingRequest,
    withdrawLeg,
  }
}
