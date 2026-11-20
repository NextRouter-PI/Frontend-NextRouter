<script setup>
import { computed, ref, shallowRef } from 'vue'
import { SERVICE_DIRECTIONS } from '@/constants'
import { formatDateTimeBr } from '@/utils/formatters'
import { useRotasStore } from '@/stores/useRotasStore'
import { useAccountScope } from '@/composables/useAccountScope'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import StatusBanner from '@/components/ui/StatusBanner.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import RouteMapSnapshot from '@/features/transport/components/RouteMapSnapshot.vue'

const emit = defineEmits(['toast'])

const store = useRotasStore()
const scope = useAccountScope()

const busy = shallowRef(false)
const filtroGrupoId = shallowRef('')
const filtroData = shallowRef('')
const filtroStatusDia = shallowRef('em_andamento')

const gerarForm = ref({ groupId: '', start_date: '', horizon_days: '', batch_size: '' })
const datasExcluidas = ref([])
const cancelarDataForm = ref({ groupId: '', date: '', reason: '' })
const motivoCancelamentoDia = ref({})
const motivoDecisaoPedido = ref({})
const veiculoSubstituto = ref({})
const conviteMotorista = ref({})
const mapaAberto = ref({})

const tomorrowIso = computed(() => {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
})

const datasPrevistasLote = computed(() => {
  const { start_date, horizon_days, batch_size } = gerarForm.value
  const total = Math.min(Number(horizon_days) || 0, Number(batch_size) || 0, 31)
  if (!start_date || total < 1) return []
  const base = new Date(`${start_date}T12:00:00`)
  if (Number.isNaN(base.getTime())) return []
  const dias = []
  for (let i = 0; i < total; i++) {
    const d = new Date(base)
    d.setDate(base.getDate() + i)
    const iso = d.toISOString().slice(0, 10)
    const label = d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })
    dias.push({ iso, label })
  }
  return dias
})

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

function toggleExcluirData(iso) {
  datasExcluidas.value = datasExcluidas.value.includes(iso)
    ? datasExcluidas.value.filter((d) => d !== iso)
    : [...datasExcluidas.value, iso]
}

function toggleMapa(travelId) {
  mapaAberto.value[travelId] = !mapaAberto.value[travelId]
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
    if (!idaAtiva && !voltaAtiva) {
      negativas++
    } else {
      if (idaAtiva) comIda++
      if (voltaAtiva) comRetorno++
    }
  }
  return { total: list.length, semResposta, negativas, comIda, comRetorno }
}

function participacoesDaViagem(travelId) {
  return store.participacoesViagem.filter((p) => p.travel === travelId)
}

function snapshotDaViagem(snapshotId) {
  return snapshotId ? store.snapshotsViagem.find((s) => s.id === snapshotId) || null : null
}

function jobDoSnapshot(snapshotId) {
  return snapshotId ? store.jobsCalculo.find((j) => j.snapshot === snapshotId) || null : null
}

function getInviteDraft(travelId) {
  if (!conviteMotorista.value[travelId]) {
    conviteMotorista.value[travelId] = { driverMembershipId: '', expiresAt: '' }
  }
  return conviteMotorista.value[travelId]
}

async function consultarOperacao() {
  if (!scope.current() || busy.value) return
  await store.fetchOperacaoDatada(
    {
      route_group: filtroGrupoId.value || undefined,
      date: filtroData.value || undefined,
    },
    { signal: scope.signal },
  )
}

async function runAction(fn, onSuccessMsg, onErrorMsg) {
  if (!scope.current() || busy.value) return null
  busy.value = true
  const res = await fn()
  if (!scope.current()) return null
  busy.value = false
  if (res) {
    if (onSuccessMsg) notify(typeof onSuccessMsg === 'function' ? onSuccessMsg(res) : onSuccessMsg)
    await consultarOperacao()
    return res
  }
  notify(store.error || onErrorMsg, 'error')
  return null
}

