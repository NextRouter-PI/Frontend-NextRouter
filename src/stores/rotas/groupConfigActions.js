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
import { createFreshnessCache } from './cacheHelper'

function asList(data) {
  return Array.isArray(data) ? data : data?.results || []
}

export function createGroupConfigActions(storeState) {
  const cache = createFreshnessCache()

  function invalidateRotasCache() {
    cache.reset()
  }

  function fetchRotas({ signal, force = false } = {}) {
    if (!force && cache.isFresh(storeState.grupos.length)) {
      return Promise.resolve(true)
    }
    return cache.dedupe(force, async () => {
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
        cache.markFresh()
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
    })
  }

  async function runAndInvalidate(fallbackMsg, action, signal) {
    const res = await runStoreRequest(storeState, signal, fallbackMsg, action)
    if (res) invalidateRotasCache()
    return res
  }

  return {
    invalidateRotasCache,
    fetchRotas,

    criarGrupo({ name, destinationId }, { signal } = {}) {
      return runAndInvalidate(
        'Erro ao cadastrar grupo de atendimento.',
        () => createRouteGroup({ name, destination_id: destinationId }, { signal }),
        signal,
      )
    },

    atualizarGrupo(id, { name, destinationId }, { signal } = {}) {
      return runAndInvalidate(
        'Erro ao atualizar grupo de atendimento.',
        () => updateRouteGroup(id, { name, destination_id: destinationId }, { signal }),
        signal,
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
      return runAndInvalidate(
        'Erro ao salvar rota do grupo.',
        () =>
          routeId
            ? updateHabitualRoute(routeId, payload, { signal })
            : createHabitualRoute({ ...payload, route_group_id: groupId }, { signal }),
        signal,
      )
    },

    salvarPolitica(groupId, policyInput, { signal } = {}) {
      return runAndInvalidate(
        'Erro ao configurar política de respostas.',
        () => saveResponsePolicy(groupId, policyInput, { signal }),
        signal,
      )
    },
  }
}
