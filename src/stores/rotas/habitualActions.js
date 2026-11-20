import api from '@/api/client'
import { sessionError } from '@/stores/session'
import { formatApiError } from '@/utils/apiErrors'
import { formatHour, formatWeekdays } from '@/utils/formatters'
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
  createRecurringService,
  updateRecurringService,
  saveServiceStops,
  listGroupMemberships,
  assignPassengerGroup,
  authorizeGroupMemberServices,
  listVehicles,
} from '@/api/transport'

function asList(data) {
  return Array.isArray(data) ? data : data?.results || []
}

export async function runStoreRequest(store, signal, fallback, fn, fallbackResult = null) {
  store.error = null
  try {
    return await fn()
  } catch (error) {
    if (!signal?.aborted) {
      store.error = sessionError(error, formatApiError(error, fallback))
    }
    return fallbackResult
  }
}

export const habitualActions = {
  async fetchRotas({ signal } = {}) {
    this.loading = true
    this.error = null
    try {
      const [groups, points, policies, services, vehicles, membershipsRes, groupMemberships, habitualRoutes] =
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

      this.pontosOperacionais = points
      this.todosVeiculos = vehicles
      this.vinculosAtivos = membershipsRes
      this.participacoesGrupo = groupMemberships
      this.politicas = policies
      this.servicos = services

      const pointsMap = new Map(points.map((p) => [p.id, p]))
      const vehiclesMap = new Map(vehicles.map((v) => [v.id, v]))
      const membershipsMap = new Map(membershipsRes.map((m) => [m.id, m]))
      const policiesByGroup = new Map(policies.map((p) => [p.route_group, p]))

      this.grupos = groups.map((group) => {
        const dest = pointsMap.get(group.destination)
        const groupServices = services
          .filter((s) => s.route_group === group.id)
          .map((s) => ({
            ...s,
            targetTimeLabel: formatHour(s.target_time),
            weekdaysLabel: formatWeekdays(s.weekdays),
            vehiclePlate: s.vehicle
              ? vehiclesMap.get(s.vehicle)?.plate || `Veículo #${s.vehicle}`
              : 'Sem veículo habitual',
            driverName: s.driver_membership
              ? membershipsMap.get(s.driver_membership)?.applicant_name || `Vínculo #${s.driver_membership}`
              : 'Sem motorista habitual',
            originName: s.origin ? pointsMap.get(s.origin)?.name || `Ponto #${s.origin}` : 'Garagem do veículo',
            destinationName: s.destination
              ? pointsMap.get(s.destination)?.name || `Ponto #${s.destination}`
              : dest?.name || `Ponto #${group.destination}`,
          }))

        const activeMembers = groupMemberships
          .filter((gm) => gm.route_group === group.id && !gm.ended_at)
          .map((gm) => {
            const member = membershipsMap.get(gm.membership)
            const point = gm.transport_point ? pointsMap.get(gm.transport_point) : null
            return {
              ...gm,
              applicantName: member?.applicant_name || `Vínculo #${gm.membership}`,
              passengerId: member?.passenger || null,
              pointName: point ? `${point.name} (${point.city}/${point.state})` : 'Sem ponto operacional',
            }
          })

        const groupRoutes = habitualRoutes.filter((r) => r.route_group === group.id)
        return {
          id: group.id,
          company: group.company,
          name: group.name,
          destinationId: group.destination,
          destinationName: dest ? `${dest.name} (${dest.city}/${dest.state})` : `Ponto #${group.destination}`,
          destinationCoords:
            dest && Number.isFinite(Number(dest.latitude)) && Number.isFinite(Number(dest.longitude))
              ? [Number(dest.latitude), Number(dest.longitude)]
              : null,
          policy: policiesByGroup.get(group.id) || null,
          services: groupServices,
          members: activeMembers,
          habitualRoutes: groupRoutes.filter((r) => r.kind === 'habitual'),
          sharedRoutes: groupRoutes.filter((r) => r.kind === 'shared'),
        }
      })
      return true
    } catch (error) {
      if (!signal?.aborted) {
        this.error = sessionError(error, formatApiError(error, 'Erro ao carregar configuração de grupos e serviços.'))
      }
      return false
    } finally {
      if (!signal?.aborted) this.loading = false
    }
  },

  criarGrupo({ name, destinationId }, { signal } = {}) {
    return runStoreRequest(this, signal, 'Erro ao cadastrar grupo de atendimento.', () =>
      createRouteGroup({ name, destination_id: destinationId }, { signal }),
    )
  },

  atualizarGrupo(id, { name, destinationId }, { signal } = {}) {
    return runStoreRequest(this, signal, 'Erro ao atualizar grupo de atendimento.', () =>
      updateRouteGroup(id, { name, destination_id: destinationId }, { signal }),
    )
  },

  carregarPassageirosSemRota(groupId, { signal } = {}) {
    return runStoreRequest(
      this,
      signal,
      'Erro ao carregar passageiros disponíveis no mapa.',
      () => listUnassignedGroupPassengers(groupId, { signal }),
      [],
    )
  },

  salvarRotaHabitual(groupId, payload, routeId = null, { signal } = {}) {
    return runStoreRequest(this, signal, 'Erro ao salvar rota do grupo.', () =>
      routeId
        ? updateHabitualRoute(routeId, payload, { signal })
        : createHabitualRoute({ ...payload, route_group_id: groupId }, { signal }),
    )
  },

  salvarPolitica(groupId, policyInput, { signal } = {}) {
    return runStoreRequest(this, signal, 'Erro ao configurar política de respostas.', () =>
      saveResponsePolicy(groupId, policyInput, { signal }),
    )
  },

  criarServico(serviceInput, { signal } = {}) {
    return runStoreRequest(this, signal, 'Erro ao cadastrar serviço habitual.', () =>
      createRecurringService(serviceInput, { signal }),
    )
  },

  atualizarServico(serviceId, serviceInput, { signal } = {}) {
    return runStoreRequest(this, signal, 'Erro ao atualizar serviço habitual.', () =>
      updateRecurringService(serviceId, serviceInput, { signal }),
    )
  },

  salvarParadasServico(serviceId, pointIds, { signal } = {}) {
    return runStoreRequest(this, signal, 'Erro ao configurar paradas habituais.', () =>
      saveServiceStops(serviceId, pointIds, { signal }),
    )
  },

  atribuirPassageiroGrupo(membershipId, { routeGroupId, transportPointId }, { signal } = {}) {
    return runStoreRequest(this, signal, 'Erro ao atribuir passageiro ao grupo e ponto.', () =>
      assignPassengerGroup(
        membershipId,
        { route_group_id: routeGroupId, transport_point_id: transportPointId },
        { signal },
      ),
    )
  },

  autorizarServicosPassageiro(groupMembershipId, { serviceIds, habitualOutboundId }, { signal } = {}) {
    return runStoreRequest(this, signal, 'Erro ao autorizar serviços do passageiro.', () =>
      authorizeGroupMemberServices(
        groupMembershipId,
        { service_ids: serviceIds, habitual_outbound_id: habitualOutboundId },
        { signal },
      ),
    )
  },
}
