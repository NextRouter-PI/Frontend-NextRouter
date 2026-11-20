<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRotasStore, WEEKDAY_OPTIONS } from '@/stores/useRotasStore'
import { useAccountScope } from '@/composables/useAccountScope'
import { useRouter, useRoute } from 'vue-router'
import HabitualRouteBuilder from '@/components/transport/HabitualRouteBuilder.vue'

const router = useRouter()
const route = useRoute()
const store = useRotasStore()
const scope = useAccountScope()

const id = Number(route.params.id)
const secaoAtiva = ref('config') // 'config' | 'rotas'
const carregando = ref(true)
const salvando = ref(false)
const erro = ref('')
const aviso = ref('')

const grupoForm = ref({
  name: '',
  destinationId: '',
})

const policyForm = ref({
  opens_days_before: '',
  opens_time: '',
  normal_days_before: '',
  normal_time: '',
  extension_days_before: '',
  extension_time: '',
})
const salvandoPolitica = ref(false)
const erroPolitica = ref('')
const avisoPolitica = ref('')

const editandoServicoId = ref(null)
const salvandoServico = ref(false)
const erroServico = ref('')
const avisoServico = ref('')
const servicoForm = ref(emptyService())
const paradasSelecionadas = ref([])
const paradaParaAdicionar = ref('')

const atribuicaoForm = ref({
  membershipId: '',
})
const destinoTrocaGrupo = ref({})
const salvandoAtribuicao = ref(false)
const erroAtribuicao = ref('')

const autorizacaoSelecionada = ref(null) // groupMembershipId
const servicosAutorizadosDraft = ref([])
const idaHabitualDraft = ref('')
const salvandoAutorizacao = ref(false)
const erroAutorizacao = ref('')

const agendaStatus = ref(null)
const agendaForm = ref({
  enabled: false,
  horizon_days: '',
  batch_size: '',
  interval_seconds: '',
  next_run_at: '',
})
const salvandoAgenda = ref(false)
const erroAgenda = ref('')
const avisoAgenda = ref('')

function emptyService() {
  return {
    name: '',
    direction: 'outbound',
    weekdays: 0,
    target_time: '',
    valid_from: '',
    valid_until: '',
    driver_membership_id: '',
    vehicle_id: '',
    origin_id: '',
    destination_id: '',
    planned_duration: '',
    turnaround_duration: '',
  }
}

const grupoAtual = computed(() => store.grupos.find((g) => g.id === id) || null)
const motoristasAtivos = computed(() => store.vinculosAtivos.filter((m) => m.driver != null))
const passageirosAtivos = computed(() => store.vinculosAtivos.filter((m) => m.passenger != null))
const veiculosAtivos = computed(() => store.todosVeiculos.filter((v) => v.status === 'active'))

async function carregarTudo() {
  carregando.value = true
  await store.fetchRotas({ signal: scope.signal })
  if (!scope.current()) return
  const g = grupoAtual.value
  if (!g) {
    erro.value = 'Grupo de atendimento não encontrado.'
    carregando.value = false
    return
  }
  grupoForm.value = {
    name: g.name,
    destinationId: g.destinationId,
  }
  if (g.policy) {
    policyForm.value = {
      opens_days_before: String(g.policy.opens_days_before ?? ''),
      opens_time: String(g.policy.opens_time || '').slice(0, 5),
      normal_days_before: String(g.policy.normal_days_before ?? ''),
      normal_time: String(g.policy.normal_time || '').slice(0, 5),
      extension_days_before: g.policy.extension_days_before != null ? String(g.policy.extension_days_before) : '',
      extension_time: g.policy.extension_time ? String(g.policy.extension_time).slice(0, 5) : '',
    }
  }
  const auto = await store.consultarAgendaAutomatica(id, { signal: scope.signal })
  if (!scope.current()) return
  agendaStatus.value = auto
  if (auto) {
    agendaForm.value = {
      enabled: Boolean(auto.enabled),
      horizon_days: String(auto.horizon_days ?? ''),
      batch_size: String(auto.batch_size ?? ''),
      interval_seconds: String(auto.interval_seconds ?? ''),
      next_run_at: auto.next_run_at ? new Date(auto.next_run_at).toISOString().slice(0, 16) : '',
    }
  }
  carregando.value = false
}

onMounted(carregarTudo)

