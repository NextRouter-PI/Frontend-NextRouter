import api from '@/api/client'
import { sessionError } from '@/stores/session'
import { formatApiError } from '@/utils/apiErrors'
import {
  listRouteGroups,
  createRouteGroup,
  updateRouteGroup,
  listHabitualRoutes,
  createHabitualRoute,
  updateHabitualRoute,
  listUnassignedGroupPassengers,
  listOperationalPoints,
  listResponsePolicies,
  saveResponsePolicy,
  listRecurringServices,
  listGroupMemberships,
  listVehicles,
} from '@/api/transport'
import { buildEnrichedGroups } from '@/stores/mappers/routeGroupMapper'
import { runStoreRequest } from './requestHelper'

function asList(data) {
  return Array.isArray(data) ? data : data?.results || []
}

export function createGroupConfigActions(storeState) {
  return {
    async fetchRotas({ signal } = {}) {
      storeState.loading = true
      storeState.error = null
      try {
        const [groups, points, policies, services, vehicles, memberships, groupMemberships, habitualRoutes] =
          await Promise.all([
            listRouteGroups({}, { signal }),
            listOperationalPoints({}, { signal }),
            listResponsePolicies({}, { signal }),
            listRecurringServices({}, { signal }),
            listVehicles({}, { signal }),
            api.get('/memberships/', { params: { status: 'active' }, signal }).then((r) => asList(r.data)),
            listGroupMemberships({}, { signal }),
            listHabitualRoutes({}, { signal }).catch(() => []),
          ])
        if (signal?.aborted) return false

        storeState.pontosOperacionais = points
        storeState.todosVeiculos = vehicles
        storeState.vinculosAtivos = memberships
        storeState.participacoesGrupo = groupMemberships
        storeState.politicas = policies
        storeState.servicos = services
        storeState.grupos = buildEnrichedGroups({
          groups,
          points,
          services,
          vehicles,
          memberships,
          groupMemberships,
          policies,
          habitualRoutes,
        })
        return true
      } catch (error) {
        if (!signal?.aborted) {
          storeState.error = sessionError(
            error,
            formatApiError(error, 'Erro ao carregar configuração de grupos e serviços.'),
          )
        }
        return false
      } finally {
        if (!signal?.aborted) storeState.loading = false
      }
    },

    criarGrupo({ name, destinationId }, { signal } = {}) {
      return runStoreRequest(storeState, signal, 'Erro ao cadastrar grupo de atendimento.', () =>
        createRouteGroup({ name, destination_id: destinationId }, { signal }),
      )
    },

    atualizarGrupo(id, { name, destinationId }, { signal } = {}) {
      return runStoreRequest(storeState, signal, 'Erro ao atualizar grupo de atendimento.', () =>
        updateRouteGroup(id, { name, destination_id: destinationId }, { signal }),
      )
    },

    carregarPassageirosSemRota(groupId, { signal } = {}) {
      return runStoreRequest(
        storeState,
        signal,
        'Erro ao carregar passageiros disponíveis no mapa.',
        () => listUnassignedGroupPassengers(groupId, { signal }),
        [],
      )
    },

    salvarRotaHabitual(groupId, payload, routeId = null, { signal } = {}) {
      return runStoreRequest(storeState, signal, 'Erro ao salvar rota do grupo.', () =>
        routeId
          ? updateHabitualRoute(routeId, payload, { signal })
          : createHabitualRoute({ ...payload, route_group_id: groupId }, { signal }),
      )
    },

    salvarPolitica(groupId, policyInput, { signal } = {}) {
      return runStoreRequest(storeState, signal, 'Erro ao configurar política de respostas.', () =>
        saveResponsePolicy(groupId, policyInput, { signal }),
      )
    },
  }
}