async function gerarHorizonte() {
  const { groupId, start_date, horizon_days, batch_size } = gerarForm.value
  if (!groupId || !start_date || !horizon_days || !batch_size) {
    notify('Preencha grupo, data inicial, horizonte (1–31) e lote (1–31).', 'error')
    return
  }
  if (start_date < tomorrowIso.value) {
    notify(
      'Não é permitido aplicar atendimentos no dia atual nem em datas passadas. Escolha a partir de amanhã.',
      'error',
    )
    return
  }
  const validExcluded = datasExcluidas.value.filter((iso) =>
    datasPrevistasLote.value.some((d) => d.iso === iso),
  )
  const dias = await runAction(
    () =>
      store.gerarHorizonte(
        Number(groupId),
        {
          start_date,
          horizon_days: Number(horizon_days),
          batch_size: Number(batch_size),
          excluded_dates: validExcluded,
        },
        { signal: scope.signal },
      ),
    (res) => `Atendimentos aplicados (${res.length} dia(s) gerado(s)).`,
    'Erro ao aplicar atendimentos.',
  )
  if (dias) datasExcluidas.value = []
}

async function cancelarDataAntesDeGerar() {
  const { groupId, date, reason } = cancelarDataForm.value
  if (!groupId || !date || !reason.trim()) {
    notify('Informe grupo, data e motivo para cancelar a data.', 'error')
    return
  }
  const res = await runAction(
    () => store.cancelarDataGrupo(Number(groupId), { date, reason }, { signal: scope.signal }),
    (r) =>
      r.partial
        ? 'Data cancelada parcialmente (viagens em andamento preservadas).'
        : 'Data cancelada.',
    'Erro ao cancelar data.',
  )
  if (res) cancelarDataForm.value = { groupId: '', date: '', reason: '' }
}

function fecharJanelaDia(day) {
  return runAction(
    () => store.fecharDiaAtendimento(day.id, { signal: scope.signal }),
    'Janela normal encerrada e alocações preparadas.',
    'Não foi possível preparar alocações deste dia.',
  )
}

function revisarDia(day) {
  return runAction(
    () => store.revisarDiaAtendimento(day.id, day.revision, { signal: scope.signal }),
    (res) => `Atendimento revisado para revisão ${res.revision}.`,
    'Não foi possível revisar o atendimento.',
  )
}

async function cancelarDia(day) {
  const reason = (motivoCancelamentoDia.value[day.id] || '').trim()
  if (!reason) {
    notify('Informe o motivo do cancelamento do atendimento.', 'error')
    return
  }
  const res = await runAction(
    () => store.cancelarDiaAtendimento(day.id, reason, { signal: scope.signal }),
    (r) =>
      r.partial
        ? 'Atendimento cancelado parcialmente (viagens iniciadas preservadas).'
        : 'Atendimento cancelado.',
    'Não foi possível cancelar o atendimento.',
  )
  if (res) motivoCancelamentoDia.value[day.id] = ''
}

function solicitarCalculo(travel) {
  return runAction(
    () => store.calcularViagem(travel.id, travel.revision, { signal: scope.signal }),
    'Cálculo de percurso enfileirado (202). O cálculo não publica a viagem automaticamente.',
    'Não foi possível solicitar o cálculo.',
  )
}

function publicarViagemPronta(travel) {
  return runAction(
    () => store.publicarViagem(travel.id, travel.revision, { signal: scope.signal }),
    (res) => `Viagem #${travel.id} publicada na revisão ${res.revision}.`,
    'Não foi possível publicar a viagem.',
  )
}

function cancelarViagemAgendada(travel) {
  return runAction(
    () => store.cancelarViagem(travel.id, { signal: scope.signal }),
    `Viagem #${travel.id} cancelada.`,
    'Não foi possível cancelar a viagem.',
  )
}

