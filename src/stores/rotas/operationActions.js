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
  decideChangeRequest,
  applyChangeRequest,
  listTravels,
  calculateTravel,
  publishTravel,
  cancelTravel,
  assignTravelVehicle,
  inviteTravelDriver,
  listTravelParticipations,
  listRouteSnapshots,
  listOptimizationJobs,
} from '@/api/transport'
import { runStoreRequest } from './habitualActions'

export const operationActions = {
  async consultarAgendaAutomatica(groupId, { signal } = {}) {
    try {
      return await getAutomationStatus(groupId, { signal })
    } catch (error) {
      if (error.response?.status === 404) return null
      if (!signal?.aborted) {
        this.error = sessionError(error, formatApiError(error, 'Erro ao consultar agenda automática.'))
      }
      return null
    }
  },

  salvarAgendaAutomatica(groupId, input, { signal } = {}) {
    return runStoreRequest(this, signal, 'Erro ao configurar agenda automática.', () =>
      saveAutomationSchedule(groupId, input, { signal }),
    )
  },

  gerarHorizonte(groupId, input, { signal } = {}) {
    return runStoreRequest(this, signal, 'Erro ao gerar atendimentos por data.', () =>
      generateGroupHorizon(groupId, input, { signal }),
    )
  },

  cancelarDataGrupo(groupId, { date, reason }, { signal } = {}) {
    return runStoreRequest(this, signal, 'Erro ao cancelar data do grupo.', () =>
      cancelGroupDate(groupId, { date, reason }, { signal }),
    )
  },

  async fetchOperacaoDatada(params = {}, { signal } = {}) {
    this.dayLoading = true
    this.error = null
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

      this.diasAtendimento = days
      this.viagensDia = travels
      this.elegibilidadesDia = eligibilities
      this.pedidosAlteracao = requests
      this.participacoesViagem = participations
      this.snapshotsViagem = snapshots
      this.jobsCalculo = jobs
      return true
    } catch (error) {
      if (!signal?.aborted) {
        this.error = sessionError(error, formatApiError(error, 'Erro ao carregar operação por data.'))
      }
      return false
    } finally {
      if (!signal?.aborted) this.dayLoading = false
    }
  },

  fecharDiaAtendimento(dayId, { signal } = {}) {
    return runStoreRequest(this, signal, 'Não foi possível preparar alocações do atendimento.', () =>
      closeServiceDay(dayId, { signal }),
    )
  },

  revisarDiaAtendimento(dayId, expectedRevision, { signal } = {}) {
    return runStoreRequest(this, signal, 'Não foi possível revisar o atendimento.', () =>
      reviseServiceDay(dayId, expectedRevision, { signal }),
    )
  },

  cancelarDiaAtendimento(dayId, reason, { signal } = {}) {
    return runStoreRequest(this, signal, 'Não foi possível cancelar o atendimento.', () =>
      cancelServiceDay(dayId, reason, { signal }),
    )
  },

  calcularViagem(travelId, expectedRevision, { signal } = {}) {
    return runStoreRequest(this, signal, 'Não foi possível enfileirar o cálculo do percurso.', () =>
      calculateTravel(travelId, expectedRevision, { signal }),
    )
  },

  publicarViagem(travelId, expectedRevision, { signal } = {}) {
    return runStoreRequest(this, signal, 'Não foi possível publicar a viagem.', () =>
      publishTravel(travelId, expectedRevision, { signal }),
    )
  },

  cancelarViagem(travelId, { signal } = {}) {
    return runStoreRequest(this, signal, 'Não foi possível cancelar a viagem.', () =>
      cancelTravel(travelId, { signal }),
    )
  },

  designarVeiculoViagem(travelId, vehicleId, { signal } = {}) {
    return runStoreRequest(this, signal, 'Não foi possível substituir o veículo da viagem.', () =>
      assignTravelVehicle(travelId, vehicleId, { signal }),
    )
  },

  convidarMotoristaViagem(travelId, { driverMembershipId, expiresAt }, { signal } = {}) {
    return runStoreRequest(this, signal, 'Não foi possível enviar convite ao motorista.', () =>
      inviteTravelDriver(
        travelId,
        { driver_membership_id: driverMembershipId, expires_at: expiresAt },
        { signal },
      ),
    )
  },

  decidirPedidoAlteracao(requestId, action, reason = '', { signal } = {}) {
    return runStoreRequest(this, signal, 'Não foi possível decidir o pedido na prorrogação.', () =>
      decideChangeRequest(requestId, action, reason, { signal }),
    )
  },

  aplicarPedidoAlteracao(requestId, { signal } = {}) {
    return runStoreRequest(this, signal, 'Não foi possível aplicar o pedido de alteração.', () =>
      applyChangeRequest(requestId, { signal }),
    )
  },
}
