<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRotasStore } from '@/stores/useRotasStore'
import { useAccountScope } from '@/composables/useAccountScope'
import { useToast } from '@/composables/useToast'
import { useRouter } from 'vue-router'
import RouteMapSnapshot from '@/components/transport/RouteMapSnapshot.vue'
import TransportHistoryNotifications from '@/components/transport/TransportHistoryNotifications.vue'

const store = useRotasStore()
const scope = useAccountScope()
const router = useRouter()
const { toast, showToast } = useToast()

const aba = ref('grupos') // 'grupos' | 'operacao'
const busca = ref('')
const busy = ref(false)

const filtroGrupoId = ref('')
const filtroData = ref('')

const gerarForm = ref({
  groupId: '',
  start_date: '',
  horizon_days: '',
  batch_size: '',
})
const cancelarDataForm = ref({
  groupId: '',
  date: '',
  reason: '',
})
const motivoCancelamentoDia = ref({})
const motivoDecisaoPedido = ref({})
const veiculoSubstituto = ref({})
const conviteMotorista = ref({})
const mapaAberto = ref({})

function toggleMapa(travelId) {
  mapaAberto.value[travelId] = !mapaAberto.value[travelId]
}

onMounted(async () => {
  await store.fetchRotas({ signal: scope.signal })
  if (!scope.current()) return
  await store.fetchOperacaoDatada({}, { signal: scope.signal })
})

const gruposFiltrados = computed(() => {
  const lista = store.grupos || []
  const termo = busca.value.trim().toLowerCase()
  if (!termo) return lista
  return lista.filter(
    (g) => g.name.toLowerCase().includes(termo) || g.destinationName.toLowerCase().includes(termo),
  )
})

const motoristasAtivos = computed(() => store.vinculosAtivos.filter((m) => m.driver != null))
const veiculosAtivos = computed(() => store.todosVeiculos.filter((v) => v.status === 'active'))

function nomeGrupo(groupId) {
  return store.grupos.find((g) => g.id === groupId)?.name || `Grupo #${groupId}`
}

function nomeServico(serviceId) {
  const s = store.servicos.find((item) => item.id === serviceId)
  if (!s) return `Serviço #${serviceId}`
  return `${s.name} (${s.direction === 'outbound' ? 'Ida' : 'Retorno'} ${String(s.target_time || '').slice(0, 5)})`
}

function viagensDoDia(dayId) {
  return store.viagensDia.filter((t) => t.service_day === dayId)
}

function elegibilidadesDoDia(dayId) {
  return store.elegibilidadesDia.filter((e) => e.day === dayId)
}

function resumoRespostasDia(dayId) {
  const list = elegibilidadesDoDia(dayId)
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
  if (!snapshotId) return null
  return store.snapshotsViagem.find((s) => s.id === snapshotId) || null
}