async function trocarVeiculoViagem(travel) {
  const vehicleId = veiculoSubstituto.value[travel.id]
  if (!vehicleId) return
  const res = await runAction(
    () => store.designarVeiculoViagem(travel.id, Number(vehicleId), { signal: scope.signal }),
    'Veículo substituído. Recalcule e republique a revisão da viagem.',
    'Não foi possível substituir o veículo.',
  )
  if (res) veiculoSubstituto.value[travel.id] = ''
}

async function enviarConviteMotorista(travel) {
  const draft = conviteMotorista.value[travel.id]
  if (!draft?.driverMembershipId || !draft?.expiresAt) {
    notify('Selecione o motorista substituto e o prazo de expiração do convite.', 'error')
    return
  }
  const res = await runAction(
    () =>
      store.convidarMotoristaViagem(
        travel.id,
        {
          driverMembershipId: Number(draft.driverMembershipId),
          expiresAt: new Date(draft.expiresAt).toISOString(),
        },
        { signal: scope.signal },
      ),
    'Convite enviado. O motorista convidado precisa aceitar explicitamente.',
    'Não foi possível convidar o motorista.',
  )
  if (res) conviteMotorista.value[travel.id] = { driverMembershipId: '', expiresAt: '' }
}

function decidirPedido(req, action) {
  const reason = (motivoDecisaoPedido.value[req.id] || '').trim()
  return runAction(
    () => store.decidirPedidoAlteracao(req.id, action, reason, { signal: scope.signal }),
    action === 'approve'
      ? 'Pedido aprovado e em preparação de cálculo. A escolha anterior permanece até aplicar após o cálculo.'
      : 'Pedido recusado. A escolha e a alocação anteriores foram preservadas.',
    'Não foi possível decidir o pedido.',
  )
}

function aplicarPedido(req) {
  return runAction(
    () => store.aplicarPedidoAlteracao(req.id, { signal: scope.signal }),
    'Alteração na prorrogação aplicada às viagens após cálculo válido.',
    'Não foi possível aplicar o pedido.',
  )
}
</script>

