import { defineStore } from 'pinia';
import api from '@/api/client';

const STATUS_TO_API = {
  Ativo: 'active',
  Manutenção: 'maintenance',
};

const STATUS_FROM_API = {
  active: 'Ativo',
  maintenance: 'Manutenção',
};

function mapVehicleFromApi(vehicle) {
  return {
    id: vehicle.id,
    placa: vehicle.plate,
    modelo: vehicle.model || '',
    ano: vehicle.year ?? '',
    capacidade: vehicle.capacity ?? '',
    status: STATUS_FROM_API[vehicle.status] || vehicle.status,
    motorista: vehicle.driver_name || 'Não Atribuído',
    driver: vehicle.driver ?? null,
    routeGroup: vehicle.route_group,
    garageCep: vehicle.garage_cep || '',
    cor: vehicle.color || '',
    caracteristicas: Array.isArray(vehicle.features) ? vehicle.features : [],
  };
}

function mapVehicleToApi(vehicle) {
  const payload = {};

  if (vehicle.placa !== undefined) payload.plate = vehicle.placa;
  if (vehicle.modelo !== undefined) payload.model = vehicle.modelo;
  if (vehicle.ano !== undefined && vehicle.ano !== '') payload.year = Number(vehicle.ano);
  if (vehicle.capacidade !== undefined && vehicle.capacidade !== '') payload.capacity = Number(vehicle.capacidade);
  if (vehicle.status !== undefined) payload.status = STATUS_TO_API[vehicle.status] || vehicle.status;
  if (vehicle.routeGroup !== undefined) payload.route_group = vehicle.routeGroup;
  if (vehicle.garageCep !== undefined) payload.garage_cep = vehicle.garageCep;
  if (vehicle.driver !== undefined) payload.driver = vehicle.driver || null;
  if (vehicle.cor !== undefined) payload.color = vehicle.cor;
  if (vehicle.caracteristicas !== undefined) payload.features = vehicle.caracteristicas;

  return payload;
}

export const useTransporteStore = defineStore('transporte', {
  state: () => ({
    veiculos: [],
    loading: false,
    error: null,
  }),
  actions: {
    async fetchVeiculos() {
      this.loading = true;
      this.error = null;
      try {
        const { data } = await api.get('/vehicles/');
        const results = Array.isArray(data) ? data : data.results || [];
        this.veiculos = results.map(mapVehicleFromApi);
        return true;
      } catch (error) {
        this.error = error.response?.data || error.message || 'Erro ao carregar veículos';
        return false;
      } finally {
        this.loading = false;
      }
    },

    async adicionarVeiculo(novoVeiculo) {
      this.error = null;
      try {
        const { data } = await api.post('/vehicles/', mapVehicleToApi(novoVeiculo));
        this.veiculos.unshift(mapVehicleFromApi(data));
        return true;
      } catch (error) {
        this.error = error.response?.data || error.message || 'Erro ao cadastrar veículo';
        return false;
      }
    },

    async alterarStatus(id) {
      const veiculo = this.veiculos.find(v => v.id === id);
      if (!veiculo) return false;

      const novoStatus = veiculo.status === 'Ativo' ? 'Manutenção' : 'Ativo';
      this.error = null;
      try {
        const { data } = await api.patch(`/vehicles/${id}/`, { status: STATUS_TO_API[novoStatus] });
        Object.assign(veiculo, mapVehicleFromApi(data));
        return true;
      } catch (error) {
        this.error = error.response?.data || error.message || 'Erro ao alterar status do veículo';
        return false;
      }
    },

    async atualizarVeiculo(id, dados) {
      this.error = null;
      try {
        const { data } = await api.patch(`/vehicles/${id}/`, mapVehicleToApi(dados));
        const index = this.veiculos.findIndex(v => v.id == id);
        if (index !== -1) this.veiculos[index] = mapVehicleFromApi(data);
        return true;
      } catch (error) {
        this.error = error.response?.data || error.message || 'Erro ao atualizar veículo';
        return false;
      }
    },

    async removerVeiculo(id) {
      this.error = null;
      try {
        await api.delete(`/vehicles/${id}/`);
        this.veiculos = this.veiculos.filter(v => v.id !== id);
        return true;
      } catch (error) {
        this.error = error.response?.data || error.message || 'Erro ao remover veículo';
        return false;
      }
    },
  },
});
