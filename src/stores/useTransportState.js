import { reactive } from 'vue'
import api from '@/api/client'
import { state as authState } from '@/stores/state'

const state = reactive({
  passenger: null,
  driver: null,
  loading: false,
  error: null,
})

function toList(data) {
  return Array.isArray(data) ? data : data?.results || []
}

function formatTime(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function routeEndpoints(points) {
  const list = points || []
  const first = list[0]
  const last = list[list.length - 1]
  return {
    origem: first?.label || first?.address || '—',
    destino: last?.label || last?.address || '—',
  }
}

async function fetchOwnDriver() {
  const { data } = await api.get('/drivers/')
  const list = toList(data)
  return list.find((d) => d.user_data?.id === authState.user?.id) || null
}

async function fetchOwnPassenger() {
  const { data } = await api.get('/passengers/')
  const list = toList(data)
  return list.find((p) => p.user_data?.id === authState.user?.id) || null
}

async function fetchTravelPath(travel) {
  if (!travel?.path) return null
  const { data } = await api.get(`/paths/${travel.path}/`)
  return data
}

async function fetchVehicleForRouteGroup(routeGroupId) {
  if (!routeGroupId) return []
  const { data } = await api.get('/vehicles/', { params: { route_group: routeGroupId } })
  return toList(data)
}

async function fetchConfirmations(params) {
  const { data } = await api.get('/confirmations/', { params })
  return toList(data)
}

async function fetchRoutePassengers() {
  const { data } = await api.get('/passengers/')
  return toList(data)
}

function passengerAddress(userData) {
  if (!userData) return '—'
  const parts = [userData.street, userData.number, userData.neighborhood, userData.city, userData.state].filter(Boolean)
  return parts.length ? parts.join(', ') : '—'
}

async function loadDriverData() {
  state.loading = true
  state.error = null

  try {
    const driver = await fetchOwnDriver()
    if (!driver) {
      state.driver = null
      return
    }

    const { data: travelsData } = await api.get('/travels/', { params: { driver: driver.id } })
    const travels = toList(travelsData)
    const travel =
      travels.find((t) => t.status === 'in_progress') ||
      travels.find((t) => t.status === 'scheduled') ||
      travels[0] ||
      null

    let path = null
    let vehicles = []
    let confirmations = []
    let routePassengers = []

    ;[vehicles, routePassengers] = await Promise.all([
      fetchVehicleForRouteGroup(driver.route_group),
      fetchRoutePassengers(),
    ])

    if (travel) {
      ;[path, confirmations] = await Promise.all([
        fetchTravelPath(travel),
        fetchConfirmations({ travel: travel.id }),
      ])
    }

    const vehicle = vehicles.find((v) => v.driver === driver.id) || vehicles[0] || null
    const { origem, destino } = routeEndpoints(path?.points)

    state.driver = {
      veiculo: {
        modelo: vehicle?.model || '—',
        placa: vehicle?.plate || '—',
        capacidade: vehicle?.capacity || 0,
        cor: vehicle?.color || '',
        ano: vehicle?.year || null,
        ativo: vehicle?.status === 'active',
        caracteristicas: vehicle?.features || [],
      },
      rota: {
        ponto_origem: origem,
        ponto_destino: destino,
        horario_saida: formatTime(travel?.started_at),
        horario_chegada: formatTime(travel?.finished_at),
      },
      passageiros: routePassengers.map((passenger) => {
        const confirmation = confirmations.find((c) => c.user === passenger.user_data?.id)
        return {
          nome: passenger.user_data?.name || 'Passageiro',
          embarque: passengerAddress(passenger.user_data),
          desembarque: destino,
          confirmado: confirmation?.confirm ?? null,
        }
      }),
      passageirosNaRota: routePassengers.length,
      passageirosAtuais: confirmations.filter((c) => c.confirm).length,
      travelId: travel?.id || null,
      travelStatus: travel?.status || null,
    }
  } catch (error) {
    state.error = error.response?.data || error.message || 'Erro ao carregar dados do transporte'
    state.driver = null
  } finally {
    state.loading = false
  }
}

async function loadPassengerData() {
  state.loading = true
  state.error = null

  try {
    const passenger = await fetchOwnPassenger()

    if (!passenger?.route_group) {
      state.passenger = { attached: false }
      return
    }

    const [vehicles, routeGroup] = await Promise.all([
      fetchVehicleForRouteGroup(passenger.route_group),
      api.get(`/company-route-groups/${passenger.route_group}/`).then((r) => r.data),
    ])
    const vehicle = vehicles[0] || null

    let driverInfo = null
    if (vehicle?.driver) {
      const { data } = await api.get(`/drivers/${vehicle.driver}/`)
      driverInfo = data
    }

    const myConfirmations = await fetchConfirmations({ user: authState.user?.id })
    const confirmation = myConfirmations[0] || null
    const travelId = confirmation?.travel || null

    let travel = null
    let path = null
    let allConfirmations = []

    if (travelId) {
      const { data } = await api.get(`/travels/${travelId}/`)
      travel = data
      ;[path, allConfirmations] = await Promise.all([
        fetchTravelPath(travel),
        fetchConfirmations({ travel: travelId }),
      ])
    }

    const { origem, destino } = routeEndpoints(path?.points)

    state.passenger = {
      attached: true,
      veiculo: {
        modelo: vehicle?.model || '—',
        placa: vehicle?.plate || '—',
        capacidade: vehicle?.capacity || 0,
        cor: vehicle?.color || '',
        ano: vehicle?.year || null,
      },
      motorista: {
        nome: driverInfo?.user_data?.name || 'Motorista não atribuído',
        email: '',
        telefone: '',
        avaliacao: driverInfo?.average_rating || 0,
      },
      rota: {
        ponto_origem: origem,
        ponto_destino: destino,
        horario_saida: formatTime(travel?.started_at),
        horario_chegada: formatTime(travel?.finished_at),
      },
      passageirosNaRota: routeGroup?.passengers_count ?? 0,
      passageirosAtuais: allConfirmations.filter((c) => c.confirm).length,
      confirmado: confirmation?.confirm ?? false,
      travelId: travel?.id || null,
      travelStatus: travel?.status || null,
    }
  } catch (error) {
    state.error = error.response?.data || error.message || 'Erro ao carregar dados do transporte'
    state.passenger = null
  } finally {
    state.loading = false
  }
}

export function useTransportState() {
  return {
    state,
    loadPassengerData,
    loadDriverData,
  }
}