async function salvarGrupo() {
  if (!scope.current() || salvando.value) return
  erro.value = ''
  aviso.value = ''
  salvando.value = true
  const atualizado = await store.atualizarGrupo(
    id,
    { name: grupoForm.value.name, destinationId: Number(grupoForm.value.destinationId) },
    { signal: scope.signal },
  )
  if (!scope.current()) return
  salvando.value = false
  if (atualizado) {
    aviso.value = 'Grupo de atendimento atualizado.'
    await carregarTudo()
  } else {
    erro.value = store.error || 'Erro ao atualizar grupo.'
  }
}

async function salvarPolitica() {
  if (!scope.current() || salvandoPolitica.value) return
  erroPolitica.value = ''
  avisoPolitica.value = ''

  if (
    policyForm.value.opens_days_before === '' ||
    !policyForm.value.opens_time ||
    policyForm.value.normal_days_before === '' ||
    !policyForm.value.normal_time
  ) {
    erroPolitica.value = 'Preencha explicitamente a abertura e o encerramento da janela normal.'
    return
  }

  salvandoPolitica.value = true
  const ok = await store.salvarPolitica(id, policyForm.value, { signal: scope.signal })
  if (!scope.current()) return
  salvandoPolitica.value = false
  if (ok) {
    avisoPolitica.value = 'Política de respostas salva. Vale para novos atendimentos gerados.'
    await carregarTudo()
  } else {
    erroPolitica.value = store.error || 'Erro ao salvar política de respostas.'
  }
}

function toggleWeekday(bit) {
  servicoForm.value.weekdays ^= bit
}

function iniciarEdicaoServico(s) {
  editandoServicoId.value = s.id
  erroServico.value = ''
  avisoServico.value = ''
  servicoForm.value = {
    name: s.name || '',
    direction: s.direction || 'outbound',
    weekdays: Number(s.weekdays) || 0,
    target_time: String(s.target_time || '').slice(0, 5),
    valid_from: s.valid_from || '',
    valid_until: s.valid_until || '',
    driver_membership_id: s.driver_membership ?? '',
    vehicle_id: s.vehicle ?? '',
    origin_id: s.origin ?? '',
    destination_id: s.destination ?? '',
    planned_duration: s.planned_duration || '',
    turnaround_duration: s.turnaround_duration || '',
  }
  paradasSelecionadas.value = Array.isArray(s.point_ids) ? [...s.point_ids] : []
}

function cancelarEdicaoServico() {
  editandoServicoId.value = null
  erroServico.value = ''
  servicoForm.value = emptyService()
  paradasSelecionadas.value = []
}

function adicionarParada() {
  const pid = Number(paradaParaAdicionar.value)
  if (pid && !paradasSelecionadas.value.includes(pid)) {
    paradasSelecionadas.value.push(pid)
  }
  paradaParaAdicionar.value = ''
}

function removerParada(pid) {
  paradasSelecionadas.value = paradasSelecionadas.value.filter((item) => item !== pid)
}

function nomePonto(pid) {
  const p = store.pontosOperacionais.find((item) => item.id === pid)
  return p ? `${p.name} (${p.city}/${p.state})` : `Ponto #${pid}`
}

async function salvarServico() {
  if (!scope.current() || salvandoServico.value) return
  erroServico.value = ''
  avisoServico.value = ''

  if (!servicoForm.value.name.trim() || !servicoForm.value.weekdays || !servicoForm.value.target_time || !servicoForm.value.valid_from) {
    erroServico.value = 'Informe nome, dias da semana, horário-alvo e início de vigência.'
    return
  }

  salvandoServico.value = true
  const payload = {
    ...servicoForm.value,
    route_group_id: id,
  }
  const saved = editandoServicoId.value
    ? await store.atualizarServico(editandoServicoId.value, payload, { signal: scope.signal })
    : await store.criarServico(payload, { signal: scope.signal })

  if (!scope.current()) return
  if (!saved) {
    salvandoServico.value = false
    erroServico.value = store.error || 'Erro ao salvar serviço habitual.'
    return
  }

  const stopsOk = await store.salvarParadasServico(saved.id, paradasSelecionadas.value, { signal: scope.signal })
  if (!scope.current()) return
  salvandoServico.value = false

  if (!stopsOk) {
    erroServico.value = store.error || 'Serviço salvo, mas houve falha ao salvar as paradas habituais.'
    await carregarTudo()
    return
  }

  avisoServico.value = editandoServicoId.value ? 'Serviço habitual atualizado.' : 'Serviço habitual cadastrado.'
  cancelarEdicaoServico()
  await carregarTudo()
}

const outrosGrupos = computed(() => store.grupos.filter((g) => g.id !== id))

