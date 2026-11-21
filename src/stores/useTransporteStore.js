import { computed, shallowReactive, toRefs, watch } from 'vue'
import { defineStore } from 'pinia'
import { POINT_TYPES, VEHICLE_STATUS_TO_API } from '@/constants'
import { useAuthStore } from '@/stores/useAuthStore'
import {
  listVehicles,
  createVehicle,
  updateVehicle,
  listOperationalPoints,
  createOperationalPoint,
  updateOperationalPoint,
} from '@/api/transport'
import { runStoreRequest } from './rotas/requestHelper'
import { createFreshnessCache } from './rotas/cacheHelper'
import { formatGarageLabel, mapVehicleFromApi, mapVehicleToApi } from './mappers/vehicleMapper'

export const useTransporteStore = defineStore('transporte', () => {
  const auth = useAuthStore()
  const state = shallowReactive({
    veiculos: [],
    pontosOperacionais: [],
    loading: false,
    pointsLoading: false,
    error: null,
  })
  const vehiclesCache = createFreshnessCache()
  const pointsCache = createFreshnessCache()

  const garagens = computed(() =>
    state.pontosOperacionais.filter((p) => p.point_type === POINT_TYPES.GARAGE),
  )
  const pontosDestino = computed(() =>
    state.pontosOperacionais.filter((p) => p.point_type === POINT_TYPES.DESTINATION),
  )

  function $reset() {
    vehiclesCache.reset()
    pointsCache.reset()
    state.veiculos = []
    state.pontosOperacionais = []
    state.loading = false
    state.pointsLoading = false
    state.error = null
  }

  watch(() => auth.identityKey, $reset, { flush: 'sync' })

  const pointsMap = () => new Map(state.pontosOperacionais.map((p) => [p.id, p]))

  function fetchPontosOperacionais({ signal, force = false } = {}) {
    if (!force && pointsCache.isFresh(state.pontosOperacionais.length)) return Promise.resolve(true)
    return pointsCache.dedupe(force, async () => {
      state.pointsLoading = true
      const points = await runStoreRequest(state, signal, 'Erro ao carregar pontos operacionais.', () =>
        listOperationalPoints({}, { signal }),
      )
      if (!signal?.aborted) state.pointsLoading = false
      if (!points || signal?.aborted) return false
      state.pontosOperacionais = points
      pointsCache.markFresh()
      const map = pointsMap()
      state.veiculos = state.veiculos.map((v) =>
        Object.assign({}, v, {
          garagePointName: formatGarageLabel(v.garagePointId ? map.get(v.garagePointId) : null),
        }),
      )
      return true
    })
  }

  async function adicionarPontoOperacional(dados, { signal } = {}) {
    const criado = await runStoreRequest(state, signal, 'Erro ao cadastrar ponto operacional.', () =>
      createOperationalPoint(dados, { signal }),
    )
    if (criado) await fetchPontosOperacionais({ signal, force: true })
    return criado
  }

  async function atualizarPontoOperacional(id, dados, { signal } = {}) {
    const atualizado = await runStoreRequest(state, signal, 'Erro ao atualizar ponto operacional.', () =>
      updateOperationalPoint(id, dados, { signal }),
    )
    if (atualizado) await fetchPontosOperacionais({ signal, force: true })
    return atualizado
  }

  function fetchVeiculos({ signal, force = false } = {}) {
    if (!force && vehiclesCache.isFresh(state.veiculos.length)) return Promise.resolve(true)
    return vehiclesCache.dedupe(force, async () => {
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
      const now = Date.now()
      vehiclesCache.markFresh(now)
      pointsCache.markFresh(now)
      return true
    })
  }

  async function adicionarVeiculo(novoVeiculo, { signal } = {}) {
    const data = await runStoreRequest(state, signal, 'Erro ao cadastrar veículo.', () =>
      createVehicle(mapVehicleToApi(novoVeiculo), { signal }),
    )
    if (!data) return false
    state.veiculos = [mapVehicleFromApi(data, pointsMap()), ...state.veiculos]
    vehiclesCache.markFresh()
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
    const updated = mapVehicleFromApi(data, pointsMap())
    state.veiculos = state.veiculos.map((v) => (v.id === id ? updated : v))
    vehiclesCache.markFresh()
    return true
  }

  async function atualizarVeiculo(id, dados, { signal } = {}) {
    const data = await runStoreRequest(state, signal, 'Erro ao atualizar veículo.', () =>
      updateVehicle(id, mapVehicleToApi(dados), { signal }),
    )
    if (!data) return false
    const updated = mapVehicleFromApi(data, pointsMap())
    state.veiculos = state.veiculos.map((v) => (v.id == id ? updated : v))
    vehiclesCache.markFresh()
    return true
  }

  return {
    ...toRefs(state), garagens, pontosDestino, $reset,
    fetchPontosOperacionais, adicionarPontoOperacional, atualizarPontoOperacional,
    fetchVeiculos, adicionarVeiculo, alterarStatus, atualizarVeiculo,
  }
})