function jobDoSnapshot(snapshotId) {
  if (!snapshotId) return null
  return store.jobsCalculo.find((j) => j.snapshot === snapshotId) || null
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

async function gerarHorizonte() {
  if (!scope.current() || busy.value) return
  const { groupId, start_date, horizon_days, batch_size } = gerarForm.value
  if (!groupId || !start_date || !horizon_days || !batch_size) {
    showToast('Preencha grupo, data inicial, horizonte (1–31) e lote (1–31).', 'error')
    return
  }
  busy.value = true
  const dias = await store.gerarHorizonte(
    Number(groupId),
    { start_date, horizon_days: Number(horizon_days), batch_size: Number(batch_size) },
    { signal: scope.signal },
  )
  if (!scope.current()) return
  busy.value = false
  if (dias) {
    showToast(`Horizonte gerado (${dias.length} atendimento(s)).`)
    await consultarOperacao()
  } else {
    showToast(store.error || 'Erro ao gerar horizonte.', 'error')
  }
}

async function cancelarDataAntesDeGerar() {
  if (!scope.current() || busy.value) return
  const { groupId, date, reason } = cancelarDataForm.value
  if (!groupId || !date || !reason.trim()) {
    showToast('Informe grupo, data e motivo para cancelar a data.', 'error')
    return
  }
  busy.value = true
  const res = await store.cancelarDataGrupo(
    Number(groupId),
    { date, reason },
    { signal: scope.signal },
  )
  if (!scope.current()) return
  busy.value = false
  if (res) {
    showToast(res.partial ? 'Data cancelada parcialmente (viagens em andamento preservadas).' : 'Data cancelada.')
    cancelarDataForm.value = { groupId: '', date: '', reason: '' }
    await consultarOperacao()
  } else {
    showToast(store.error || 'Erro ao cancelar data.', 'error')
  }
}

async function fecharJanelaDia(day) {
  if (!scope.current() || busy.value) return
  busy.value = true
  const res = await store.fecharDiaAtendimento(day.id, { signal: scope.signal })
  if (!scope.current()) return
  busy.value = false
  if (res) {
    showToast('Janela normal encerrada e alocações preparadas.')
    await consultarOperacao()
  } else {
    showToast(store.error || 'Não foi possível preparar alocações deste dia.', 'error')
  }
}

async function revisarDia(day) {
  if (!scope.current() || busy.value) return
  busy.value = true
  const res = await store.revisarDiaAtendimento(day.id, day.revision, { signal: scope.signal })
  if (!scope.current()) return
  busy.value = false
  if (res) {
    showToast(`Atendimento revisado para revisão ${res.revision}.`)
    await consultarOperacao()
  } else {
    showToast(store.error || 'Não foi possível revisar o atendimento.', 'error')
  }
}

async function cancelarDia(day) {
  if (!scope.current() || busy.value) return
  const reason = (motivoCancelamentoDia.value[day.id] || '').trim()
  if (!reason) {
    showToast('Informe o motivo do cancelamento do atendimento.', 'error')
    return
  }
  busy.value = true
  const res = await store.cancelarDiaAtendimento(day.id, reason, { signal: scope.signal })
  if (!scope.current()) return
  busy.value = false
  if (res) {
    motivoCancelamentoDia.value[day.id] = ''
    showToast(res.partial ? 'Atendimento cancelado parcialmente (viagens iniciadas preservadas).' : 'Atendimento cancelado.')
    await consultarOperacao()
  } else {
    showToast(store.error || 'Não foi possível cancelar o atendimento.', 'error')
  }
}

async function solicitarCalculo(travel) {
  if (!scope.current() || busy.value) return
  busy.value = true
  const res = await store.calcularViagem(travel.id, travel.revision, { signal: scope.signal })
  if (!scope.current()) return
  busy.value = false
  if (res) {
    showToast('Cálculo de percurso enfileirado (202). O cálculo não publica a viagem automaticamente.')
    await consultarOperacao()
  } else {
    showToast(store.error || 'Não foi possível solicitar o cálculo.', 'error')
  }
}

async function publicarViagemPronta(travel) {
  if (!scope.current() || busy.value) return
  busy.value = true
  const res = await store.publicarViagem(travel.id, travel.revision, { signal: scope.signal })
  if (!scope.current()) return
  busy.value = false
  if (res) {
    showToast(`Viagem #${travel.id} publicada na revisão ${res.revision}.`)
    await consultarOperacao()
  } else {
    showToast(store.error || 'Não foi possível publicar a viagem.', 'error')
  }
}

async function cancelarViagemAgendada(travel) {
  if (!scope.current() || busy.value) return
  busy.value = true
  const res = await store.cancelarViagem(travel.id, { signal: scope.signal })
  if (!scope.current()) return
  busy.value = false
  if (res) {
    showToast(`Viagem #${travel.id} cancelada.`)
    await consultarOperacao()
  } else {
    showToast(store.error || 'Não foi possível cancelar a viagem.', 'error')
  }
}

async function trocarVeiculoViagem(travel) {
  const vehicleId = veiculoSubstituto.value[travel.id]
  if (!scope.current() || busy.value || !vehicleId) return
  busy.value = true
  const res = await store.designarVeiculoViagem(travel.id, Number(vehicleId), { signal: scope.signal })
  if (!scope.current()) return
  busy.value = false
  if (res) {
    veiculoSubstituto.value[travel.id] = ''
    showToast('Veículo substituído. Recalcule e republique a revisão da viagem.')
    await consultarOperacao()
  } else {
    showToast(store.error || 'Não foi possível substituir o veículo.', 'error')
  }
}

async function enviarConviteMotorista(travel) {
  const draft = conviteMotorista.value[travel.id]
  if (!scope.current() || busy.value || !draft?.driverMembershipId || !draft?.expiresAt) {
    showToast('Selecione o motorista substituto e o prazo de expiração do convite.', 'error')
    return
  }
  busy.value = true
  const res = await store.convidarMotoristaViagem(
    travel.id,
    {
      driverMembershipId: Number(draft.driverMembershipId),
      expiresAt: new Date(draft.expiresAt).toISOString(),
    },
    { signal: scope.signal },
  )
  if (!scope.current()) return
  busy.value = false
  if (res) {
    conviteMotorista.value[travel.id] = { driverMembershipId: '', expiresAt: '' }
    showToast('Convite enviado. O motorista convidado precisa aceitar explicitamente.')
    await consultarOperacao()
  } else {
    showToast(store.error || 'Não foi possível convidar o motorista.', 'error')
  }
}

function getInviteDraft(travelId) {
  if (!conviteMotorista.value[travelId]) {
    conviteMotorista.value[travelId] = { driverMembershipId: '', expiresAt: '' }
  }
  return conviteMotorista.value[travelId]
}

async function decidirPedido(req, action) {
  if (!scope.current() || busy.value) return
  const reason = (motivoDecisaoPedido.value[req.id] || '').trim()
  busy.value = true
  const res = await store.decidirPedidoAlteracao(req.id, action, reason, { signal: scope.signal })
  if (!scope.current()) return
  busy.value = false
  if (res) {
    showToast(
      action === 'approve'
        ? 'Pedido aprovado e em preparação de cálculo. A escolha anterior permanece até aplicar após o cálculo.'
        : 'Pedido recusado. A escolha e a alocação anteriores foram preservadas.',
    )
    await consultarOperacao()
  } else {
    showToast(store.error || 'Não foi possível decidir o pedido.', 'error')
  }
}

async function aplicarPedido(req) {
  if (!scope.current() || busy.value) return
  busy.value = true
  const res = await store.aplicarPedidoAlteracao(req.id, { signal: scope.signal })
  if (!scope.current()) return
  busy.value = false
  if (res) {
    showToast('Alteração na prorrogação aplicada às viagens após cálculo válido.')
    await consultarOperacao()
  } else {
    showToast(store.error || 'Não foi possível aplicar o pedido.', 'error')
  }
}
</script>

<template>
  <div class="content">
    <transition name="toast">
      <div v-if="toast" :class="['toast', toast.type]" role="status">
        <span class="mdi" :class="toast.type === 'error' ? 'mdi-alert-circle-outline' : 'mdi-check-circle-outline'"></span>
        {{ toast.message }}
      </div>
    </transition>

    <div class="tab-bar" role="tablist" aria-label="Programação habitual, operação por data e histórico">
      <button type="button" :class="['tab-btn', { active: aba === 'grupos' }]" @click="aba = 'grupos'">
        Grupos e Programação Habitual ({{ store.grupos.length }})
      </button>
      <button type="button" :class="['tab-btn', { active: aba === 'operacao' }]" @click="aba = 'operacao'">
        Atendimentos, Respostas e Viagens por Data ({{ store.diasAtendimento.length }})
      </button>
      <button type="button" :class="['tab-btn', { active: aba === 'historico' }]" @click="aba = 'historico'">
        Avisos, Avaliações e Objetos Perdidos
      </button>
    </div>

    <!-- ABA 1: GRUPOS E CONFIGURAÇÃO HABITUAL -->
    <template v-if="aba === 'grupos'">
      <div class="search-container">
        <span class="mdi mdi-magnify search-icon"></span>
        <input v-model="busca" type="text" placeholder="Busque por grupo ou ponto de destino..." />
      </div>

      <p v-if="store.loading" class="status-message">Carregando grupos e serviços habituais...</p>
      <p v-else-if="store.error" class="status-message error" role="alert">{{ store.error }}</p>
      <p v-else-if="!gruposFiltrados.length" class="status-message">Nenhum grupo de atendimento cadastrado.</p>

      <div class="list-rotas">
        <div v-for="grupo in gruposFiltrados" :key="grupo.id" class="card-rota">
          <div class="card-header">
            <div class="header-main">
              <h3>{{ grupo.name }} · #{{ grupo.id }}</h3>
              <p class="card-subtitle">Destino: {{ grupo.destinationName }}</p>
            </div>
            <button type="button" class="btn-outline" @click="router.push(`/rotas/editar/${grupo.id}`)">
              Configurar grupo
            </button>
          </div>

          <div class="policy-box">
            <span v-if="grupo.policy" class="policy-text">
              Política: abre {{ grupo.policy.opens_days_before }}d antes às {{ String(grupo.policy.opens_time).slice(0, 5) }} ·
              fecha {{ grupo.policy.normal_days_before }}d antes às {{ String(grupo.policy.normal_time).slice(0, 5) }}
              <template v-if="grupo.policy.extension_time">
                · prorrogação {{ grupo.policy.extension_days_before }}d antes às {{ String(grupo.policy.extension_time).slice(0, 5) }}
              </template>
            </span>
            <span v-else class="policy-missing">Pendência: política de respostas ainda não configurada.</span>
          </div>

          <div class="horarios-linha" v-if="grupo.services.length">
            <span v-for="s in grupo.services" :key="s.id" class="badge-horario">
              {{ s.direction === 'outbound' ? 'Ida' : 'Retorno' }} {{ s.targetTimeLabel }} · {{ s.name }} ·
              {{ s.weekdaysLabel }} · {{ s.vehiclePlate }} · {{ s.driverName }}
            </span>
          </div>
          <p v-else class="sem-horario">Nenhum serviço habitual cadastrado neste grupo.</p>

          <div class="secao-vinculos">
            <p class="vinculo-titulo">
              <span class="mdi mdi-account-multiple"></span>
              Passageiros atribuídos ao grupo ({{ grupo.members.length }})
            </p>
            <div class="chips" v-if="grupo.members.length">
              <span v-for="m in grupo.members" :key="m.id" class="chip">
                {{ m.applicantName }} · {{ m.pointName }} · {{ m.service_ids?.length || 0 }} serviço(s)
              </span>
            </div>
            <span v-else class="chip-vazio">Nenhum passageiro atribuído.</span>
          </div>
        </div>
      </div>

      <button type="button" class="fab-add" aria-label="Cadastrar grupo" @click="router.push('/cadastro-rota')">
        <span class="mdi mdi-plus"></span>
      </button>
    </template>

    <!-- ABA 2: ATENDIMENTO POR DATA, RESPOSTAS, CÁLCULO E PUBLICAÇÃO -->
    <template v-else-if="aba === 'operacao'">
      <section class="card-rota">
        <h3>Gerar Horizonte ou Cancelar Data</h3>
        <p class="card-subtitle">
          Gere atendimentos por data (máximo 31 dias e lote até 31 por requisição HTTP) ou registre o cancelamento de uma data específica mesmo antes de gerar viagens.
        </p>

        <form class="op-grid" @submit.prevent="gerarHorizonte">
          <select v-model="gerarForm.groupId" required :disabled="busy">
            <option value="">Grupo para gerar horizonte...</option>
            <option v-for="g in store.grupos" :key="g.id" :value="g.id">{{ g.name }}</option>
          </select>
          <input v-model="gerarForm.start_date" type="date" required :disabled="busy" aria-label="Data inicial" />
          <input v-model="gerarForm.horizon_days" type="number" min="1" max="31" placeholder="Horizonte (1-31)" required :disabled="busy" />
          <input v-model="gerarForm.batch_size" type="number" min="1" max="31" placeholder="Lote (1-31)" required :disabled="busy" />
          <button type="submit" class="btn-primary-inline" :disabled="busy">Gerar horizonte</button>
        </form>

        <form class="op-grid" @submit.prevent="cancelarDataAntesDeGerar">
          <select v-model="cancelarDataForm.groupId" required :disabled="busy">
            <option value="">Grupo para cancelar data...</option>
            <option v-for="g in store.grupos" :key="g.id" :value="g.id">{{ g.name }}</option>
          </select>
          <input v-model="cancelarDataForm.date" type="date" required :disabled="busy" aria-label="Data a cancelar" />
          <input v-model="cancelarDataForm.reason" placeholder="Motivo do cancelamento (até 500 caracteres)" maxlength="500" required :disabled="busy" />
          <button type="submit" class="btn-outline" :disabled="busy">Cancelar data</button>
        </form>
      </section>

      <section class="card-rota">
        <h3>Filtrar Atendimentos por Data</h3>
        <div class="op-grid">
          <select v-model="filtroGrupoId" :disabled="busy || store.dayLoading">
            <option value="">Todos os grupos</option>
            <option v-for="g in store.grupos" :key="g.id" :value="g.id">{{ g.name }}</option>
          </select>
          <input v-model="filtroData" type="date" :disabled="busy || store.dayLoading" />
          <button type="button" class="btn-primary-inline" :disabled="busy || store.dayLoading" @click="consultarOperacao">
            Atualizar consulta
          </button>
        </div>
      </section>

      <!-- Pedidos de alteração na prorrogação (6.1) -->
      <section v-if="store.pedidosAlteracao.length" class="card-rota">
        <h3>Pedidos na Prorrogação ({{ store.pedidosAlteracao.length }})</h3>
        <p class="card-subtitle">
          Aprovar um pedido reserva vaga e inicia o cálculo (`preparing`), mantendo a escolha e a alocação anteriores até que o cálculo termine e a empresa clique em Aplicar.
        </p>
        <div class="item-stack">
          <div v-for="req in store.pedidosAlteracao" :key="req.id" class="sub-box">
            <p class="sub-title">
              Pedido #{{ req.id }} · Trecho: <strong>{{ req.leg === 'outbound' ? 'Ida' : 'Retorno' }}</strong> ·
              Serviço proposto: {{ nomeServico(req.proposed_service) }}
            </p>
            <p class="sub-meta">
              Decisão (`status`): <strong>{{ req.status }}</strong> ·
              Aplicação (`application`): <strong>{{ req.application || 'não iniciada' }}</strong>
              <span v-if="req.reason"> · Motivo: {{ req.reason }}</span>
            </p>
            <div v-if="req.status === 'pending'" class="op-grid">
              <input v-model="motivoDecisaoPedido[req.id]" placeholder="Motivo opcional (até 500 caracteres)" maxlength="500" :disabled="busy" />
              <button type="button" class="btn-primary-inline" :disabled="busy" @click="decidirPedido(req, 'approve')">
                Aprovar e calcular
              </button>
              <button type="button" class="btn-outline" :disabled="busy" @click="decidirPedido(req, 'reject')">
                Recusar
              </button>
            </div>
            <div v-else-if="req.status === 'approved' && req.application === 'preparing'" class="op-grid">
              <button type="button" class="btn-primary-inline" :disabled="busy" @click="aplicarPedido(req)">
                Aplicar alteração após cálculo pronto
              </button>
            </div>
          </div>
        </div>
      </section>

      <p v-if="store.dayLoading" class="status-message">Carregando atendimentos e viagens...</p>
      <p v-else-if="!store.diasAtendimento.length" class="status-message">
        Nenhum dia de atendimento encontrado para os filtros informados.
      </p>

      <div v-for="day in store.diasAtendimento" :key="day.id" class="card-rota">
        <div class="card-header">
          <div>
            <h3>{{ day.date }} · {{ nomeGrupo(day.route_group) }} (Dia #{{ day.id }})</h3>
            <p class="card-subtitle">
              Janela: <strong>{{ day.window }}</strong> · Revisão: <strong>{{ day.revision }}</strong>
              <span v-if="day.canceled_at"> · Cancelado em {{ new Date(day.canceled_at).toLocaleString('pt-BR') }}</span>
            </p>
          </div>
          <div class="inline-actions" v-if="!day.canceled_at">
            <button type="button" class="btn-primary-inline" :disabled="busy" @click="fecharJanelaDia(day)">
              Fechar janela normal e alocar (`close`)
            </button>
            <button type="button" class="btn-outline" :disabled="busy" @click="revisarDia(day)">
              Revisar atendimento (`revise`)
            </button>
          </div>
        </div>

        <div v-if="day.issues?.length" class="issues-alert" role="alert">
          <strong>Pendências do atendimento:</strong> {{ day.issues.join(' · ') }}
        </div>

        <div class="resumo-demanda">
          <span>Elegíveis: <strong>{{ resumoRespostasDia(day.id).total }}</strong></span>
          <span>Com ida: <strong>{{ resumoRespostasDia(day.id).comIda }}</strong></span>
          <span>Com retorno: <strong>{{ resumoRespostasDia(day.id).comRetorno }}</strong></span>
          <span>Negativas explícitas (não vai): <strong>{{ resumoRespostasDia(day.id).negativas }}</strong></span>
          <span>Ausência de resposta: <strong>{{ resumoRespostasDia(day.id).semResposta }}</strong></span>
        </div>

        <div v-if="!day.canceled_at" class="op-grid">
          <input
            v-model="motivoCancelamentoDia[day.id]"
            placeholder="Motivo para cancelar este atendimento..."
            maxlength="500"
            :disabled="busy"
          />
          <button type="button" class="btn-outline" :disabled="busy" @click="cancelarDia(day)">
            Cancelar atendimento
          </button>
        </div>

        <!-- Viagens do Dia -->
        <div class="item-stack">
          <h4>Viagens do Atendimento ({{ viagensDoDia(day.id).length }})</h4>
          <p v-if="!viagensDoDia(day.id).length" class="sub-meta">Nenhuma viagem gerada para este atendimento.</p>

          <div v-for="travel in viagensDoDia(day.id)" :key="travel.id" class="sub-box">
            <div class="card-header">
              <div>
                <strong>Viagem #{{ travel.id }} · {{ nomeServico(travel.service) }}</strong>
                <p class="sub-meta">
                  Execução (`status`): <strong>{{ travel.status }}</strong> ·
                  Planejamento (`planning_status`): <strong>{{ travel.planning_status }}</strong> ·
                  Revisão: <strong>{{ travel.revision }}</strong> ·
                  Revisão publicada: <strong>{{ travel.published_revision ?? 'nenhuma' }}</strong> ·
                  Publicação vigente (`publication_current`): <strong>{{ travel.publication_current ? 'Sim' : 'Não' }}</strong>
                </p>
                <p class="sub-meta">
                  Início planejado: {{ new Date(travel.planned_start).toLocaleString('pt-BR') }} ·
                  Fim planejado: {{ new Date(travel.planned_end).toLocaleString('pt-BR') }} ·
                  Alocados/participantes: {{ participacoesDaViagem(travel.id).length }}
                </p>
              </div>
              <div class="inline-actions" v-if="travel.status === 'scheduled'">
                <button type="button" class="btn-outline" :disabled="busy" @click="solicitarCalculo(travel)">
                  Solicitar cálculo (`calculate`)
                </button>
                <button
                  type="button"
                  class="btn-primary-inline"
                  :disabled="busy || travel.planning_status !== 'ready'"
                  @click="publicarViagemPronta(travel)"
                >
                  Publicar viagem (`publish`)
                </button>
                <button type="button" class="btn-outline" :disabled="busy" @click="cancelarViagemAgendada(travel)">
                  Cancelar viagem
                </button>
              </div>
            </div>

            <div v-if="travel.current_snapshot" class="sub-meta">
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
              <button
                v-if="snapshotDaViagem(travel.current_snapshot)"
                type="button"
                class="btn-outline"
                style="margin-left: 8px; padding: 3px 10px; font-size: 0.8rem;"
                @click="toggleMapa(travel.id)"
              >
                {{ mapaAberto[travel.id] ? 'Ocultar mapa' : 'Ver traçado no mapa' }}
              </button>
              <RouteMapSnapshot
                v-if="mapaAberto[travel.id] && snapshotDaViagem(travel.current_snapshot)"
                :snapshot="snapshotDaViagem(travel.current_snapshot)"
                title="Prévia do Traçado Calculado"
                height="240px"
              />
            </div>

            <!-- Substituição de veículo e convite de motorista substituto (6.3) -->
            <div v-if="travel.status === 'scheduled'" class="sub-actions">
              <div class="op-grid">
                <select v-model="veiculoSubstituto[travel.id]" :disabled="busy">
                  <option value="">Substituir veículo...</option>
                  <option v-for="v in veiculosAtivos" :key="v.id" :value="v.id">
                    {{ v.plate }} ({{ v.capacity }} lug.)
                  </option>
                </select>
                <button type="button" class="btn-outline" :disabled="busy" @click="trocarVeiculoViagem(travel)">
                  Designar veículo
                </button>
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
                <button type="button" class="btn-outline" :disabled="busy" @click="enviarConviteMotorista(travel)">
                  Convidar motorista
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- ABA 3: AVISOS, AVALIAÇÕES E OBJETOS PERDIDOS (6.5 e 6.6) -->
    <template v-else>
      <TransportHistoryNotifications />
    </template>
  </div>
</template>

<style scoped>
.content {
  margin: 0 auto;
  max-width: 820px;
  padding: 18px 18px 140px;
}

.tab-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 20px;
}

.tab-btn {
  flex: 1 1 240px;
  padding: 12px 16px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: var(--superfice);
  color: var(--text-muted);
  font-weight: 600;
  cursor: pointer;
}

.tab-btn.active {
  border-color: var(--primary);
  color: var(--primary);
  background: rgba(223, 128, 26, 0.1);
}

.search-container {
  position: relative;
  margin-bottom: 20px;
}

.search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
}