<template>
  <div class="operation-tab">
    <BaseCard
      title="Aplicar Atendimentos em Lote ou Cancelar Data"
      subtitle="Aplique atendimentos para dias futuros (até 31 dias por lote). Clique nas datas previstas abaixo para excluir feriados ou folgas antes de aplicar, ou cancele uma data específica."
    >
      <form class="op-grid" @submit.prevent="gerarHorizonte">
        <select v-model="gerarForm.groupId" required :disabled="busy">
          <option value="">Grupo para aplicar atendimentos...</option>
          <option v-for="g in store.grupos" :key="g.id" :value="g.id">{{ g.name }}</option>
        </select>
        <input
          v-model="gerarForm.start_date"
          type="date"
          :min="tomorrowIso"
          required
          :disabled="busy"
          aria-label="Data inicial (a partir de amanhã)"
        />
        <input
          v-model="gerarForm.horizon_days"
          type="number"
          min="1"
          max="31"
          placeholder="Dias posteriores (1-31)"
          required
          :disabled="busy"
        />
        <input
          v-model="gerarForm.batch_size"
          type="number"
          min="1"
          max="31"
          placeholder="Lote (1-31)"
          required
          :disabled="busy"
        />
        <BaseButton type="submit" size="sm" :disabled="busy">Aplicar atendimentos</BaseButton>
      </form>

      <div v-if="datasPrevistasLote.length" class="exclude-dates-box">
        <p class="exclude-hint">
          Clique em uma data para <strong>excluir</strong> da aplicação (ex.: feriados):
          <span v-if="datasExcluidas.length">({{ datasExcluidas.length }} excluída(s))</span>
        </p>
        <div class="exclude-chips">
          <button
            v-for="item in datasPrevistasLote"
            :key="item.iso"
            type="button"
            :class="['exclude-chip', { excluded: datasExcluidas.includes(item.iso) }]"
            :disabled="busy"
            @click="toggleExcluirData(item.iso)"
          >
            {{ item.label }}
          </button>
        </div>
      </div>

      <form class="op-grid" @submit.prevent="cancelarDataAntesDeGerar">
        <select v-model="cancelarDataForm.groupId" required :disabled="busy">
          <option value="">Grupo para cancelar data...</option>
          <option v-for="g in store.grupos" :key="g.id" :value="g.id">{{ g.name }}</option>
        </select>
        <input v-model="cancelarDataForm.date" type="date" required :disabled="busy" aria-label="Data a cancelar" />
        <input
          v-model="cancelarDataForm.reason"
          placeholder="Motivo do cancelamento (até 500 caracteres)"
          maxlength="500"
          required
          :disabled="busy"
        />
        <BaseButton type="submit" variant="outline" size="sm" :disabled="busy">Cancelar data</BaseButton>
      </form>
    </BaseCard>

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

    <BaseCard
      v-if="store.pedidosAlteracao.length"
      :title="`Pedidos na Prorrogação (${store.pedidosAlteracao.length})`"
      subtitle="Aprovar um pedido reserva vaga e inicia o cálculo, mantendo a escolha e a alocação anteriores até que o cálculo termine e a empresa clique em Aplicar."
    >
      <div class="item-stack">
        <div v-for="req in store.pedidosAlteracao" :key="req.id" class="sub-box">
          <p class="sub-title">
            Pedido #{{ req.id }} · Trecho:
            <strong>{{ req.leg === SERVICE_DIRECTIONS.OUTBOUND ? 'Ida' : 'Retorno' }}</strong> ·
            Serviço proposto: {{ nomeServico(req.proposed_service) }}
          </p>
          <p class="sub-meta">
            Decisão: <strong>{{ req.status }}</strong> · Aplicação:
            <strong>{{ req.application || 'não iniciada' }}</strong>
            <span v-if="req.reason"> · Motivo: {{ req.reason }}</span>
          </p>
          <div v-if="req.status === 'pending'" class="op-grid">
            <input
              v-model="motivoDecisaoPedido[req.id]"
              placeholder="Motivo opcional (até 500 caracteres)"
              maxlength="500"
              :disabled="busy"
            />
            <BaseButton size="sm" :disabled="busy" @click="decidirPedido(req, 'approve')">
              Aprovar e calcular
            </BaseButton>
            <BaseButton variant="outline" size="sm" :disabled="busy" @click="decidirPedido(req, 'reject')">
              Recusar
            </BaseButton>
          </div>
          <div v-else-if="req.status === 'approved' && req.application === 'preparing'" class="op-grid">
            <BaseButton size="sm" :disabled="busy" @click="aplicarPedido(req)">
              Aplicar alteração após cálculo pronto
            </BaseButton>
          </div>
        </div>
      </div>
    </BaseCard>

    <EmptyState v-if="store.dayLoading" loading description="Carregando atendimentos e viagens..." />
    <EmptyState
      v-else-if="!diasAtendimentoFiltrados.length"
      icon="mdi-calendar-remove-outline"
      description="Nenhum dia de atendimento encontrado para os filtros informados."
    />

    <BaseCard
      v-for="day in diasAtendimentoFiltrados"
      :key="day.id"
      :title="`${day.date} · ${nomeGrupo(day.route_group)} (Dia #${day.id})`"
      :subtitle="`Janela: ${day.window} · Revisão: ${day.revision}${day.canceled_at ? ` · Cancelado em ${formatDateTimeBr(day.canceled_at)}` : ''}`"
    >
      <template v-if="!day.canceled_at" #actions>
        <BaseButton
          v-if="day.window === 'closed' || day.window === 'extension'"
          size="sm"
          :disabled="busy"
          @click="fecharJanelaDia(day)"
        >
          Consolidar respostas e alocar
        </BaseButton>
        <BaseButton variant="outline" size="sm" :disabled="busy" @click="revisarDia(day)">
          Revisar atendimento
        </BaseButton>
      </template>

      <StatusBanner
        v-if="day.issues?.length"
        variant="danger"
        :message="`Pendências do atendimento: ${day.issues.join(' · ')}`"
      />

      <div class="resumo-demanda">
        <span>Elegíveis: <strong>{{ resumoRespostasDia(day.id).total }}</strong></span>
        <span>Com ida: <strong>{{ resumoRespostasDia(day.id).comIda }}</strong></span>
        <span>Com retorno: <strong>{{ resumoRespostasDia(day.id).comRetorno }}</strong></span>
        <span>Negativas explícitas: <strong>{{ resumoRespostasDia(day.id).negativas }}</strong></span>
        <span>Sem resposta: <strong>{{ resumoRespostasDia(day.id).semResposta }}</strong></span>
      </div>

      <div v-if="!day.canceled_at" class="op-grid">
        <input
          v-model="motivoCancelamentoDia[day.id]"
          placeholder="Motivo para cancelar este atendimento..."
          maxlength="500"
          :disabled="busy"
        />
        <BaseButton variant="outline" size="sm" :disabled="busy" @click="cancelarDia(day)">
          Cancelar atendimento
        </BaseButton>
      </div>

      <div class="item-stack">
        <h3 class="travels-heading">Viagens do Atendimento ({{ viagensDoDia(day.id).length }})</h3>
        <p v-if="!viagensDoDia(day.id).length" class="sub-meta">Nenhuma viagem gerada para este atendimento.</p>

        <div v-for="travel in viagensDoDia(day.id)" :key="travel.id" class="sub-box">
          <div class="travel-header">
            <div>
              <strong>Viagem #{{ travel.id }} · {{ nomeServico(travel.service) }}</strong>
              <p class="sub-meta">
                Execução: <strong>{{ travel.status }}</strong> · Planejamento:
                <strong>{{ travel.planning_status }}</strong> · Revisão:
                <strong>{{ travel.revision }}</strong> · Publicada:
                <strong>{{ travel.published_revision ?? 'nenhuma' }}</strong> · Vigente:
                <strong>{{ travel.publication_current ? 'Sim' : 'Não' }}</strong>
              </p>
              <p class="sub-meta">
                Início: {{ formatDateTimeBr(travel.planned_start) }} · Fim:
                {{ formatDateTimeBr(travel.planned_end) }} · Alocados:
                {{ participacoesDaViagem(travel.id).length }}
              </p>
            </div>
            <div v-if="travel.status === 'scheduled'" class="inline-actions">
              <BaseButton variant="outline" size="sm" :disabled="busy" @click="solicitarCalculo(travel)">
                Solicitar cálculo
              </BaseButton>
              <BaseButton
                size="sm"
                :disabled="busy || travel.planning_status !== 'ready'"
                @click="publicarViagemPronta(travel)"
              >
                Publicar viagem
              </BaseButton>
              <BaseButton variant="outline" size="sm" :disabled="busy" @click="cancelarViagemAgendada(travel)">
                Cancelar viagem
              </BaseButton>
            </div>
          </div>

          <div v-if="travel.current_snapshot" class="sub-meta snapshot-row">
            Snapshot atual #{{ travel.current_snapshot }}:
            <span v-if="snapshotDaViagem(travel.current_snapshot)">
              estado <strong>{{ snapshotDaViagem(travel.current_snapshot).state }}</strong>
              <template v-if="snapshotDaViagem(travel.current_snapshot).distance_meters != null">
                · {{ (snapshotDaViagem(travel.current_snapshot).distance_meters / 1000).toFixed(1) }} km ·
                {{ Math.round((snapshotDaViagem(travel.current_snapshot).duration_seconds || 0) / 60) }} min
              </template>
            </span>
            <span v-if="jobDoSnapshot(travel.current_snapshot)">
              · Job #{{ jobDoSnapshot(travel.current_snapshot).id }}:
              <strong>{{ jobDoSnapshot(travel.current_snapshot).status }}</strong>
              (tentativas: {{ jobDoSnapshot(travel.current_snapshot).attempts }})
              <strong v-if="jobDoSnapshot(travel.current_snapshot).error" class="error-inline">
                · erro: {{ jobDoSnapshot(travel.current_snapshot).error }}
              </strong>
            </span>
            <BaseButton
              v-if="snapshotDaViagem(travel.current_snapshot)"
              variant="outline"
              size="sm"
              @click="toggleMapa(travel.id)"
            >
              {{ mapaAberto[travel.id] ? 'Ocultar mapa' : 'Ver traçado no mapa' }}
            </BaseButton>
            <RouteMapSnapshot
              v-if="mapaAberto[travel.id] && snapshotDaViagem(travel.current_snapshot)"
              :snapshot="snapshotDaViagem(travel.current_snapshot)"
              title="Prévia do Traçado Calculado"
              height="240px"
            />
          </div>

          <div v-if="travel.status === 'scheduled'" class="sub-actions">
            <div class="op-grid">
              <select v-model="veiculoSubstituto[travel.id]" :disabled="busy">
                <option value="">Substituir veículo...</option>
                <option v-for="v in veiculosAtivos" :key="v.id" :value="v.id">
                  {{ v.plate }} ({{ v.capacity }} lug.)
                </option>
              </select>
              <BaseButton variant="outline" size="sm" :disabled="busy" @click="trocarVeiculoViagem(travel)">
                Designar veículo
              </BaseButton>
            </div>

            <div class="op-grid">
              <select v-model="getInviteDraft(travel.id).driverMembershipId" :disabled="busy">
                <option value="">Convidar motorista substituto...</option>
                <option v-for="m in motoristasAtivos" :key="m.id" :value="m.id">
                  {{ m.applicant_name }} (vínculo #{{ m.id }})
                </option>
              </select>
              <input
                v-model="getInviteDraft(travel.id).expiresAt"
                type="datetime-local"
                :disabled="busy"
                aria-label="Prazo do convite"
              />
              <BaseButton variant="outline" size="sm" :disabled="busy" @click="enviarConviteMotorista(travel)">
                Convidar motorista
              </BaseButton>
            </div>
          </div>
        </div>
      </div>
    </BaseCard>
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

    &:focus {
      outline: 2px solid var(--primary);
      outline-offset: -2px;
    }
  }
}

