import { sessionError } from '@/stores/session'
import { formatApiError } from '@/utils/apiErrors'
import {
  generateGroupHorizon,
  cancelGroupDate,
  getAutomationStatus,
  saveAutomationSchedule,
  listServiceDays,
  closeServiceDay,
  reviseServiceDay,
  cancelServiceDay,
  listEligibilities,
  listChangeRequests,
  listTravels,
  listTravelParticipations,
  listRouteSnapshots,
  listOptimizationJobs,
} from '@/api/transport'
import { runStoreRequest } from './requestHelper'

export function createDayActions(storeState) {
  return {
    async consultarAgendaAutomatica(groupId, { signal } = {}) {
      try {
        return await getAutomationStatus(groupId, { signal })
      } catch (error) {
        if (error.response?.status === 404) return null
        if (!signal?.aborted) {
          storeState.error = sessionError(error, formatApiError(error, 'Erro ao consultar agenda automática.'))
        }
        return null
      }
    },

    salvarAgendaAutomatica(groupId, input, { signal } = {}) {
      return runStoreRequest(storeState, signal, 'Erro ao configurar agenda automática.', () =>
        saveAutomationSchedule(groupId, input, { signal }),
      )
    },

    gerarHorizonte(groupId, input, { signal } = {}) {
      return runStoreRequest(storeState, signal, 'Erro ao gerar atendimentos por data.', () =>
        generateGroupHorizon(groupId, input, { signal }),
      )
    },

    cancelarDataGrupo(groupId, { date, reason }, { signal } = {}) {
      return runStoreRequest(storeState, signal, 'Erro ao cancelar data do grupo.', () =>
        cancelGroupDate(groupId, { date, reason }, { signal }),
      )
    },

    async fetchOperacaoDatada(params = {}, { signal } = {}) {
      storeState.dayLoading = true
      storeState.error = null
      try {
        const dayParams = {}
        if (params.route_group) dayParams.route_group = params.route_group
        if (params.date) dayParams.date = params.date

        const [days, travels, eligibilities, requests, participations, snapshots, jobs] = await Promise.all([
          listServiceDays(dayParams, { signal }),
          listTravels(params.date ? { service_day__date: params.date } : {}, { signal }),
          listEligibilities(params.day ? { day: params.day } : {}, { signal }),
          listChangeRequests({}, { signal }),
          listTravelParticipations({}, { signal }),
          listRouteSnapshots({}, { signal }),
          listOptimizationJobs({}, { signal }),
        ])
        if (signal?.aborted) return false

        storeState.diasAtendimento = days
        storeState.viagensDia = travels
        storeState.elegibilidadesDia = eligibilities
        storeState.pedidosAlteracao = requests
        storeState.participacoesViagem = participations
        storeState.snapshotsViagem = snapshots
        storeState.jobsCalculo = jobs
        return true
      } catch (error) {
        if (!signal?.aborted) {
          storeState.error = sessionError(error, formatApiError(error, 'Erro ao carregar operação por data.'))
        }
        return false
      } finally {
        if (!signal?.aborted) storeState.dayLoading = false
      }
    },

    fecharDiaAtendimento(dayId, { signal } = {}) {
      return runStoreRequest(storeState, signal, 'Não foi possível preparar alocações do atendimento.', () =>
        closeServiceDay(dayId, { signal }),
      )
    },

    revisarDiaAtendimento(dayId, expectedRevision, { signal } = {}) {
      return runStoreRequest(storeState, signal, 'Não foi possível revisar o atendimento.', () =>
        reviseServiceDay(dayId, expectedRevision, { signal }),
      )
    },

    cancelarDiaAtendimento(dayId, reason, { signal } = {}) {
      return runStoreRequest(storeState, signal, 'Não foi possível cancelar o atendimento.', () =>
        cancelServiceDay(dayId, reason, { signal }),
      )
    },
  }
}
