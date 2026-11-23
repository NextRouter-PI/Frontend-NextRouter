import { computed, shallowReactive, toRefs, watch } from 'vue'
import { defineStore } from 'pinia'
import { POINT_TYPES, WEEKDAY_OPTIONS } from '@/constants'
import { formatWeekdays } from '@/utils/formatters'
import { useAuthStore } from '@/stores/useAuthStore'
import { createGroupConfigActions } from './rotas/groupConfigActions'
import { createServiceActions } from './rotas/serviceActions'
import { createDayActions } from './rotas/dayActions'
import { createTravelActions } from './rotas/travelActions'

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

export const useRotasStore = defineStore('rotas', () => {
  const auth = useAuthStore()
  const state = shallowReactive(initialState())
  const groupConfigActions = createGroupConfigActions(state)

  const pontosDestino = computed(() =>
    state.pontosOperacionais.filter((p) => p.point_type === POINT_TYPES.DESTINATION),
  )
  const garagens = computed(() =>
    state.pontosOperacionais.filter((p) => p.point_type === POINT_TYPES.GARAGE),
  )

  function $reset() {
    groupConfigActions.invalidateRotasCache()
    Object.assign(state, initialState())
  }

  watch(() => auth.identityKey, $reset, { flush: 'sync' })

  return {
    ...toRefs(state),
    pontosDestino,
    garagens,
    $reset,
    ...groupConfigActions,
    ...createServiceActions(state, { onMutated: groupConfigActions.invalidateRotasCache }),
    ...createDayActions(state),
    ...createTravelActions(state),
  }
})
