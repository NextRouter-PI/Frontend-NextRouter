<script setup>
import { computed, onUnmounted, ref, shallowRef, watch } from 'vue'
import { SERVICE_DIRECTIONS } from '@/constants'
import { useRotasStore } from '@/stores/useRotasStore'
import { useAccountScope } from '@/composables/useAccountScope'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import BatchHorizonCard from './BatchHorizonCard.vue'
import ChangeRequestsCard from './ChangeRequestsCard.vue'
import ServiceDayCard from './ServiceDayCard.vue'
import TravelOperationCard from './TravelOperationCard.vue'
import RouteCalculationModal from './RouteCalculationModal.vue'

const emit = defineEmits(['toast'])

const store = useRotasStore()
const scope = useAccountScope()

const busy = shallowRef(false)
const filtroGrupoId = shallowRef('')
const filtroData = shallowRef('')
const filtroStatusDia = shallowRef('em_andamento')

const motoristasAtivos = computed(() => store.vinculosAtivos.filter((m) => m.driver != null))
const veiculosAtivos = computed(() => store.todosVeiculos.filter((v) => v.status === 'active'))

const diasAtendimentoFiltrados = computed(() => {
  const lista = store.diasAtendimento || []
  if (filtroStatusDia.value === 'todas') return lista
  return lista.filter((day) => categoriaDia(day) === filtroStatusDia.value)
})

function notify(message, type = 'success') {
  emit('toast', { message, type })
}

function nomeGrupo(groupId) {
  return store.grupos.find((g) => g.id === groupId)?.name || `Grupo #${groupId}`
}

function nomeServico(serviceId) {
  const s = store.servicos.find((item) => item.id === serviceId)
  if (!s) return `Serviço #${serviceId}`
  const tipo = s.is_shared ? 'Compartilhado' : 'Habitual'
  const dir = s.direction === SERVICE_DIRECTIONS.OUTBOUND ? 'Ida' : 'Retorno'
  return `${s.name} (${dir} ${String(s.target_time || '').slice(0, 5)} · ${tipo})`
}

function viagensDoDia(dayId) {
  return store.viagensDia.filter((t) => t.service_day === dayId)
}

function categoriaDia(day) {
  if (day.canceled_at) return 'canceladas'
  const travels = viagensDoDia(day.id)
  const todasFinalizadas =
    travels.length > 0 && travels.every((t) => t.status === 'finished' || t.status === 'canceled')
  if (day.window === 'closed' || todasFinalizadas) return 'encerradas'
  return 'em_andamento'
}

function resumoRespostasDia(dayId) {
  const list = store.elegibilidadesDia.filter((e) => e.day === dayId)
  let semResposta = 0
  let negativas = 0
  let comIda = 0
  let comRetorno = 0
  for (const e of list) {
    const r = e.response
    if (!r || !r.answered_at) {
      semResposta++
      continue
    }
    const idaAtiva = r.outbound_service && !r.outbound_withdrawn_at
    const voltaAtiva = r.return_service && !r.return_withdrawn_at
    if (!idaAtiva && !voltaAtiva) negativas++
    else {
      if (idaAtiva) comIda++
      if (voltaAtiva) comRetorno++
    }
  }
  return { total: list.length, semResposta, negativas, comIda, comRetorno }
}

function participacoesListaDaViagem(travelId) {
  return store.participacoesViagem.filter(
    (p) => p.travel === travelId && ['allocated', 'on_board'].includes(p.status),
  )
}

function participacoesDaViagem(travelId) {
  return participacoesListaDaViagem(travelId).length
}

function originPointForTravel(travel) {
  if (!travel) return null
  const service = (store.servicos || []).find((s) => s.id === travel.service)
  const vehicle = (store.todosVeiculos || []).find((v) => v.id === (travel.vehicle || service?.vehicle))
  const originId = service?.origin || vehicle?.garage_point
  return originId ? (store.pontosOperacionais || []).find((p) => p.id === originId) || null : null
}

function destinationPointForTravel(travel) {
  if (!travel) return null
  const service = (store.servicos || []).find((s) => s.id === travel.service)
  const group = (store.grupos || []).find((g) => g.id === service?.route_group)
  const vehicle = (store.todosVeiculos || []).find((v) => v.id === (travel.vehicle || service?.vehicle))
  const destId =
    service?.destination ||
    (service?.direction === SERVICE_DIRECTIONS.OUTBOUND ? group?.destination : vehicle?.garage_point)
  return destId ? (store.pontosOperacionais || []).find((p) => p.id === destId) || null : null
}