.exclude-dates-box {
  display: flex;
  flex-direction: column;
  gap: $space-2;
  padding: $space-3;
  border-radius: $radius-md;
  background: var(--altbg);
}

.exclude-hint {
  font-size: $text-xs;
  color: var(--text-muted);
}

.exclude-chips,
.filter-chips,
.inline-actions {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;
}

.exclude-chip,
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

  &.excluded {
    background: var(--danger-soft);
    color: var(--danger);
    outline-color: var(--danger);
    text-decoration: line-through;
  }
}

.resumo-demanda {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2 $space-4;
  padding: $space-3;
  border-radius: $radius-md;
  background: var(--altbg);
  font-size: $text-sm;
}

.item-stack,
.sub-actions {
  display: flex;
  flex-direction: column;
  gap: $space-3;
}

.travels-heading {
  font-size: $text-base;
  font-weight: $font-bold;
}

.sub-box {
  padding: $space-4;
  border-radius: $radius-md;
  background: var(--altbg);
  border: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: $space-3;
}

.travel-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: $space-3;
}

.sub-title {
  font-size: $text-md;
}

.sub-meta {
  font-size: $text-xs;
  color: var(--text-muted);
  line-height: 1.5;

  strong {
    color: var(--text);
  }
}

.snapshot-row {
  display: flex;
  flex-direction: column;
  gap: $space-2;
}

.error-inline {
  color: var(--danger);
}
</style>
