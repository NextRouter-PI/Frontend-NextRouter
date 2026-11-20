import { defineStore } from 'pinia'
import { watch } from 'vue'
import api from '@/api/client'
import { state as authState } from '@/stores/state'
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
  createRecurringService,
  updateRecurringService,
  saveServiceStops,
  listGroupMemberships,
  assignPassengerGroup,
  authorizeGroupMemberServices,
  listVehicles,
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

import { POINT_TYPES, WEEKDAY_OPTIONS } from '@/constants'
import { formatHour, formatWeekdays } from '@/utils/formatters'

export { WEEKDAY_OPTIONS, formatWeekdays }

function asList(data) {
  return Array.isArray(data) ? data : data?.results || []
}

export const useRotasStore = defineStore('rotas', {
  state: () => ({
    grupos: [],
    pontosOperacionais: [],
    todosVeiculos: [],
    vinculosAtivos: [],
    participacoesGrupo: [],
    politicas: [],
    servicos: [],
    diasAtendimento: [],
    elegibilidadesDia: [],
    pedidosAlteracao: [],
    viagensDia: [],
    participacoesViagem: [],
    snapshotsViagem: [],
    jobsCalculo: [],
    loading: false,
    dayLoading: false,
    error: null,
  }),
  getters: {
    pontosDestino: (state) => state.pontosOperacionais.filter((p) => p.point_type === POINT_TYPES.DESTINATION),
    garagens: (state) => state.pontosOperacionais.filter((p) => p.point_type === POINT_TYPES.GARAGE),
  },
  actions: {
    $reset() {
      this.grupos = []
      this.pontosOperacionais = []
      this.todosVeiculos = []
      this.vinculosAtivos = []
      this.participacoesGrupo = []
      this.politicas = []
      this.servicos = []
      this.diasAtendimento = []
      this.elegibilidadesDia = []
      this.pedidosAlteracao = []
      this.viagensDia = []
      this.participacoesViagem = []
      this.snapshotsViagem = []
      this.jobsCalculo = []
      this.loading = false
      this.dayLoading = false
      this.error = null
    },

    async fetchRotas({ signal } = {}) {
      this.loading = true
      this.error = null
      try {
        const [groups, points, policies, services, vehicles, membershipsRes, groupMemberships, habitualRoutes] = await Promise.all([
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
          const policy = policiesByGroup.get(group.id) || null
          const groupServices = services
            .filter((s) => s.route_group === group.id)
            .map((s) => ({
              ...s,
              targetTimeLabel: formatHour(s.target_time),
              weekdaysLabel: formatWeekdays(s.weekdays),
              vehiclePlate: s.vehicle ? vehiclesMap.get(s.vehicle)?.plate || `Veículo #${s.vehicle}` : 'Sem veículo habitual',
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
            policy,
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

    async criarGrupo({ name, destinationId }, { signal } = {}) {
      this.error = null
      try {
        return await createRouteGroup({ name, destination_id: destinationId }, { signal })
      } catch (error) {
        if (!signal?.aborted) {
          this.error = sessionError(error, formatApiError(error, 'Erro ao cadastrar grupo de atendimento.'))
        }
        return null
      }
    },

    async atualizarGrupo(id, { name, destinationId }, { signal } = {}) {
      this.error = null
      try {
        return await updateRouteGroup(id, { name, destination_id: destinationId }, { signal })
      } catch (error) {
        if (!signal?.aborted) {
          this.error = sessionError(error, formatApiError(error, 'Erro ao atualizar grupo de atendimento.'))
        }
        return null
      }
    },

    async carregarPassageirosSemRota(groupId, { signal } = {}) {
      try {
        return await listUnassignedGroupPassengers(groupId, { signal })
      } catch (error) {
        if (!signal?.aborted) {
          this.error = sessionError(error, formatApiError(error, 'Erro ao carregar passageiros disponíveis no mapa.'))
        }
        return []
      }
    },

    async salvarRotaHabitual(groupId, payload, routeId = null, { signal } = {}) {
      this.error = null
      try {
        if (routeId) {
          return await updateHabitualRoute(routeId, payload, { signal })
        }
        return await createHabitualRoute({ ...payload, route_group_id: groupId }, { signal })
      } catch (error) {
        if (!signal?.aborted) {
          this.error = sessionError(error, formatApiError(error, 'Erro ao salvar rota do grupo.'))
        }
        return null
      }
    },

    async salvarPolitica(groupId, policyInput, { signal } = {}) {
      this.error = null
      try {
        return await saveResponsePolicy(groupId, policyInput, { signal })
      } catch (error) {
        if (!signal?.aborted) {
          this.error = sessionError(error, formatApiError(error, 'Erro ao configurar política de respostas.'))
        }
        return null
      }
    },

    async criarServico(serviceInput, { signal } = {}) {
      this.error = null
      try {
        return await createRecurringService(serviceInput, { signal })
      } catch (error) {
        if (!signal?.aborted) {
          this.error = sessionError(error, formatApiError(error, 'Erro ao cadastrar serviço habitual.'))
        }
        return null
      }
    },

    async atualizarServico(serviceId, serviceInput, { signal } = {}) {
      this.error = null
      try {
        return await updateRecurringService(serviceId, serviceInput, { signal })
      } catch (error) {
        if (!signal?.aborted) {
          this.error = sessionError(error, formatApiError(error, 'Erro ao atualizar serviço habitual.'))
        }
        return null
      }
    },

    async salvarParadasServico(serviceId, pointIds, { signal } = {}) {
      this.error = null
      try {
        return await saveServiceStops(serviceId, pointIds, { signal })
      } catch (error) {
        if (!signal?.aborted) {
          this.error = sessionError(error, formatApiError(error, 'Erro ao configurar paradas habituais.'))
        }
        return null
      }
    },

    async atribuirPassageiroGrupo(membershipId, { routeGroupId, transportPointId }, { signal } = {}) {
      this.error = null
      try {
        return await assignPassengerGroup(
          membershipId,
          { route_group_id: routeGroupId, transport_point_id: transportPointId },
          { signal },
        )
      } catch (error) {
        if (!signal?.aborted) {
          this.error = sessionError(error, formatApiError(error, 'Erro ao atribuir passageiro ao grupo e ponto.'))
        }
        return null
      }
    },

    async autorizarServicosPassageiro(groupMembershipId, { serviceIds, habitualOutboundId }, { signal } = {}) {
      this.error = null
      try {
        return await authorizeGroupMemberServices(
          groupMembershipId,
          { service_ids: serviceIds, habitual_outbound_id: habitualOutboundId },
          { signal },
        )
      } catch (error) {
        if (!signal?.aborted) {
          this.error = sessionError(error, formatApiError(error, 'Erro ao autorizar serviços do passageiro.'))
        }
        return null
      }
    },

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

    async salvarAgendaAutomatica(groupId, input, { signal } = {}) {
      this.error = null
      try {
        return await saveAutomationSchedule(groupId, input, { signal })
      } catch (error) {
        if (!signal?.aborted) {
          this.error = sessionError(error, formatApiError(error, 'Erro ao configurar agenda automática.'))
        }
        return null
      }
    },

    async gerarHorizonte(groupId, input, { signal } = {}) {
      this.error = null
      try {
        return await generateGroupHorizon(groupId, input, { signal })
      } catch (error) {
        if (!signal?.aborted) {
          this.error = sessionError(error, formatApiError(error, 'Erro ao gerar atendimentos por data.'))
        }
        return null
      }
    },

    async cancelarDataGrupo(groupId, { date, reason }, { signal } = {}) {
      this.error = null
      try {
        return await cancelGroupDate(groupId, { date, reason }, { signal })
      } catch (error) {
        if (!signal?.aborted) {
          this.error = sessionError(error, formatApiError(error, 'Erro ao cancelar data do grupo.'))
        }
        return null
      }
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

    async fecharDiaAtendimento(dayId, { signal } = {}) {
      this.error = null
      try {
        return await closeServiceDay(dayId, { signal })
      } catch (error) {
        if (!signal?.aborted) {
          this.error = sessionError(error, formatApiError(error, 'Não foi possível preparar alocações do atendimento.'))
        }
        return null
      }
    },

    async revisarDiaAtendimento(dayId, expectedRevision, { signal } = {}) {
      this.error = null
      try {
        return await reviseServiceDay(dayId, expectedRevision, { signal })
      } catch (error) {
        if (!signal?.aborted) {
          this.error = sessionError(error, formatApiError(error, 'Não foi possível revisar o atendimento.'))
        }
        return null
      }
    },

    async cancelarDiaAtendimento(dayId, reason, { signal } = {}) {
      this.error = null
      try {
        return await cancelServiceDay(dayId, reason, { signal })
      } catch (error) {
        if (!signal?.aborted) {
          this.error = sessionError(error, formatApiError(error, 'Não foi possível cancelar o atendimento.'))
        }
        return null
      }
    },

    async calcularViagem(travelId, expectedRevision, { signal } = {}) {
      this.error = null
      try {
        return await calculateTravel(travelId, expectedRevision, { signal })
      } catch (error) {
        if (!signal?.aborted) {
          this.error = sessionError(error, formatApiError(error, 'Não foi possível enfileirar o cálculo do percurso.'))
        }
        return null
      }
    },

    async publicarViagem(travelId, expectedRevision, { signal } = {}) {
      this.error = null
      try {
        return await publishTravel(travelId, expectedRevision, { signal })
      } catch (error) {
        if (!signal?.aborted) {
          this.error = sessionError(error, formatApiError(error, 'Não foi possível publicar a viagem.'))
        }
        return null
      }
    },

    async cancelarViagem(travelId, { signal } = {}) {
      this.error = null
      try {
        return await cancelTravel(travelId, { signal })
      } catch (error) {
        if (!signal?.aborted) {
          this.error = sessionError(error, formatApiError(error, 'Não foi possível cancelar a viagem.'))
        }
        return null
      }
    },

    async designarVeiculoViagem(travelId, vehicleId, { signal } = {}) {
      this.error = null
      try {
        return await assignTravelVehicle(travelId, vehicleId, { signal })
      } catch (error) {
        if (!signal?.aborted) {
          this.error = sessionError(error, formatApiError(error, 'Não foi possível substituir o veículo da viagem.'))
        }
        return null
      }
    },

    async convidarMotoristaViagem(travelId, { driverMembershipId, expiresAt }, { signal } = {}) {
      this.error = null
      try {
        return await inviteTravelDriver(
          travelId,
          { driver_membership_id: driverMembershipId, expires_at: expiresAt },
          { signal },
        )
      } catch (error) {
        if (!signal?.aborted) {
          this.error = sessionError(error, formatApiError(error, 'Não foi possível enviar convite ao motorista.'))
        }
        return null
      }
    },

    async decidirPedidoAlteracao(requestId, action, reason = '', { signal } = {}) {
      this.error = null
      try {
        return await decideChangeRequest(requestId, action, reason, { signal })
      } catch (error) {
        if (!signal?.aborted) {
          this.error = sessionError(error, formatApiError(error, 'Não foi possível decidir o pedido na prorrogação.'))
        }
        return null
      }
    },

    async aplicarPedidoAlteracao(requestId, { signal } = {}) {
      this.error = null
      try {
        return await applyChangeRequest(requestId, { signal })
      } catch (error) {
        if (!signal?.aborted) {
          this.error = sessionError(error, formatApiError(error, 'Não foi possível aplicar o pedido de alteração.'))
        }
        return null
      }
    },
  },
})

watch(() => `${authState.logged}:${authState.user?.id || ''}`, () => {
  try {
    useRotasStore().$reset()
  } catch {
    // Store ainda não inicializada pelo Pinia
  }
}, { flush: 'sync' })