// Modal de cálculo de rota
const calcTravelId = shallowRef(null)
const calcTravel = computed(() =>
  calcTravelId.value ? store.viagensDia.find((t) => t.id === calcTravelId.value) || null : null,
)
const calcSnapshot = computed(() => (calcTravel.value ? snapshotDaViagem(calcTravel.value) : null))
const calcJob = computed(() => (calcTravel.value ? jobDoSnapshot(calcTravel.value) : null))
const calcParticipants = computed(() =>
  calcTravel.value ? participacoesListaDaViagem(calcTravel.value.id) : [],
)

// Pop-up de confirmação de cancelamento irreversível
const pendingCancel = ref(null)

function confirmCancel(config) {
  pendingCancel.value = config
}

async function executePendingCancel() {
  const current = pendingCancel.value
  if (!current) return
  pendingCancel.value = null
  await current.run()
}

// Polling automático enquanto houver jobs pendentes/em andamento (Item 10)
let pollTimer = null
const hasActiveJobs = computed(() =>
  store.jobsCalculo.some((j) => j.status === 'pending' || j.status === 'running') ||
  store.viagensDia.some((t) => t.planning_status === 'preparing'),
)

watch(hasActiveJobs, (active) => {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
  if (active) {
    pollTimer = setInterval(() => {
      if (scope.current() && !busy.value && !store.dayLoading) {
        consultarOperacao()
      }
    }, 2000)
  }
})

onUnmounted(() => {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
})

function snapshotDaViagem(travel) {
  if (travel.current_snapshot) {
    const current = store.snapshotsViagem.find((s) => s.id === travel.current_snapshot)
    if (current) return current
  }
  let latest = null
  for (const snapshot of store.snapshotsViagem) {
    if (snapshot.travel === travel.id && (!latest || snapshot.id > latest.id)) {
      latest = snapshot
    }
  }
  return latest
}

function jobDoSnapshot(travel) {
  const snapshot = snapshotDaViagem(travel)
  return snapshot ? store.jobsCalculo.find((j) => j.snapshot === snapshot.id) || null : null
}

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

function handleGenerateHorizon({ groupId, start_date, horizon_days, batch_size, tomorrowIso, excludedDates, onSuccess }) {
  if (!groupId || !start_date || !horizon_days || !batch_size) {
    return notify('Preencha grupo, data inicial, horizonte (1–31) e lote (1–31).', 'error')
  }
  if (start_date < tomorrowIso) {
    return notify(
      'Não é permitido aplicar atendimentos no dia atual nem em datas passadas. Escolha a partir de amanhã.',
      'error',
    )
  }
  return runAction(
    () =>
      store.gerarHorizonte(
        Number(groupId),
        { start_date, horizon_days: Number(horizon_days), batch_size: Number(batch_size), excluded_dates: excludedDates },
        { signal: scope.signal },
      ),
    (res) => `Atendimentos aplicados (${res.length} dia(s) gerado(s)).`,
    'Erro ao aplicar atendimentos.',
    onSuccess,
  )
}

function handleCancelDate({ groupId, date, reason, onSuccess }) {
  if (!groupId || !date || !reason.trim()) {
    return notify('Informe grupo, data e motivo para cancelar a data.', 'error')
  }
  confirmCancel({
    title: 'Cancelar data de atendimento',
    message: `Deseja cancelar todos os atendimentos da data ${date} para o grupo selecionado?`,
    warning:
      'Esta ação não poderá ser revertida. Uma data cancelada fica preservada no histórico e não poderá ser recriada.',
    confirmLabel: 'Sim, cancelar data',
    run: () =>
      runAction(
        () => store.cancelarDataGrupo(Number(groupId), { date, reason }, { signal: scope.signal }),
        (r) => (r.partial ? 'Data cancelada parcialmente (viagens em andamento preservadas).' : 'Data cancelada.'),
        'Erro ao cancelar data.',
        onSuccess,
      ),
  })
}

function handleCancelDay({ day, reason, onSuccess }) {
  if (!reason.trim()) return notify('Informe o motivo do cancelamento do atendimento.', 'error')
  confirmCancel({
    title: `Cancelar atendimento de ${day.date}`,
    message: `Deseja cancelar o atendimento #${day.id} (${nomeGrupo(day.route_group)})?`,
    warning:
      'Esta ação não poderá ser revertida. O atendimento cancelado não poderá ser recriado para esta data.',
    confirmLabel: 'Sim, cancelar atendimento',
    run: () =>
      runAction(
        () => store.cancelarDiaAtendimento(day.id, reason.trim(), { signal: scope.signal }),
        (r) =>
          r.partial ? 'Atendimento cancelado parcialmente (viagens iniciadas preservadas).' : 'Atendimento cancelado.',
        'Não foi possível cancelar o atendimento.',
        onSuccess,
      ),
  })
}

