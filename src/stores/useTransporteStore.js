import { defineStore } from 'pinia'
import { watch } from 'vue'
import { state as authState } from '@/stores/state'
import { sessionError } from '@/stores/session'
import { formatApiError } from '@/utils/apiErrors'
import {
  listVehicles,
  createVehicle,
  updateVehicle,
  listOperationalPoints,
  createOperationalPoint,
  updateOperationalPoint,
} from '@/api/transport'

import { POINT_TYPES, VEHICLE_STATUS_FROM_API, VEHICLE_STATUS_TO_API } from '@/constants'

function mapVehicleFromApi(vehicle, pointsMap = new Map()) {
  const garagePoint = pointsMap.get(vehicle.garage_point) || null
  return {
    id: vehicle.id,
    company: vehicle.company,
    placa: vehicle.plate,
    modelo: vehicle.model || '',
    ano: vehicle.year ?? '',
    capacidade: vehicle.capacity ?? '',
    status: VEHICLE_STATUS_FROM_API[vehicle.status] || vehicle.status,
    rawStatus: vehicle.status,
    garagePointId: vehicle.garage_point ?? null,
    garagePointName: garagePoint ? `${garagePoint.name} (${garagePoint.city}/${garagePoint.state})` : null,
    cor: vehicle.color || '',
    caracteristicas: Array.isArray(vehicle.features) ? vehicle.features : [],
  }
}

function mapVehicleToApi(vehicle) {
  const payload = {}
  if (vehicle.placa !== undefined) payload.plate = vehicle.placa
  if (vehicle.modelo !== undefined) payload.model = vehicle.modelo
  if (vehicle.ano !== undefined) payload.year = vehicle.ano
  if (vehicle.capacidade !== undefined) payload.capacity = vehicle.capacidade
  if (vehicle.status !== undefined) payload.status = VEHICLE_STATUS_TO_API[vehicle.status] || vehicle.status
  if (vehicle.garagePointId !== undefined) payload.garage_point_id = vehicle.garagePointId
  if (vehicle.cor !== undefined) payload.color = vehicle.cor
  if (vehicle.caracteristicas !== undefined) payload.features = vehicle.caracteristicas
  return payload
}

export const useTransporteStore = defineStore('transporte', {
  state: () => ({
    veiculos: [],
    pontosOperacionais: [],
    loading: false,
    pointsLoading: false,
    error: null,
  }),
  getters: {
    garagens: (state) => state.pontosOperacionais.filter((p) => p.point_type === POINT_TYPES.GARAGE),
    pontosDestino: (state) => state.pontosOperacionais.filter((p) => p.point_type === POINT_TYPES.DESTINATION),
  },
  actions: {
    $reset() {
      this.veiculos = []
      this.pontosOperacionais = []
      this.loading = false
      this.pointsLoading = false
      this.error = null
    },

    async fetchPontosOperacionais({ signal } = {}) {
      this.pointsLoading = true
      try {
        this.pontosOperacionais = await listOperationalPoints({}, { signal })
        const pointsMap = new Map(this.pontosOperacionais.map((p) => [p.id, p]))
        this.veiculos = this.veiculos.map((v) => ({
          ...v,
          garagePointName: v.garagePointId && pointsMap.has(v.garagePointId)
            ? `${pointsMap.get(v.garagePointId).name} (${pointsMap.get(v.garagePointId).city}/${pointsMap.get(v.garagePointId).state})`
            : null,
        }))
        return true
      } catch (error) {
        if (!signal?.aborted) {
          this.error = sessionError(error, formatApiError(error, 'Erro ao carregar pontos operacionais.'))
        }
        return false
      } finally {
        if (!signal?.aborted) this.pointsLoading = false
      }
    },

    async adicionarPontoOperacional(dados, { signal } = {}) {
      this.error = null
      try {
        const criado = await createOperationalPoint(dados, { signal })
        await this.fetchPontosOperacionais({ signal })
        return criado
      } catch (error) {
        if (!signal?.aborted) {
          this.error = sessionError(error, formatApiError(error, 'Erro ao cadastrar ponto operacional.'))
        }
        return null
      }
    },

    async atualizarPontoOperacional(id, dados, { signal } = {}) {
      this.error = null
      try {
        const atualizado = await updateOperationalPoint(id, dados, { signal })
        await this.fetchPontosOperacionais({ signal })
        return atualizado
      } catch (error) {
        if (!signal?.aborted) {
          this.error = sessionError(error, formatApiError(error, 'Erro ao atualizar ponto operacional.'))
        }
        return null
      }
    },

    async fetchVeiculos({ signal } = {}) {
      this.loading = true
      this.error = null
      try {
        const [vehicles, points] = await Promise.all([
          listVehicles({}, { signal }),
          listOperationalPoints({}, { signal }).catch(() => this.pontosOperacionais),
        ])
        if (signal?.aborted) return false
        this.pontosOperacionais = points
        const pointsMap = new Map(points.map((p) => [p.id, p]))
        this.veiculos = vehicles.map((v) => mapVehicleFromApi(v, pointsMap))
        return true
      } catch (error) {
        if (!signal?.aborted) {
          this.error = sessionError(error, formatApiError(error, 'Erro ao carregar veículos.'))
        }
        return false
      } finally {
        if (!signal?.aborted) this.loading = false
      }
    },

    async adicionarVeiculo(novoVeiculo, { signal } = {}) {
      this.error = null
      try {
        const data = await createVehicle(mapVehicleToApi(novoVeiculo), { signal })
        const pointsMap = new Map(this.pontosOperacionais.map((p) => [p.id, p]))
        this.veiculos.unshift(mapVehicleFromApi(data, pointsMap))
        return true
      } catch (error) {
        if (!signal?.aborted) {
          this.error = sessionError(error, formatApiError(error, 'Erro ao cadastrar veículo.'))
        }
        return false
      }
    },

    async alterarStatus(id, { signal } = {}) {
      const veiculo = this.veiculos.find((v) => v.id === id)
      if (!veiculo) return false

      const novoStatus = veiculo.status === 'Ativo' ? 'Manutenção' : 'Ativo'
      this.error = null
      try {
        const data = await updateVehicle(id, { status: VEHICLE_STATUS_TO_API[novoStatus] }, { signal })
        const pointsMap = new Map(this.pontosOperacionais.map((p) => [p.id, p]))
        Object.assign(veiculo, mapVehicleFromApi(data, pointsMap))
        return true
      } catch (error) {
        if (!signal?.aborted) {
          this.error = sessionError(error, formatApiError(error, 'Erro ao alterar status do veículo.'))
        }
        return false
      }
    },

    async atualizarVeiculo(id, dados, { signal } = {}) {
      this.error = null
      try {
        const data = await updateVehicle(id, mapVehicleToApi(dados), { signal })
        const pointsMap = new Map(this.pontosOperacionais.map((p) => [p.id, p]))
        const index = this.veiculos.findIndex((v) => v.id == id)
        if (index !== -1) this.veiculos[index] = mapVehicleFromApi(data, pointsMap)
        return true
      } catch (error) {
        if (!signal?.aborted) {
          this.error = sessionError(error, formatApiError(error, 'Erro ao atualizar veículo.'))
        }
        return false
      }
    },
  },
})

watch(() => `${authState.logged}:${authState.user?.id || ''}`, () => {
  try {
    useTransporteStore().$reset()
  } catch {
    // Store ainda não inicializada pelo Pinia
  }
}, { flush: 'sync' })
