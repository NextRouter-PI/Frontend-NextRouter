import {
  createRecurringService,
  updateRecurringService,
  saveServiceStops,
  assignPassengerGroup,
  authorizeGroupMemberServices,
} from '@/api/transport'
import { runStoreRequest } from './requestHelper'

export function createServiceActions(storeState) {
  return {
    criarServico(serviceInput, { signal } = {}) {
      return runStoreRequest(storeState, signal, 'Erro ao cadastrar serviço habitual.', () =>
        createRecurringService(serviceInput, { signal }),
      )
    },

    atualizarServico(serviceId, serviceInput, { signal } = {}) {
      return runStoreRequest(storeState, signal, 'Erro ao atualizar serviço habitual.', () =>
        updateRecurringService(serviceId, serviceInput, { signal }),
      )
    },

    salvarParadasServico(serviceId, pointIds, { signal } = {}) {
      return runStoreRequest(storeState, signal, 'Erro ao configurar paradas habituais.', () =>
        saveServiceStops(serviceId, pointIds, { signal }),
      )
    },

    atribuirPassageiroGrupo(membershipId, { routeGroupId, transportPointId }, { signal } = {}) {
      return runStoreRequest(storeState, signal, 'Erro ao atribuir passageiro ao grupo e ponto.', () =>
        assignPassengerGroup(
          membershipId,
          { route_group_id: routeGroupId, transport_point_id: transportPointId },
          { signal },
        ),
      )
    },

    autorizarServicosPassageiro(groupMembershipId, { serviceIds, habitualOutboundId }, { signal } = {}) {
      return runStoreRequest(storeState, signal, 'Erro ao autorizar serviços do passageiro.', () =>
        authorizeGroupMemberServices(
          groupMembershipId,
          { service_ids: serviceIds, habitual_outbound_id: habitualOutboundId },
          { signal },
        ),
      )
    },
  }
}