async function atribuirPassageiro() {
  if (!scope.current() || salvandoAtribuicao.value || !atribuicaoForm.value.membershipId) return
  erroAtribuicao.value = ''
  salvandoAtribuicao.value = true
  const res = await store.atribuirPassageiroGrupo(
    Number(atribuicaoForm.value.membershipId),
    {
      routeGroupId: id,
      transportPointId: null,
    },
    { signal: scope.signal },
  )
  if (!scope.current()) return
  salvandoAtribuicao.value = false
  if (res) {
    atribuicaoForm.value = { membershipId: '' }
    await carregarTudo()
  } else {
    erroAtribuicao.value = store.error || 'Não foi possível adicionar o passageiro ao grupo.'
  }
}

async function moverPassageiro(member) {
  const targetGroupId = Number(destinoTrocaGrupo.value[member.membership])
  if (!scope.current() || salvandoAtribuicao.value || !targetGroupId || targetGroupId === id) return
  erroAtribuicao.value = ''
  salvandoAtribuicao.value = true
  const res = await store.atribuirPassageiroGrupo(
    Number(member.membership),
    {
      routeGroupId: targetGroupId,
      transportPointId: null,
    },
    { signal: scope.signal },
  )
  if (!scope.current()) return
  salvandoAtribuicao.value = false
  if (res) {
    delete destinoTrocaGrupo.value[member.membership]
    await carregarTudo()
  } else {
    erroAtribuicao.value = store.error || 'Não foi possível trocar o passageiro de grupo.'
  }
}

function abrirAutorizacao(member) {
  autorizacaoSelecionada.value = member.id
  erroAutorizacao.value = ''
  servicosAutorizadosDraft.value = Array.isArray(member.service_ids) ? [...member.service_ids] : []
  idaHabitualDraft.value = member.habitual_outbound_id ?? ''
}

function toggleServicoAutorizado(serviceId) {
  if (servicosAutorizadosDraft.value.includes(serviceId)) {
    servicosAutorizadosDraft.value = servicosAutorizadosDraft.value.filter((s) => s !== serviceId)
    if (Number(idaHabitualDraft.value) === serviceId) idaHabitualDraft.value = ''
  } else {
    servicosAutorizadosDraft.value.push(serviceId)
  }
}

async function salvarAutorizacao() {
  if (!scope.current() || salvandoAutorizacao.value || !autorizacaoSelecionada.value) return
  erroAutorizacao.value = ''
  salvandoAutorizacao.value = true
  const res = await store.autorizarServicosPassageiro(
    autorizacaoSelecionada.value,
    {
      serviceIds: servicosAutorizadosDraft.value,
      habitualOutboundId: idaHabitualDraft.value || null,
    },
    { signal: scope.signal },
  )
  if (!scope.current()) return
  salvandoAutorizacao.value = false
  if (res) {
    autorizacaoSelecionada.value = null
    await carregarTudo()
  } else {
    erroAutorizacao.value = store.error || 'Não foi possível salvar os serviços autorizados.'
  }
}

async function salvarAgenda() {
  if (!scope.current() || salvandoAgenda.value) return
  erroAgenda.value = ''
  avisoAgenda.value = ''

  if (!agendaForm.value.horizon_days || !agendaForm.value.batch_size || !agendaForm.value.interval_seconds || !agendaForm.value.next_run_at) {
    erroAgenda.value = 'Preencha explicitamente horizonte (1–31), lote, intervalo em segundos e próxima execução.'
    return
  }

  salvandoAgenda.value = true
  const nextIso = new Date(agendaForm.value.next_run_at).toISOString()
  const res = await store.salvarAgendaAutomatica(
    id,
    {
      enabled: agendaForm.value.enabled,
      horizon_days: Number(agendaForm.value.horizon_days),
      batch_size: Number(agendaForm.value.batch_size),
      interval_seconds: Number(agendaForm.value.interval_seconds),
      next_run_at: nextIso,
      expected_revision: agendaStatus.value?.revision ?? 0,
    },
    { signal: scope.signal },
  )
  if (!scope.current()) return
  salvandoAgenda.value = false
  if (res) {
    avisoAgenda.value = 'Agenda automática configurada.'
    await carregarTudo()
  } else {
    erroAgenda.value = store.error || 'Não foi possível configurar a agenda automática.'
  }
}
</script>