function handleCancelTravel(travel) {
  confirmCancel({
    title: `Cancelar viagem #${travel.id}`,
    message: `Deseja cancelar a viagem "${nomeServico(travel.service)}"?`,
    warning: 'Esta ação não poderá ser revertida e todos os passageiros alocados serão notificados.',
    confirmLabel: 'Sim, cancelar viagem',
    run: () =>
      runAction(
        () => store.cancelarViagem(travel.id, { signal: scope.signal }),
        'Viagem cancelada.',
        'Não foi possível cancelar a viagem.',
      ),
  })
}

function handleInviteDriver({ travel, driverMembershipId, expiresAt, onSuccess }) {
  if (!driverMembershipId || !expiresAt) {
    return notify('Selecione o motorista substituto e o prazo de expiração do convite.', 'error')
  }
  return runAction(
    () =>
      store.convidarMotoristaViagem(
        travel.id,
        { driverMembershipId: Number(driverMembershipId), expiresAt: new Date(expiresAt).toISOString() },
        { signal: scope.signal },
      ),
    'Convite enviado. O motorista convidado precisa aceitar explicitamente.',
    'Não foi possível convidar o motorista.',
    onSuccess,
  )
}
</script>

<template>
  <div class="operation-tab">
    <BatchHorizonCard
      :grupos="store.grupos"
      :busy="busy"
      @generate-horizon="handleGenerateHorizon"
      @cancel-date="handleCancelDate"
    />

    <BaseCard title="Filtrar Atendimentos por Data">
      <div class="filter-panel">
        <div class="filter-controls">
          <label class="filter-field">
            <span class="filter-label">Grupo</span>
            <select v-model="filtroGrupoId" :disabled="busy || store.dayLoading">
              <option value="">Todos os grupos</option>
              <option v-for="g in store.grupos" :key="g.id" :value="g.id">{{ g.name }}</option>
            </select>
          </label>
          <label class="filter-field">
            <span class="filter-label">Data</span>
            <input v-model="filtroData" type="date" :disabled="busy || store.dayLoading" />
          </label>
          <div class="filter-action">
            <BaseButton size="sm" :disabled="busy || store.dayLoading" @click="consultarOperacao">
              Atualizar consulta
            </BaseButton>
          </div>
        </div>

        <div class="filter-chips" role="tablist" aria-label="Filtrar atendimentos por situação">
          <button
            v-for="opt in [
              { id: 'em_andamento', label: 'Em andamento' },
              { id: 'encerradas', label: 'Encerradas' },
              { id: 'canceladas', label: 'Canceladas' },
              { id: 'todas', label: `Todas (${store.diasAtendimento.length})` },
            ]"
            :key="opt.id"
            type="button"
            role="tab"
            :aria-selected="filtroStatusDia === opt.id"
            :class="['filter-chip', { active: filtroStatusDia === opt.id }]"
            @click="filtroStatusDia = opt.id"
          >
            {{ opt.label }}
          </button>
        </div>
      </div>
    </BaseCard>

    <ChangeRequestsCard
      :requests="store.pedidosAlteracao"
      :service-label="nomeServico"
      :busy="busy"
      @decide="({ req, action, reason }) =>
        runAction(
          () => store.decidirPedidoAlteracao(req.id, action, reason.trim(), { signal: scope.signal }),
          action === 'approve'
            ? 'Pedido aprovado e em preparação de cálculo.'
            : 'Pedido recusado. A escolha e a alocação anteriores foram preservadas.',
          'Não foi possível decidir o pedido.',
        )"
      @apply="(req) =>
        runAction(
          () => store.aplicarPedidoAlteracao(req.id, { signal: scope.signal }),
          'Alteração na prorrogação aplicada às viagens após cálculo válido.',
          'Não foi possível aplicar o pedido.',
        )"
    />

    <EmptyState v-if="store.dayLoading" loading description="Carregando atendimentos e viagens..." />
    <EmptyState
      v-else-if="!diasAtendimentoFiltrados.length"
      icon="mdi-calendar-remove-outline"
      description="Nenhum dia de atendimento encontrado para os filtros informados."
    />

    <ServiceDayCard
      v-for="(day, index) in diasAtendimentoFiltrados"
      :key="day.id"
      :day="day"
      :group-name="nomeGrupo(day.route_group)"
      :resumo="resumoRespostasDia(day.id)"
      :travels-count="viagensDoDia(day.id).length"
      :busy="busy"
      :default-expanded="index === 0 && filtroStatusDia === 'em_andamento'"
      @close-window="
        runAction(
          () => store.fecharDiaAtendimento(day.id, { signal: scope.signal }),
          'Janela normal encerrada e alocações preparadas.',
          'Não foi possível preparar alocações deste dia.',
        )
      "
      @revise="
        runAction(
          () => store.revisarDiaAtendimento(day.id, day.revision, { signal: scope.signal }),
          (res) => `Atendimento revisado para revisão ${res.revision}.`,
          'Não foi possível revisar o atendimento.',
        )
      "
      @cancel="handleCancelDay"
    >
      <p v-if="!viagensDoDia(day.id).length" class="sub-meta">Nenhuma viagem gerada para este atendimento.</p>
      <TravelOperationCard
        v-for="travel in viagensDoDia(day.id)"
        :key="travel.id"
        :travel="travel"
        :service-name="nomeServico(travel.service)"
        :day-window="day.window"
        :participants-count="participacoesDaViagem(travel.id)"
        :snapshot="snapshotDaViagem(travel)"
        :job="jobDoSnapshot(travel)"
        :veiculos-ativos="veiculosAtivos"
        :motoristas-ativos="motoristasAtivos"
        :busy="busy"
        @open-calculate="calcTravelId = travel.id"
        @publish="
          runAction(
            () => store.publicarViagem(travel.id, travel.revision, { signal: scope.signal }),
            (res) => `Viagem #${travel.id} publicada na revisão ${res.revision}.`,
            'Não foi possível publicar a viagem.',
          )
        "
        @cancel="handleCancelTravel(travel)"
        @assign-vehicle="({ travel: t, vehicleId, onSuccess }) =>
          runAction(
            () => store.designarVeiculoViagem(t.id, Number(vehicleId), { signal: scope.signal }),
            'Veículo substituído. Recalcule e republique a revisão da viagem.',
            'Não foi possível substituir o veículo.',
            onSuccess,
          )"
        @invite-driver="handleInviteDriver"
      />
    </ServiceDayCard>

    <RouteCalculationModal
      :open="Boolean(calcTravel)"
      :travel="calcTravel"
      :service-name="calcTravel ? nomeServico(calcTravel.service) : ''"
      :origin-point="originPointForTravel(calcTravel)"
      :destination-point="destinationPointForTravel(calcTravel)"
      :participants="calcParticipants"
      :snapshot="calcSnapshot"
      :job="calcJob"
      :busy="busy"
      @close="calcTravelId = null"
      @calculate="
        (t) =>
          runAction(
            () => store.calcularViagem(t.id, t.revision, { signal: scope.signal }),
            'Cálculo de percurso iniciado. O trajeto aparecerá no mapa automaticamente.',
            'Não foi possível solicitar o cálculo.',
          )
      "
      @publish="
        (t) =>
          runAction(
            () => store.publicarViagem(t.id, t.revision, { signal: scope.signal }),
            'Viagem publicada com sucesso.',
            'Não foi possível publicar a viagem.',
            () => {
              calcTravelId = null
            },
          )
      "
    />

    <ConfirmDialog
      :open="Boolean(pendingCancel)"
      :title="pendingCancel?.title || 'Confirmar cancelamento'"
      :message="pendingCancel?.message || ''"
      :warning="pendingCancel?.warning || ''"
      :confirm-label="pendingCancel?.confirmLabel || 'Confirmar'"
      :busy="busy"
      @cancel="pendingCancel = null"
      @confirm="executePendingCancel"
    />
  </div>