.search-container input {
  width: 100%;
  padding: 12px 12px 12px 44px;
  border-radius: 12px;
  border: 1px solid var(--border-primary);
  background: var(--superfice);
  outline: none;
  color: var(--text);
  box-sizing: border-box;
}

.card-rota {
  background: var(--superfice);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
  border: 1px solid var(--border);
  box-shadow: var(--shadow);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  flex-wrap: wrap;
}

.card-header h3 {
  font-size: 1.2rem;
  font-weight: 800;
  margin: 0;
  color: var(--text);
}

.card-subtitle {
  color: var(--text-muted);
  font-size: 0.88rem;
  margin-top: 4px;
  line-height: 1.4;
}

.policy-box {
  margin: 12px 0;
  padding: 10px 12px;
  border-radius: 10px;
  background: var(--bg);
  font-size: 0.83rem;
}

.policy-text {
  color: var(--text);
}

.policy-missing {
  color: var(--danger, #dc2626);
  font-weight: 600;
}

.horarios-linha {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 12px 0;
}

.badge-horario {
  font-size: 12px;
  padding: 6px 10px;
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--text);
  background: var(--bg);
}

.sem-horario {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin: 12px 0;
}

.secao-vinculos {
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid var(--border);
}

.vinculo-titulo {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--text-muted);
  margin: 0 0 8px;
}