<template>
  <div class="content">
    <div class="top-bar">
      <button type="button" class="back-button" @click="router.push('/lista')">
        <span class="mdi mdi-arrow-left"></span>
      </button>
      <h1>Configurar Grupo #{{ id }}</h1>
    </div>

    <p v-if="carregando" class="status-message">Carregando configuração do grupo...</p>

    <template v-else-if="grupoAtual">
      <div class="section-tabs" role="tablist" aria-label="Seções do grupo">
        <button
          type="button"
          role="tab"
          :aria-selected="secaoAtiva === 'config'"
          :class="['section-tab', { active: secaoAtiva === 'config' }]"
          @click="secaoAtiva = 'config'"
        >
          1. Configurações do Grupo
        </button>
        <button
          type="button"
          role="tab"
          :aria-selected="secaoAtiva === 'rotas'"
          :class="['section-tab', { active: secaoAtiva === 'rotas' }]"
          @click="secaoAtiva = 'rotas'"
        >
          2. Rotas do Grupo ({{ (grupoAtual.habitualRoutes?.length || 0) + (grupoAtual.sharedRoutes?.length || 0) }})
        </button>
      </div>

      <template v-if="secaoAtiva === 'config'">
      <!-- 1. Dados do Grupo -->
      <section class="panel-section">
        <h2>Nome e Ponto de Destino</h2>
        <form @submit.prevent="salvarGrupo">
          <div class="grid-2">
            <div>
              <label>Nome do Grupo<span>*</span></label>
              <input v-model="grupoForm.name" required :disabled="salvando" />
            </div>
            <div>
              <label>Ponto Operacional de Destino<span>*</span></label>
              <select v-model="grupoForm.destinationId" required :disabled="salvando">
                <option v-for="ponto in store.pontosDestino" :key="ponto.id" :value="ponto.id">
                  {{ ponto.name }} — {{ ponto.city }}/{{ ponto.state }}
                </option>
              </select>
            </div>
          </div>
          <p v-if="erro" class="erro" role="alert">{{ erro }}</p>
          <p v-if="aviso" class="aviso" role="status">{{ aviso }}</p>
          <button type="submit" class="btn-primary-inline" :disabled="salvando">
            {{ salvando ? 'Salvando...' : 'Salvar grupo' }}
          </button>
        </form>
      </section>

      <!-- 2. Política de Respostas -->
      <section class="panel-section">
        <h2>2. Política de Respostas (Janela Normal e Prorrogação)</h2>
        <p class="hint">
          Informe os dias de antecedência e horários explícitos (sem valores padrão universais). A prorrogação é opcional, mas exige ambos os campos se habilitada.
        </p>
        <form @submit.prevent="salvarPolitica">
          <div class="grid-2">
            <div>
              <label>Abertura: dias antes<span>*</span></label>
              <input v-model="policyForm.opens_days_before" type="number" min="0" required :disabled="salvandoPolitica" />
            </div>
            <div>
              <label>Abertura: horário<span>*</span></label>
              <input v-model="policyForm.opens_time" type="time" required :disabled="salvandoPolitica" />
            </div>
            <div>
              <label>Prazo normal: dias antes<span>*</span></label>
              <input v-model="policyForm.normal_days_before" type="number" min="0" required :disabled="salvandoPolitica" />
            </div>
            <div>
              <label>Prazo normal: horário<span>*</span></label>
              <input v-model="policyForm.normal_time" type="time" required :disabled="salvandoPolitica" />
            </div>
            <div>
              <label>Prorrogação (opcional): dias antes</label>
              <input v-model="policyForm.extension_days_before" type="number" min="0" :disabled="salvandoPolitica" />
            </div>
            <div>
              <label>Prorrogação (opcional): horário</label>
              <input v-model="policyForm.extension_time" type="time" :disabled="salvandoPolitica" />
            </div>
          </div>
          <p v-if="erroPolitica" class="erro" role="alert">{{ erroPolitica }}</p>
          <p v-if="avisoPolitica" class="aviso" role="status">{{ avisoPolitica }}</p>
          <button type="submit" class="btn-primary-inline" :disabled="salvandoPolitica">
            {{ salvandoPolitica ? 'Salvando...' : 'Salvar política de respostas' }}
          </button>
        </form>
      </section>

      <!-- 3. Serviços Habituais -->
      <section class="panel-section">
        <h2>3. Serviços Habituais (Ida e Retorno separados)</h2>
        <p class="hint">
          Designe explicitamente o motorista habitual (vínculo ativo) e o veículo habitual (ativo), bem como vigência, duração planejada (`HH:MM:SS`) e margem de agenda (`HH:MM:SS`). O sentido não pode ser alterado após criar o serviço.
        </p>

        <div v-if="grupoAtual.services.length" class="item-list">
          <div v-for="s in grupoAtual.services" :key="s.id" class="sub-card">
            <div class="sub-card-header">
              <div>
                <strong>{{ s.name }} (#{{ s.id }})</strong> ·
                <span class="badge-dir">{{ s.direction === 'outbound' ? 'Ida' : 'Retorno' }}</span> ·
                {{ s.targetTimeLabel }} · {{ s.weekdaysLabel }}
              </div>
              <button type="button" class="btn-outline-inline" @click="iniciarEdicaoServico(s)">Editar</button>
            </div>
            <p class="sub-meta">
              Vigência: {{ s.valid_from }} até {{ s.valid_until || 'indeterminado' }} ·
              Duração: {{ s.planned_duration || 'pendente' }} · Margem: {{ s.turnaround_duration || 'pendente' }}
            </p>
            <p class="sub-meta">
              Motorista: {{ s.driverName }} · Veículo: {{ s.vehiclePlate }} ·
              Origem: {{ s.originName }} → Destino: {{ s.destinationName }}
            </p>
            <p class="sub-meta">
              Paradas configuradas ({{ s.point_ids?.length || 0 }}):
              {{ s.point_ids?.length ? s.point_ids.map(nomePonto).join(' → ') : 'Nenhuma parada habitual' }}
            </p>
          </div>
        </div>
        <p v-else class="status-message">Nenhum serviço habitual cadastrado neste grupo.</p>

        <form class="service-form" @submit.prevent="salvarServico">
          <h3>{{ editandoServicoId ? `Editar serviço #${editandoServicoId}` : 'Novo serviço habitual' }}</h3>
          <div class="grid-2">
            <div>
              <label>Nome do serviço<span>*</span></label>
              <input v-model="servicoForm.name" placeholder="Ex.: Ida Manhã 07:30" required :disabled="salvandoServico" />
            </div>
            <div>
              <label>Sentido<span>*</span></label>
              <select v-model="servicoForm.direction" :disabled="salvandoServico || Boolean(editandoServicoId)">
                <option value="outbound">Ida (outbound)</option>
                <option value="return">Retorno (return)</option>
              </select>
            </div>
            <div>
              <label>Horário-alvo<span>*</span></label>
              <input v-model="servicoForm.target_time" type="time" required :disabled="salvandoServico" />
            </div>
            <div>
              <label>Início de vigência<span>*</span></label>
              <input v-model="servicoForm.valid_from" type="date" required :disabled="salvandoServico" />
            </div>
            <div>
              <label>Fim de vigência (opcional)</label>
              <input v-model="servicoForm.valid_until" type="date" :disabled="salvandoServico" />
            </div>
            <div>
              <label>Duração planejada (HH:MM:SS)</label>
              <input v-model="servicoForm.planned_duration" placeholder="00:45:00" :disabled="salvandoServico" />
            </div>
            <div>
              <label>Margem / turnaround (HH:MM:SS)</label>
              <input v-model="servicoForm.turnaround_duration" placeholder="00:15:00" :disabled="salvandoServico" />
            </div>
            <div>
              <label>Motorista habitual (vínculo ativo)</label>
              <select v-model="servicoForm.driver_membership_id" :disabled="salvandoServico">
                <option value="">Sem motorista designado</option>
                <option v-for="m in motoristasAtivos" :key="m.id" :value="m.id">
                  {{ m.applicant_name }} (vínculo #{{ m.id }})
                </option>
              </select>
            </div>
            <div>
              <label>Veículo habitual (ativo)</label>
              <select v-model="servicoForm.vehicle_id" :disabled="salvandoServico">
                <option value="">Sem veículo designado</option>
                <option v-for="v in veiculosAtivos" :key="v.id" :value="v.id">
                  {{ v.plate }} — {{ v.model || 'Veículo' }} ({{ v.capacity }} lug.)
                </option>
              </select>
            </div>
            <div>
              <label>Ponto de origem (opcional)</label>
              <select v-model="servicoForm.origin_id" :disabled="salvandoServico">
                <option value="">Usar garagem do veículo / destino</option>
                <option v-for="p in store.pontosOperacionais" :key="p.id" :value="p.id">
                  {{ p.name }} ({{ p.city }}/{{ p.state }})
                </option>
              </select>
            </div>
            <div>
              <label>Ponto de destino (opcional)</label>
              <select v-model="servicoForm.destination_id" :disabled="salvandoServico">
                <option value="">Usar destino do grupo / garagem</option>
                <option v-for="p in store.pontosOperacionais" :key="p.id" :value="p.id">
                  {{ p.name }} ({{ p.city }}/{{ p.state }})
                </option>
              </select>
            </div>
          </div>

          <div class="weekdays-box">
            <label>Dias da semana<span>*</span></label>
            <div class="weekday-chips">
              <button
                v-for="w in WEEKDAY_OPTIONS"
                :key="w.bit"
                type="button"
                :class="['chip', { active: (servicoForm.weekdays & w.bit) !== 0 }]"
                :disabled="salvandoServico"
                @click="toggleWeekday(w.bit)"
              >
                {{ w.label }}
              </button>
            </div>
          </div>

          <div class="stops-box">
            <label>Paradas habituais na ordem configurada</label>
            <div class="inline-row">
              <select v-model="paradaParaAdicionar" :disabled="salvandoServico">
                <option value="">Adicionar ponto operacional...</option>
                <option v-for="p in store.pontosOperacionais" :key="p.id" :value="p.id">
                  {{ p.name }} — {{ p.city }}/{{ p.state }}
                </option>
              </select>
              <button type="button" class="btn-outline-inline" :disabled="salvandoServico" @click="adicionarParada">
                Adicionar parada
              </button>
            </div>
            <div v-if="paradasSelecionadas.length" class="weekday-chips">
              <span v-for="(pid, idx) in paradasSelecionadas" :key="pid" class="chip active">
                {{ idx + 1 }}. {{ nomePonto(pid) }}
                <button type="button" class="chip-x" :disabled="salvandoServico" @click="removerParada(pid)">×</button>
              </span>
            </div>
          </div>

          <p v-if="erroServico" class="erro" role="alert">{{ erroServico }}</p>
          <p v-if="avisoServico" class="aviso" role="status">{{ avisoServico }}</p>

          <div class="inline-row">
            <button type="submit" class="btn-primary-inline" :disabled="salvandoServico">
              {{ salvandoServico ? 'Salvando...' : editandoServicoId ? 'Atualizar serviço' : 'Criar serviço habitual' }}
            </button>
            <button v-if="editandoServicoId" type="button" class="btn-outline-inline" :disabled="salvandoServico" @click="cancelarEdicaoServico">
              Cancelar edição
            </button>
          </div>
        </form>
      </section>

      <!-- 4. Passageiros do Grupo e Serviços Autorizados -->
      <section class="panel-section">
        <h2>4. Passageiros do Grupo</h2>
        <p class="hint">
          Passageiros aprovados a partir deste grupo entram aqui automaticamente. Você também pode adicionar um passageiro vinculado a este grupo ou transferi-lo para outro grupo. Os pontos de embarque são definidos na aba Rotas do Grupo.
        </p>

        <form class="inline-row" @submit.prevent="atribuirPassageiro">
          <select v-model="atribuicaoForm.membershipId" required :disabled="salvandoAtribuicao">
            <option value="">Selecionar passageiro vinculado para adicionar ao grupo...</option>
            <option v-for="m in passageirosAtivos" :key="m.id" :value="m.id">
              {{ m.applicant_name }} (vínculo #{{ m.id }})
            </option>
          </select>
          <button type="submit" class="btn-primary-inline" :disabled="salvandoAtribuicao">
            {{ salvandoAtribuicao ? 'Salvando...' : 'Adicionar ao grupo' }}
          </button>
        </form>
        <p v-if="erroAtribuicao" class="erro" role="alert">{{ erroAtribuicao }}</p>

        <div v-if="grupoAtual.members.length" class="item-list">
          <div v-for="m in grupoAtual.members" :key="m.id" class="sub-card">
            <div class="sub-card-header">
              <div>
                <strong>{{ m.applicantName }}</strong> · Participação #{{ m.id }}
              </div>
              <button type="button" class="btn-outline-inline" @click="abrirAutorizacao(m)">
                Configurar serviços autorizados
              </button>
            </div>
            <p class="sub-meta">
              Serviços autorizados: {{ m.service_ids?.length || 0 }} ·
              Ida habitual: {{ m.habitual_outbound_id ? `#${m.habitual_outbound_id}` : 'Não definida' }}
            </p>
            <div v-if="outrosGrupos.length" class="inline-row" style="margin-top: 8px">
              <select
                v-model="destinoTrocaGrupo[m.membership]"
                :disabled="salvandoAtribuicao"
                aria-label="Trocar passageiro de grupo"
              >
                <option value="">Trocar para outro grupo...</option>
                <option v-for="g in outrosGrupos" :key="g.id" :value="g.id">
                  {{ g.name }}
                </option>
              </select>
              <button
                type="button"
                class="btn-outline-inline"
                :disabled="salvandoAtribuicao || !destinoTrocaGrupo[m.membership]"
                @click="moverPassageiro(m)"
              >
                Mover de grupo
              </button>
            </div>

            <div v-if="autorizacaoSelecionada === m.id" class="auth-panel">
              <h4>Serviços autorizados para {{ m.applicantName }}</h4>
              <div class="weekday-chips">
                <button
                  v-for="s in grupoAtual.services"
                  :key="s.id"
                  type="button"
                  :class="['chip', { active: servicosAutorizadosDraft.includes(s.id) }]"
                  :disabled="salvandoAutorizacao"
                  @click="toggleServicoAutorizado(s.id)"
                >
                  {{ s.name }} ({{ s.direction === 'outbound' ? 'Ida' : 'Retorno' }} {{ s.targetTimeLabel }})
                </button>
              </div>
              <div class="form-group-compact">
                <label>Ida habitual (deve ser uma ida autorizada)</label>
                <select v-model="idaHabitualDraft" :disabled="salvandoAutorizacao">
                  <option value="">Sem ida habitual</option>
                  <option
                    v-for="s in grupoAtual.services.filter((srv) => srv.direction === 'outbound' && servicosAutorizadosDraft.includes(srv.id))"
                    :key="s.id"
                    :value="s.id"
                  >
                    {{ s.name }} ({{ s.targetTimeLabel }})
                  </option>
                </select>
              </div>
              <p v-if="erroAutorizacao" class="erro" role="alert">{{ erroAutorizacao }}</p>
              <div class="inline-row">
                <button type="button" class="btn-primary-inline" :disabled="salvandoAutorizacao" @click="salvarAutorizacao">
                  {{ salvandoAutorizacao ? 'Salvando...' : 'Salvar autorizações' }}
                </button>
                <button type="button" class="btn-outline-inline" :disabled="salvandoAutorizacao" @click="autorizacaoSelecionada = null">
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
        <p v-else class="status-message">Nenhum passageiro atribuído a este grupo.</p>
      </section>

      <!-- 5. Agenda Automática Opt-in -->
      <section class="panel-section">
        <h2>5. Agenda Automática Opt-in (Subetapa 6.4)</h2>
        <p class="hint">
          Configura a geração automática pelo worker (exige política de respostas cadastrada). Configurar ou consultar não inicia o worker nem publica viagens automaticamente.
        </p>
        <div v-if="agendaStatus" class="sub-card">
          <p class="sub-meta">
            Estado: <strong>{{ agendaStatus.enabled ? 'Habilitada' : 'Desabilitada' }}</strong> ·
            Revisão: {{ agendaStatus.revision }} · Cursor: {{ agendaStatus.cursor_date || '—' }} ·
            Fim do ciclo: {{ agendaStatus.cycle_end_date || '—' }}
          </p>
          <p class="sub-meta">
            Última tentativa: {{ agendaStatus.last_attempted_at ? new Date(agendaStatus.last_attempted_at).toLocaleString('pt-BR') : '—' }} ·
            Última conclusão: {{ agendaStatus.last_completed_at ? new Date(agendaStatus.last_completed_at).toLocaleString('pt-BR') : '—' }} ·
            Código de erro: {{ agendaStatus.last_error_code || 'nenhum' }}
          </p>
        </div>
        <p v-else class="sub-meta">Agenda automática ainda não configurada para este grupo.</p>

        <form @submit.prevent="salvarAgenda">
          <div class="grid-2">
            <div>
              <label>
                <input v-model="agendaForm.enabled" type="checkbox" :disabled="salvandoAgenda" />
                Habilitar geração automática
              </label>
            </div>
            <div>
              <label>Horizonte em dias (1 a 31)<span>*</span></label>
              <input v-model="agendaForm.horizon_days" type="number" min="1" max="31" required :disabled="salvandoAgenda" />
            </div>
            <div>
              <label>Tamanho do lote (1 até horizonte)<span>*</span></label>
              <input v-model="agendaForm.batch_size" type="number" min="1" max="31" required :disabled="salvandoAgenda" />
            </div>
            <div>
              <label>Intervalo em segundos<span>*</span></label>
              <input v-model="agendaForm.interval_seconds" type="number" min="1" required :disabled="salvandoAgenda" />
            </div>
            <div>
              <label>Próxima execução<span>*</span></label>
              <input v-model="agendaForm.next_run_at" type="datetime-local" required :disabled="salvandoAgenda" />
            </div>
          </div>
          <p v-if="erroAgenda" class="erro" role="alert">{{ erroAgenda }}</p>
          <p v-if="avisoAgenda" class="aviso" role="status">{{ avisoAgenda }}</p>
          <button type="submit" class="btn-primary-inline" :disabled="salvandoAgenda">
            {{ salvandoAgenda ? 'Salvando...' : 'Salvar agenda automática' }}
          </button>
        </form>
      </section>
      </template>

      <HabitualRouteBuilder
        v-else
        :group-id="id"
        :destination-coords="grupoAtual.destinationCoords"
        :habitual-routes="grupoAtual.habitualRoutes || []"
        :shared-routes="grupoAtual.sharedRoutes || []"
        @updated="carregarTudo"
      />
    </template>
  </div>
</template>

<style scoped>
.content {
  padding: 18px 18px 140px;
  max-width: 760px;
  margin: 0 auto;
}

.top-bar {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.back-button {
  background: none;
  border: none;
  cursor: pointer;
}

.section-tabs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 18px;
}

.section-tab {
  min-height: 44px;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1.5px solid var(--border);
  background: var(--superfice);
  color: var(--text-muted);
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.section-tab.active {
  border-color: var(--primary);
  background: rgba(223, 128, 26, 0.12);
  color: var(--primary);
}

.top-bar .mdi {
  font-size: 28px;
  color: var(--text);
}

.top-bar h1 {
  font-weight: 700;
  font-size: 24px;
  margin-left: 16px;
}

.panel-section {
  background: var(--superfice);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: var(--shadow);
}

.panel-section h2 {
  margin: 0 0 10px;
  font-size: 1.15rem;
  color: var(--text);
}

.panel-section h3 {
  margin: 18px 0 12px;
  font-size: 1rem;
  color: var(--text);
}

.hint {
  font-size: 0.86rem;
  color: var(--text-muted);
  line-height: 1.5;
  margin-bottom: 16px;
}

.grid-2 {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
  margin-bottom: 14px;
}

.grid-2 label,
.weekdays-box label,
.stops-box label,
.form-group-compact label {
  display: block;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 4px;
}

.grid-2 label span,
.weekdays-box label span {
  color: var(--primary);
}

.grid-2 input:not([type='checkbox']),
.grid-2 select,
.inline-row select,
.form-group-compact select {
  width: 100%;
  height: 40px;
  padding: 0 10px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--bg);
  color: var(--text);
  box-sizing: border-box;
}

.weekdays-box,
.stops-box {
  margin-bottom: 14px;
}

.weekday-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 6px;
}

.chip {
  padding: 6px 12px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: var(--bg);
  color: var(--text-muted);
  font-size: 0.82rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.chip.active {
  border-color: var(--primary);
  background: rgba(223, 128, 26, 0.12);
  color: var(--primary);
  font-weight: 600;
}

.chip-x {
  background: none;
  border: none;
  color: var(--primary);
  cursor: pointer;
  font-weight: 700;
}

.inline-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  margin-bottom: 12px;
}

.inline-row select {
  flex: 1 1 200px;
}

.item-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 12px 0;
}

.sub-card {
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 14px;
  background: var(--bg);
}

.sub-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.sub-meta {
  font-size: 0.82rem;
  color: var(--text-muted);
  margin: 6px 0 0;
}

.badge-dir {
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(223, 128, 26, 0.12);
  color: var(--primary);
  font-size: 0.75rem;
  font-weight: 700;
}

.auth-panel {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed var(--border);
}

.form-group-compact {
  margin: 10px 0;
}

.btn-primary-inline {
  padding: 10px 16px;
  border-radius: 10px;
  border: none;
  background: var(--gradient-primary);
  color: white;
  font-weight: 600;
  cursor: pointer;
}

.btn-outline-inline {
  padding: 8px 14px;
  border-radius: 10px;
  border: 1px solid var(--primary);
  background: transparent;
  color: var(--primary);
  font-weight: 600;
  cursor: pointer;
}

.erro {
  color: var(--danger, #d32f2f);
  font-size: 0.85rem;
  margin: 8px 0;
}

.aviso {
  color: var(--success, #059669);
  font-size: 0.85rem;
  margin: 8px 0;
}

.status-message {
  color: var(--text-muted);
  font-size: 0.88rem;
  padding: 12px 0;
}
</style>
