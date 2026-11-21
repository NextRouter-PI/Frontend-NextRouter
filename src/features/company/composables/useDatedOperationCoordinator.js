import { computed, onUnmounted, ref, shallowRef, watch } from 'vue'
import { usePageVisibility } from '@/composables/usePageVisibility'
import { nomeGrupo, nomeServico, categoriaDia } from '@/features/company/utils/operationLookups'

export function useDatedOperationCoordinator({ store, scope, onToast }) {
  const { isActive } = usePageVisibility()
  const busy = shallowRef(false)
  const filtroGrupoId = shallowRef('')
  const filtroData = shallowRef('')
  const filtroStatusDia = shallowRef('em_andamento')
  const calcTravelId = shallowRef(null)
  const pendingCancel = ref(null)

  const motoristasAtivos = computed(() => store.vinculosAtivos.filter((m) => m.driver != null))
  const veiculosAtivos = computed(() => store.todosVeiculos.filter((v) => v.status === 'active'))
  const diasAtendimentoFiltrados = computed(() => {
    const lista = store.diasAtendimento || []
    if (filtroStatusDia.value === 'todas') return lista
    return lista.filter((day) => categoriaDia(store.viagensDia, day) === filtroStatusDia.value)
  })

  const notify = (message, type = 'success') => onToast({ message, type })

  async function consultarOperacao() {
    if (!scope.current() || busy.value) return
    await store.fetchOperacaoDatada(
      { route_group: filtroGrupoId.value || undefined, date: filtroData.value || undefined },
      { signal: scope.signal },
    )
  }

  async function runAction(fn, onSuccessMsg, onErrorMsg, onSuccess) {
    if (!scope.current() || busy.value) return null
    busy.value = true
    const res = await fn()
    if (!scope.current()) return null
    busy.value = false
    if (res) {
      onSuccess?.()
      if (onSuccessMsg) notify(typeof onSuccessMsg === 'function' ? onSuccessMsg(res) : onSuccessMsg)
      await consultarOperacao()
      return res
    }
    notify(store.error || onErrorMsg, 'error')
    return null
  }

  let pollTimer = null
  const hasActiveJobs = computed(() =>
    store.jobsCalculo.some((j) => j.status === 'pending' || j.status === 'running') ||
    store.viagensDia.some((t) => t.planning_status === 'preparing'),
  )

  watch([hasActiveJobs, isActive], ([active, visible]) => {
    if (pollTimer) { clearInterval(pollTimer); pollTimer = null }
    if (active && visible) {
      pollTimer = setInterval(() => {
        if (scope.current() && isActive.value && !busy.value && !store.dayLoading) consultarOperacao()
      }, 2000)
    }
  })

  onUnmounted(() => {
    if (pollTimer) { clearInterval(pollTimer); pollTimer = null }
  })

  async function executePendingCancel() {
    const current = pendingCancel.value
    if (!current) return
    pendingCancel.value = null
    await current.run()
  }

  function handleGenerateHorizon({ groupId, start_date, horizon_days, batch_size, tomorrowIso, excludedDates, onSuccess }) {
    if (!groupId || !start_date || !horizon_days || !batch_size) {
      return notify('Preencha grupo, data inicial, horizonte (1–31) e lote (1–31).', 'error')
    }
    if (start_date < tomorrowIso) {
      return notify('Não é permitido aplicar atendimentos no dia atual nem em datas passadas. Escolha a partir de amanhã.', 'error')
    }
    return runAction(
      () => store.gerarHorizonte(Number(groupId), { start_date, horizon_days: Number(horizon_days), batch_size: Number(batch_size), excluded_dates: excludedDates }, { signal: scope.signal }),
      (res) => `Atendimentos aplicados (${res.length} dia(s) gerado(s)).`,
      'Erro ao aplicar atendimentos.',
      onSuccess,
    )
  }

  function handleCancelDate({ groupId, date, reason, onSuccess }) {
    if (!groupId || !date || !reason.trim()) return notify('Informe grupo, data e motivo para cancelar a data.', 'error')
    pendingCancel.value = {
      title: 'Cancelar data de atendimento',
      message: `Deseja cancelar todos os atendimentos da data ${date} para o grupo selecionado?`,
      warning: 'Esta ação não poderá ser revertida. Uma data cancelada fica preservada no histórico e não poderá ser recriada.',
      confirmLabel: 'Sim, cancelar data',
      run: () => runAction(
        () => store.cancelarDataGrupo(Number(groupId), { date, reason }, { signal: scope.signal }),
        (r) => (r.partial ? 'Data cancelada parcialmente (viagens em andamento preservadas).' : 'Data cancelada.'),
        'Erro ao cancelar data.',
        onSuccess,
      ),
    }
  }

  function handleCancelDay({ day, reason, onSuccess }) {
    if (!reason.trim()) return notify('Informe o motivo do cancelamento do atendimento.', 'error')
    pendingCancel.value = {
      title: `Cancelar atendimento de ${day.date}`,
      message: `Deseja cancelar o atendimento #${day.id} (${nomeGrupo(store.grupos, day.route_group)})?`,
      warning: 'Esta ação não poderá ser revertida. O atendimento cancelado não poderá ser recriado para esta data.',
      confirmLabel: 'Sim, cancelar atendimento',
      run: () => runAction(
        () => store.cancelarDiaAtendimento(day.id, reason.trim(), { signal: scope.signal }),
        (r) => (r.partial ? 'Atendimento cancelado parcialmente (viagens iniciadas preservadas).' : 'Atendimento cancelado.'),
        'Não foi possível cancelar o atendimento.',
        onSuccess,
      ),
    }
  }

  function handleCancelTravel(travel) {
    pendingCancel.value = {
      title: `Cancelar viagem #${travel.id}`,
      message: `Deseja cancelar a viagem "${nomeServico(store.servicos, travel.service)}"?`,
      warning: 'Esta ação não poderá ser revertida e todos os passageiros alocados serão notificados.',
      confirmLabel: 'Sim, cancelar viagem',
      run: () => runAction(() => store.cancelarViagem(travel.id, { signal: scope.signal }), 'Viagem cancelada.', 'Não foi possível cancelar a viagem.'),
    }
  }

  function handleInviteDriver({ travel, driverMembershipId, expiresAt, onSuccess }) {
    if (!driverMembershipId || !expiresAt) {
      return notify('Selecione o motorista substituto e o prazo de expiração do convite.', 'error')
    }
    return runAction(
      () => store.convidarMotoristaViagem(travel.id, { driverMembershipId: Number(driverMembershipId), expiresAt: new Date(expiresAt).toISOString() }, { signal: scope.signal }),
      'Convite enviado. O motorista convidado precisa aceitar explicitamente.',
      'Não foi possível convidar o motorista.',
      onSuccess,
    )
  }

  return {
    busy, filtroGrupoId, filtroData, filtroStatusDia, calcTravelId, pendingCancel,
    motoristasAtivos, veiculosAtivos, diasAtendimentoFiltrados,
    consultarOperacao, runAction, executePendingCancel,
    handleGenerateHorizon, handleCancelDate, handleCancelDay, handleCancelTravel, handleInviteDriver,
  }
}
