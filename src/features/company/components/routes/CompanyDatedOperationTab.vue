<script setup>
import { computed, shallowRef } from 'vue'
import { SERVICE_DIRECTIONS } from '@/constants'
import { useRotasStore } from '@/stores/useRotasStore'
import { useAccountScope } from '@/composables/useAccountScope'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import BatchHorizonCard from './BatchHorizonCard.vue'
import ChangeRequestsCard from './ChangeRequestsCard.vue'
import ServiceDayCard from './ServiceDayCard.vue'
import TravelOperationCard from './TravelOperationCard.vue'

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

function participacoesDaViagem(travelId) {
  return store.participacoesViagem.filter((p) => p.travel === travelId).length
}

function snapshotDaViagem(snapshotId) {
  return snapshotId ? store.snapshotsViagem.find((s) => s.id === snapshotId) || null : null
}

function jobDoSnapshot(snapshotId) {
  return snapshotId ? store.jobsCalculo.find((j) => j.snapshot === snapshotId) || null : null
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
  return runAction(
    () => store.cancelarDataGrupo(Number(groupId), { date, reason }, { signal: scope.signal }),
    (r) => (r.partial ? 'Data cancelada parcialmente (viagens em andamento preservadas).' : 'Data cancelada.'),
    'Erro ao cancelar data.',
    onSuccess,
  )
}

function handleCancelDay({ day, reason, onSuccess }) {
  if (!reason.trim()) return notify('Informe o motivo do cancelamento do atendimento.', 'error')
  return runAction(
    () => store.cancelarDiaAtendimento(day.id, reason.trim(), { signal: scope.signal }),
    (r) =>
      r.partial ? 'Atendimento cancelado parcialmente (viagens iniciadas preservadas).' : 'Atendimento cancelado.',
    'Não foi possível cancelar o atendimento.',
    onSuccess,
  )
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
      <div class="op-grid">
        <select v-model="filtroGrupoId" :disabled="busy || store.dayLoading">
          <option value="">Todos os grupos</option>
          <option v-for="g in store.grupos" :key="g.id" :value="g.id">{{ g.name }}</option>
        </select>
        <input v-model="filtroData" type="date" :disabled="busy || store.dayLoading" />
        <BaseButton size="sm" :disabled="busy || store.dayLoading" @click="consultarOperacao">
          Atualizar consulta
        </BaseButton>
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
      v-for="day in diasAtendimentoFiltrados"
      :key="day.id"
      :day="day"
      :group-name="nomeGrupo(day.route_group)"
      :resumo="resumoRespostasDia(day.id)"
      :travels-count="viagensDoDia(day.id).length"
      :busy="busy"
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
        :participants-count="participacoesDaViagem(travel.id)"
        :snapshot="snapshotDaViagem(travel.current_snapshot)"
        :job="jobDoSnapshot(travel.current_snapshot)"
        :veiculos-ativos="veiculosAtivos"
        :motoristas-ativos="motoristasAtivos"
        :busy="busy"
        @calculate="
          runAction(
            () => store.calcularViagem(travel.id, travel.revision, { signal: scope.signal }),
            'Cálculo de percurso enfileirado (202). O cálculo não publica a viagem automaticamente.',
            'Não foi possível solicitar o cálculo.',
          )
        "
        @publish="
          runAction(
            () => store.publicarViagem(travel.id, travel.revision, { signal: scope.signal }),
            (res) => `Viagem #${travel.id} publicada na revisão ${res.revision}.`,
            'Não foi possível publicar a viagem.',
          )
        "
        @cancel="
          runAction(
            () => store.cancelarViagem(travel.id, { signal: scope.signal }),
            `Viagem #${travel.id} cancelada.`,
            'Não foi possível cancelar a viagem.',
          )
        "
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
  </div>
</template>

<style lang="scss" scoped>
.operation-tab {
  display: flex;
  flex-direction: column;
  gap: $space-4;
}

.op-grid {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;
  align-items: center;

  input,
  select {
    flex: 1 1 160px;
    padding: 9px $space-3;
    border-radius: $radius-sm;
    background: var(--color-surface);
    outline: 1.5px solid var(--border);
    outline-offset: -1.5px;
    color: var(--text);
    font-size: $text-sm;
  }
}

.filter-chips {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;
}

.filter-chip {
  padding: $space-1 $space-3;
  border-radius: $radius-pill;
  background: var(--color-surface);
  color: var(--text);
  outline: 1.5px solid var(--border);
  outline-offset: -1.5px;
  font-size: $text-xs;
  font-weight: $font-semibold;

  &.active {
    background: var(--primary);
    color: var(--color-on-primary);
    outline-color: var(--primary);
  }
}

.sub-meta {
  font-size: $text-xs;
  color: var(--text-muted);
}
</style>
