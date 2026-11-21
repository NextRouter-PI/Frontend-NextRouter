import { computed, ref, shallowRef, watch } from 'vue'
import { POINT_TYPES, SERVICE_DIRECTIONS } from '@/constants'
import { useRotasStore } from '@/stores/useRotasStore'
import { useAccountScope } from '@/composables/useAccountScope'

/**
 * Gerencia estado, validação e envio do formulário de serviço recorrente (habitual ou compartilhado).
 */
export function useRecurringServiceForm(props, emit) {
  const store = useRotasStore()
  const scope = useAccountScope()

  function emptyService() {
    return {
      name: '',
      direction: props.isShared ? SERVICE_DIRECTIONS.RETURN : SERVICE_DIRECTIONS.OUTBOUND,
      is_shared: props.isShared,
      weekdays: 0,
      target_time: '',
      driver_membership_id: '',
      vehicle_id: '',
      origin_id: '',
      destination_id: '',
    }
  }

  const salvando = shallowRef(false)
  const erro = shallowRef('')
  const aviso = shallowRef('')
  const form = ref(emptyService())
  const paradasSelecionadas = ref([])

  const motoristasAtivos = computed(() => store.vinculosAtivos.filter((m) => m.driver != null))
  const veiculosAtivos = computed(() => store.todosVeiculos.filter((v) => v.status === 'active'))
  const pontosOrigemDestino = computed(() =>
    store.pontosOperacionais.filter(
      (p) => p.point_type === POINT_TYPES.GARAGE || p.point_type === POINT_TYPES.DESTINATION,
    ),
  )

  watch(
    () => props.editingService,
    (s) => {
      erro.value = ''
      aviso.value = ''
      if (!s) {
        form.value = emptyService()
        paradasSelecionadas.value = []
        return
      }
      form.value = {
        name: s.name || '',
        direction: s.direction || (props.isShared ? SERVICE_DIRECTIONS.RETURN : SERVICE_DIRECTIONS.OUTBOUND),
        is_shared: props.isShared,
        weekdays: Number(s.weekdays) || 0,
        target_time: String(s.target_time || '').slice(0, 5),
        driver_membership_id: s.driver_membership ?? '',
        vehicle_id: s.vehicle ?? '',
        origin_id: s.origin ?? '',
        destination_id: s.destination ?? '',
      }
      paradasSelecionadas.value = !props.isShared && Array.isArray(s.point_ids) ? [...s.point_ids] : []
    },
    { immediate: true },
  )

  function labelPontoOrigemDestino(p) {
    const tipo = p.point_type === POINT_TYPES.GARAGE ? 'Garagem' : 'Destino'
    return `[${tipo}] ${p.name} (${p.city}/${p.state})`
  }

  async function salvar() {
    if (!scope.current() || salvando.value) return
    erro.value = ''
    aviso.value = ''

    if (
      !form.value.name.trim() ||
      !form.value.weekdays ||
      !form.value.target_time ||
      !form.value.origin_id ||
      !form.value.destination_id
    ) {
      erro.value = 'Informe nome, dias da semana, horário-alvo, ponto de origem e ponto de destino.'
      return
    }

    salvando.value = true
    const payload = { ...form.value, is_shared: props.isShared, route_group_id: props.groupId }
    const editingId = props.editingService?.id
    const saved = editingId
      ? await store.atualizarServico(editingId, payload, { signal: scope.signal })
      : await store.criarServico(payload, { signal: scope.signal })

    if (!scope.current()) return
    if (!saved) {
      salvando.value = false
      erro.value = store.error || 'Erro ao salvar serviço.'
      return
    }

    if (!props.isShared) {
      const stopsOk = await store.salvarParadasServico(saved.id, paradasSelecionadas.value, {
        signal: scope.signal,
      })
      if (!scope.current()) return
      if (!stopsOk) {
        salvando.value = false
        erro.value = store.error || 'Serviço salvo, mas houve falha ao salvar as paradas habituais.'
        emit('saved')
        return
      }
    }

    salvando.value = false
    const label = props.isShared ? 'Serviço compartilhado' : 'Serviço habitual'
    aviso.value = editingId ? `${label} atualizado.` : `${label} cadastrado.`
    form.value = emptyService()
    paradasSelecionadas.value = []
    emit('saved')
  }

  return {
    store,
    salvando,
    erro,
    aviso,
    form,
    paradasSelecionadas,
    motoristasAtivos,
    veiculosAtivos,
    pontosOrigemDestino,
    labelPontoOrigemDestino,
    salvar,
  }
}
