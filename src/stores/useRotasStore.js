import { defineStore } from 'pinia'
import { watch } from 'vue'
import { POINT_TYPES, WEEKDAY_OPTIONS } from '@/constants'
import { formatWeekdays } from '@/utils/formatters'
import { state as authState } from '@/stores/state'
import { habitualActions } from './rotas/habitualActions'
import { operationActions } from './rotas/operationActions'

export { WEEKDAY_OPTIONS, formatWeekdays }

function initialState() {
  return {
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
  }
}

export const useRotasStore = defineStore('rotas', {
  state: initialState,
  getters: {
    pontosDestino: (state) => state.pontosOperacionais.filter((p) => p.point_type === POINT_TYPES.DESTINATION),
    garagens: (state) => state.pontosOperacionais.filter((p) => p.point_type === POINT_TYPES.GARAGE),
  },
  actions: {
    $reset() {
      Object.assign(this, initialState())
    },
    ...habitualActions,
    ...operationActions,
  },
})

watch(
  () => `${authState.logged}:${authState.user?.id || ''}`,
  () => {
    try {
      useRotasStore().$reset()
    } catch {
      // Store ainda não inicializada pelo Pinia
    }
  },
  { flush: 'sync' },
)