.vinculo-titulo .mdi {
  color: var(--primary);
  font-size: 16px;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  border-radius: 20px;
  background: rgba(223, 128, 26, 0.08);
  color: var(--text);
  font-size: 0.82rem;
}

.chip-vazio {
  font-size: 0.82rem;
  color: var(--text-muted);
}

.op-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
  align-items: center;
}

.op-grid select,
.op-grid input {
  flex: 1 1 160px;
  height: 38px;
  padding: 0 10px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--bg);
  color: var(--text);
  font-size: 0.84rem;
  box-sizing: border-box;
}

.inline-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.btn-primary-inline {
  height: 38px;
  padding: 0 14px;
  border-radius: 8px;
  border: none;
  background: var(--gradient-primary);
  color: white;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
}

.btn-primary-inline:disabled,
.btn-outline:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-outline {
  height: 38px;
  padding: 0 14px;
  border-radius: 8px;
  border: 1px solid var(--primary);
  background: transparent;
  color: var(--primary);
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
}

.issues-alert {
  margin: 12px 0;
  padding: 10px 12px;
  border-radius: 10px;
  background: rgba(220, 38, 38, 0.1);
  color: var(--danger, #dc2626);
  font-size: 0.85rem;
}

.resumo-demanda {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin: 12px 0;
  padding: 10px 12px;
  border-radius: 10px;
  background: var(--bg);
  font-size: 0.83rem;
  color: var(--text);
}

.item-stack {
  margin-top: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.item-stack h4 {
  margin: 4px 0;
  font-size: 0.95rem;
}

.sub-box {
  padding: 14px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: var(--bg);
}

.sub-title {
  margin: 0 0 6px;
  font-size: 0.9rem;
}

.sub-meta {
  margin: 4px 0;
  font-size: 0.81rem;
  color: var(--text-muted);
}

.sub-actions {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed var(--border);
}

.error-inline {
  color: var(--danger, #dc2626);
}

.fab-add {
  position: fixed;
  bottom: 90px;
  right: 24px;
  width: 60px;
  height: 60px;
  border-radius: 30px;
  background: var(--gradient-primary);
  color: white;
  border: none;
  font-size: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-primary);
  cursor: pointer;
}

.status-message {
  text-align: center;
  color: var(--text-muted);
  padding: 20px 0;
}

.status-message.error {
  color: var(--danger);
}

.toast {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 999;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 24px;
  border-radius: 12px;
  font-size: 0.88rem;
  font-weight: 600;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
  pointer-events: none;
  max-width: 90vw;
}

.toast.success {
  background: rgba(5, 150, 105, 0.95);
  color: #fff;
}

.toast.error {
  background: rgba(220, 38, 38, 0.95);
  color: #fff;
}
</style>
