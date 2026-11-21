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

/**
 * Carrega em paralelo todos os recursos do questionário de presença do passageiro.
 */
export async function fetchQuestionnaireSnapshot(signal) {
  const [days, eligibilities, changeRequests, participations, travels] = await Promise.all([
    listServiceDays({}, { signal }),
    listEligibilities({}, { signal }),
    listChangeRequests({}, { signal }),
    listTravelParticipations({}, { signal }),
    listTravels({}, { signal }),
  ])
  return { days, eligibilities, changeRequests, participations, travels }
}

export function submitNormalAnswerRequest(eligibilityId, { outboundChoice, returnChoice, expectedRevision, signal }) {
  return answerEligibility(
    eligibilityId,
    {
      outbound_service_id: outboundChoice === '' ? null : Number(outboundChoice),
      return_service_id: returnChoice === '' ? null : Number(returnChoice),
      expected_revision: expectedRevision,
    },
    { signal },
  )
}

export function submitExtensionChangeRequest(eligibilityId, { leg, proposedServiceId, expectedRevision, signal }) {
  return requestEligibilityChange(
    eligibilityId,
    {
      leg,
      proposed_service_id: Number(proposedServiceId),
      expected_revision: expectedRevision,
    },
    { signal },
  )
}

export function submitCancelPendingRequest(requestId, signal) {
  return withdrawChangeRequest(requestId, { signal })
}

export function submitWithdrawLeg(eligibilityId, leg, signal) {
  return withdrawEligibilityLeg(eligibilityId, leg, { signal })
}
