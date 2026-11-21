import { computed, reactive, toRefs, watch } from 'vue'
import { defineStore } from 'pinia'
import { VEHICLE_STATUS_TO_API } from '@/constants'
import { useAuthStore } from '@/stores/useAuthStore'
import {
  listVehicles,
  createVehicle,
  updateVehicle,
  listOperationalPoints,
  createOperationalPoint,
  updateOperationalPoint,
} from '@/api/transport'
import { POINT_TYPES } from '@/constants'
import { runStoreRequest } from './rotas/requestHelper'
import { formatGarageLabel, mapVehicleFromApi, mapVehicleToApi } from './mappers/vehicleMapper'

export const useTransporteStore = defineStore('transporte', () => {
  const auth = useAuthStore()
  const state = reactive({
    veiculos: [],
    pontosOperacionais: [],
    loading: false,
    pointsLoading: false,
    error: null,
  })

  const garagens = computed(() =>
    state.pontosOperacionais.filter((p) => p.point_type === POINT_TYPES.GARAGE),
  )
  const pontosDestino = computed(() =>
    state.pontosOperacionais.filter((p) => p.point_type === POINT_TYPES.DESTINATION),
  )

  function $reset() {
    state.veiculos = []
    state.pontosOperacionais = []
    state.loading = false
    state.pointsLoading = false
    state.error = null
  }

  watch(() => auth.identityKey, $reset, { flush: 'sync' })

  const pointsMap = () => new Map(state.pontosOperacionais.map((p) => [p.id, p]))

  async function fetchPontosOperacionais({ signal } = {}) {
    state.pointsLoading = true
    const points = await runStoreRequest(
      state,
      signal,
      'Erro ao carregar pontos operacionais.',
      () => listOperationalPoints({}, { signal }),
    )
    if (!signal?.aborted) state.pointsLoading = false
    if (!points || signal?.aborted) return false
    state.pontosOperacionais = points
    const map = pointsMap()
    state.veiculos = state.veiculos.map((v) => ({
      ...v,
      garagePointName: formatGarageLabel(v.garagePointId ? map.get(v.garagePointId) : null),
    }))
    return true
  }

  async function adicionarPontoOperacional(dados, { signal } = {}) {
    const criado = await runStoreRequest(state, signal, 'Erro ao cadastrar ponto operacional.', () =>
      createOperationalPoint(dados, { signal }),
    )
    if (criado) await fetchPontosOperacionais({ signal })
    return criado
  }

  async function atualizarPontoOperacional(id, dados, { signal } = {}) {
    const atualizado = await runStoreRequest(state, signal, 'Erro ao atualizar ponto operacional.', () =>
      updateOperationalPoint(id, dados, { signal }),
    )
    if (atualizado) await fetchPontosOperacionais({ signal })
    return atualizado
  }

  async function fetchVeiculos({ signal } = {}) {
    state.loading = true
    const result = await runStoreRequest(state, signal, 'Erro ao carregar veículos.', () =>
      Promise.all([
        listVehicles({}, { signal }),
        listOperationalPoints({}, { signal }).catch(() => state.pontosOperacionais),
      ]),
    )
    if (!signal?.aborted) state.loading = false
    if (!result || signal?.aborted) return false
    const [vehicles, points] = result
    state.pontosOperacionais = points
    const map = new Map(points.map((p) => [p.id, p]))
    state.veiculos = vehicles.map((v) => mapVehicleFromApi(v, map))
    return true
  }

  async function adicionarVeiculo(novoVeiculo, { signal } = {}) {
    const data = await runStoreRequest(state, signal, 'Erro ao cadastrar veículo.', () =>
      createVehicle(mapVehicleToApi(novoVeiculo), { signal }),
    )
    if (!data) return false
    state.veiculos.unshift(mapVehicleFromApi(data, pointsMap()))
    return true
  }

  async function alterarStatus(id, { signal } = {}) {
    const veiculo = state.veiculos.find((v) => v.id === id)
    if (!veiculo) return false
    const novoStatus = veiculo.status === 'Ativo' ? 'Manutenção' : 'Ativo'
    const data = await runStoreRequest(state, signal, 'Erro ao alterar status do veículo.', () =>
      updateVehicle(id, { status: VEHICLE_STATUS_TO_API[novoStatus] }, { signal }),
    )
    if (!data) return false
    Object.assign(veiculo, mapVehicleFromApi(data, pointsMap()))
    return true
  }

  async function atualizarVeiculo(id, dados, { signal } = {}) {
    const data = await runStoreRequest(state, signal, 'Erro ao atualizar veículo.', () =>
      updateVehicle(id, mapVehicleToApi(dados), { signal }),
    )
    if (!data) return false
    const index = state.veiculos.findIndex((v) => v.id == id)
    if (index !== -1) state.veiculos[index] = mapVehicleFromApi(data, pointsMap())
    return true
  }

  return {
    ...toRefs(state),
    garagens,
    pontosDestino,
    $reset,
    fetchPontosOperacionais,
    adicionarPontoOperacional,
    atualizarPontoOperacional,
    fetchVeiculos,
    adicionarVeiculo,
    alterarStatus,
    atualizarVeiculo,
  }
})