</template>

<style lang="scss" scoped>
.operation-tab {
  display: flex;
  flex-direction: column;
  gap: $space-4;
}

.filter-panel {
  display: flex;
  flex-direction: column;
  gap: $space-4;
}

.filter-controls {
  display: grid;
  grid-template-columns: 1fr;
  gap: $space-3;
  align-items: end;

  @include from($bp-sm) {
    grid-template-columns: minmax(200px, 1.4fr) minmax(170px, 1fr) auto;
  }
}

.filter-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;

  input,
  select {
    width: 100%;
    padding: 10px $space-3;
    border-radius: $radius-md;
    background: var(--color-surface);
    outline: 1.5px solid var(--border);
    outline-offset: -1.5px;
    color: var(--text);
    font-size: $text-sm;
    transition: outline-color $duration-normal $ease-fluid;

    &:focus,
    &:focus-visible {
      outline: 2px solid var(--primary);
      outline-offset: -2px;
    }
  }
}

.filter-label {
  font-size: $text-xs;
  font-weight: $font-semibold;
  color: var(--primary);
}

.filter-action {
  display: flex;
  justify-content: flex-end;
}

.filter-chips {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;
  padding-top: $space-3;
  border-top: 1px solid var(--border);
}

.filter-chip {
  @include filter-chip;
}

.sub-meta {
  font-size: $text-xs;
  color: var(--text-muted);
}
</style>
