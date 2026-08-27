import { defineStore } from 'pinia';
import api from '@/api/client';

function formatHour(value) {
  if (!value) return '';
  return value.slice(0, 5);
}

function asList(data) {
  return Array.isArray(data) ? data : data?.results || [];
}

function mapGroupFromApi(group, { schedules = [], vehicles = [], drivers = [], passengers = [] } = {}) {
  return {
    id: group.id,
    name: group.name,
    commonCep: group.common_cep,
    passengersCount: group.passengers_count,
    schedules: schedules.map((s) => ({
      id: s.id,
      goHour: s.go_hour,
      returnHour: s.return_hour,
      goHourLabel: formatHour(s.go_hour),
      returnHourLabel: formatHour(s.return_hour),
    })),
    vehicles: vehicles.map((v) => ({ id: v.id, plate: v.plate, model: v.model, driverName: v.driver_name })),
    drivers: drivers.map((d) => ({ id: d.id, name: d.user_data?.name || 'Sem nome' })),
    passengers: passengers.map((p) => ({ id: p.id, name: p.user_data?.name || 'Sem nome' })),
  };
}

export const useRotasStore = defineStore('rotas', {
  state: () => ({
    rotas: [],
    grupos: [],
    companyId: null,
    todosVeiculos: [],
    todosMotoristas: [],
    todosPassageiros: [],
    loading: false,
    error: null,
  }),
  actions: {
    async fetchRotas() {
      this.loading = true;
      this.error = null;

      try {
        const { data: company } = await api.get('/companies/me/');
        this.companyId = company.id;

        const { data: groupsData } = await api.get('/company-route-groups/', {
          params: { company: company.id },
        });
        const groups = asList(groupsData);

        const [
          { data: allVehiclesData },
          { data: allDriversData },
          { data: allPassengersData },
        ] = await Promise.all([
          api.get('/vehicles/'),
          api.get('/drivers/'),
          api.get('/passengers/'),
        ]);

        const allVehicles = asList(allVehiclesData);
        const allDrivers = asList(allDriversData);
        const allPassengers = asList(allPassengersData);

        this.todosVeiculos = allVehicles;
        this.todosMotoristas = allDrivers;
        this.todosPassageiros = allPassengers;

        const rotas = [];
        const grupos = [];

        for (const group of groups) {
          const { data: schedulesData } = await api.get('/route-schedules/', {
            params: { route_group: group.id },
          });
          const schedules = asList(schedulesData);
          const vehicles = allVehicles.filter((v) => v.route_group === group.id);
          const drivers = allDrivers.filter((d) => d.route_group === group.id);
          const passengers = allPassengers.filter((p) => p.route_group === group.id);
          const vehicle = vehicles[0];

          grupos.push(mapGroupFromApi(group, { schedules, vehicles, drivers, passengers }));

          if (!schedules.length) {
            rotas.push({
              id: `group-${group.id}`,
              origem: group.name,
              destino: 'Sem horários cadastrados',
              horario: '-',
              van: vehicle?.plate || 'Não atribuída',
              motorista: vehicle?.driver_name || 'Não atribuído',
            });
            continue;
          }

          for (const schedule of schedules) {
            rotas.push({
              id: `schedule-${schedule.id}`,
              origem: group.name,
              destino: `Ida ${formatHour(schedule.go_hour)} - Volta ${formatHour(schedule.return_hour)}`,
              horario: formatHour(schedule.go_hour),
              van: vehicle?.plate || 'Não atribuída',
              motorista: vehicle?.driver_name || 'Não atribuído',
            });
          }
        }

        this.rotas = rotas;
        this.grupos = grupos;
        return true;
      } catch (error) {
        this.error = error.response?.data || error.message || 'Erro ao carregar rotas';
        return false;
      } finally {
        this.loading = false;
      }
    },

    async criarRota({ name, commonCep }) {
      this.error = null;
      try {
        const { data } = await api.post('/company-route-groups/', {
          name,
          common_cep: commonCep,
        });
        return data;
      } catch (error) {
        this.error = error.response?.data || error.message || 'Erro ao cadastrar rota';
        return null;
      }
    },

    async atualizarRota(id, { name, commonCep } = {}) {
      this.error = null;
      try {
        const payload = {};
        if (name !== undefined) payload.name = name;
        if (commonCep !== undefined) payload.common_cep = commonCep;
        const { data } = await api.patch(`/company-route-groups/${id}/`, payload);
        return data;
      } catch (error) {
        this.error = error.response?.data || error.message || 'Erro ao atualizar rota';
        return null;
      }
    },

    async removerRota(id) {
      this.error = null;
      try {
        await api.delete(`/company-route-groups/${id}/`);
        this.grupos = this.grupos.filter((g) => g.id !== id);
        this.rotas = this.rotas.filter((r) => !String(r.id).includes(`group-${id}`));
        return { success: true };
      } catch (error) {
        const responseData = error.response?.data;
        const detail = responseData?.detail || (typeof responseData === 'string' ? responseData : null);
        this.error = responseData || error.message || 'Erro ao remover rota';
        return {
          success: false,
          status: error.response?.status,
          detail: detail || 'Não foi possível excluir esta rota. Desvincule veículos, motoristas e passageiros antes de tentar novamente.',
        };
      }
    },

    async criarHorario(routeGroupId, { goHour, returnHour }) {
      this.error = null;
      try {
        const { data } = await api.post('/route-schedules/', {
          route_group: routeGroupId,
          go_hour: goHour,
          return_hour: returnHour,
        });
        return data;
      } catch (error) {
        this.error = error.response?.data || error.message || 'Erro ao cadastrar horário';
        return null;
      }
    },

    async atualizarHorario(id, { goHour, returnHour } = {}) {
      this.error = null;
      try {
        const payload = {};
        if (goHour !== undefined) payload.go_hour = goHour;
        if (returnHour !== undefined) payload.return_hour = returnHour;
        const { data } = await api.patch(`/route-schedules/${id}/`, payload);
        return data;
      } catch (error) {
        this.error = error.response?.data || error.message || 'Erro ao atualizar horário';
        return null;
      }
    },

    async removerHorario(id) {
      this.error = null;
      try {
        await api.delete(`/route-schedules/${id}/`);
        return true;
      } catch (error) {
        this.error = error.response?.data || error.message || 'Erro ao remover horário';
        return false;
      }
    },

    async atribuirVeiculo(vehicleId, routeGroupId) {
      this.error = null;
      try {
        const { data } = await api.patch(`/vehicles/${vehicleId}/`, { route_group: routeGroupId });
        return data;
      } catch (error) {
        this.error = error.response?.data || error.message || 'Erro ao atribuir veículo à rota';
        return null;
      }
    },

    async atribuirMotorista(driverId, routeGroupId) {
      this.error = null;
      try {
        const { data } = await api.patch(`/drivers/${driverId}/`, { route_group: routeGroupId });
        return data;
      } catch (error) {
        this.error = error.response?.data || error.message || 'Erro ao atribuir motorista à rota';
        return null;
      }
    },

    async desvincularMotorista(driverId) {
      this.error = null;
      try {
        const { data } = await api.patch(`/drivers/${driverId}/`, { route_group: null });
        return data;
      } catch (error) {
        this.error = error.response?.data || error.message || 'Erro ao desvincular motorista da rota';
        return null;
      }
    },

    async atribuirPassageiro(passengerId, routeGroupId) {
      this.error = null;
      try {
        const { data } = await api.patch(`/passengers/${passengerId}/`, { route_group: routeGroupId });
        return data;
      } catch (error) {
        this.error = error.response?.data || error.message || 'Erro ao atribuir passageiro à rota';
        return null;
      }
    },

    async desvincularPassageiro(passengerId) {
      this.error = null;
      try {
        const { data } = await api.patch(`/passengers/${passengerId}/`, { route_group: null });
        return data;
      } catch (error) {
        this.error = error.response?.data || error.message || 'Erro ao desvincular passageiro da rota';
        return null;
      }
    },
  },
});
