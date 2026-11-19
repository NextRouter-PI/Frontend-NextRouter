<script setup>
import { computed } from 'vue'
import { useTransportQuestionnaire } from '@/composables/useTransportQuestionnaire'

const {
  loading,
  busy,
  error,
  notice,
  enrichedEligibilities,
  selectedEligibility,
  outboundChoice,
  returnChoice,
  changeLeg,
  proposedServiceId,
  selectEligibility,
  refresh,
  sendNormalAnswer,
  sendExtensionRequest,
  cancelPendingRequest,
  withdrawLeg,
} = useTransportQuestionnaire()

const windowLabel = computed(() => {
  const w = selectedEligibility.value?.dayData?.window
  return {
    not_open: 'Janela ainda não aberta',
    normal: 'Janela normal aberta (resposta direta)',
    extension: 'Em prorrogação (pedidos de inclusão/troca)',
    closed: 'Janela encerrada',
    canceled: 'Atendimento cancelado pela empresa',
  }[w] || 'Estado da janela não informado'
})

const responseStateLabel = computed(() => {
  const r = selectedEligibility.value?.response
  if (!r || !r.answered_at) return 'Sem resposta enviada (ausência de resposta)'
  const ida = r.outbound_service && !r.outbound_withdrawn_at
  const volta = r.return_service && !r.return_withdrawn_at
  if (!ida && !volta) return 'Negativa explícita registrada (não utilizará o transporte neste atendimento)'
  return `Intenção enviada (revisão ${r.revision})`
})

const extensionServices = computed(() => {
  const elig = selectedEligibility.value
  if (!elig) return []
  return changeLeg.value === 'outbound' ? elig.outboundServices : elig.returnServices
})

function serviceLabel(elig, serviceId) {
  if (!serviceId) return 'Não vou neste trecho'
  const all = [...(elig?.outboundServices || []), ...(elig?.returnServices || [])]
  const found = all.find((s) => s.id === serviceId)
  return found ? `${found.name} (${found.targetTimeLabel})` : `Serviço #${serviceId}`
}
</script>

<template>
  <div class="lista-page">
    <div class="page-header">
      <div class="header-accent"></div>
      <h2>Atendimentos e Respostas por Data</h2>
      <p class="header-date">
        Intenção enviada, pedido na prorrogação, alocação e viagem publicada são estados distintos. Ida e retorno são independentes e usam somente seus serviços autorizados.
      </p>
      <button type="button" class="btn-voltar" :disabled="loading || busy" @click="refresh">
        <span class="mdi mdi-refresh"></span> Atualizar atendimentos
      </button>
    </div>

    <p v-if="notice" class="notice-banner" role="status">{{ notice }}</p>
    <p v-if="error" class="error-banner" role="alert">{{ error }}</p>

    <div v-if="loading" class="status-card">
      <div class="spinner"></div>
      <p class="status-msg">Consultando elegibilidades e atendimentos no servidor...</p>
    </div>

    <div v-else-if="!enrichedEligibilities.length" class="status-card">
      <h3 class="status-title">Nenhum atendimento disponível</h3>
      <p class="status-msg">
        Você ainda não possui elegibilidades geradas para datas de atendimento. É necessário vínculo ativo, atribuição a um grupo de atendimento, serviços autorizados e geração de datas pela empresa.
      </p>
    </div>

    <template v-else-if="selectedEligibility">
      <div class="day-selector" role="tablist" aria-label="Datas de atendimento">
        <button
          v-for="item in enrichedEligibilities"
          :key="item.id"
          type="button"
          :class="['day-chip', { active: item.id === selectedEligibility.id }]"
          :disabled="busy"
          @click="selectEligibility(item.id)"
        >
          {{ item.dayData.date }} · {{ item.dayData.window }}
        </button>
      </div>

      <div class="questionario-card">
        <div class="section-head">
          <h3>Atendimento de {{ selectedEligibility.dayData.date }}</h3>
          <span class="tag-data">{{ windowLabel }}</span>
        </div>

        <p v-if="selectedEligibility.point_snapshot?.name" class="sub-info">
          Ponto operacional congelado: <strong>{{ selectedEligibility.point_snapshot.name }}</strong>
          ({{ selectedEligibility.point_snapshot.city }}/{{ selectedEligibility.point_snapshot.state }})
        </p>

        <!-- Resumo dos 3 eixos separados: Intenção vs Alocação vs Viagem Publicada -->
        <div class="axes-box">
          <div>
            <strong>1. Sua intenção registrada:</strong>
            <p>{{ responseStateLabel }}</p>
            <p v-if="selectedEligibility.response?.answered_at">
              Ida:
              <strong>
                {{
                  selectedEligibility.response.outbound_withdrawn_at
                    ? 'Desistência registrada'
                    : serviceLabel(selectedEligibility, selectedEligibility.response.outbound_service)
                }}
              </strong>
              · Retorno:
              <strong>
                {{
                  selectedEligibility.response.return_withdrawn_at
                    ? 'Desistência registrada'
                    : serviceLabel(selectedEligibility, selectedEligibility.response.return_service)
                }}
              </strong>
            </p>
          </div>

          <div>
            <strong>2. Alocação e 3. Publicação de Viagem:</strong>
            <p v-if="!selectedEligibility.participations.length">
              Nenhuma alocação em viagem até o momento. Enviar resposta ou ter pedido aprovado não publica viagem automaticamente.
            </p>
            <ul v-else class="part-list">
              <li v-for="part in selectedEligibility.participations" :key="part.id">
                Trecho <strong>{{ part.leg === 'outbound' ? 'Ida' : 'Retorno' }}</strong> ·
                Participação: <strong>{{ part.status }}</strong> ·
                Viagem #{{ part.travel }}:
                <strong v-if="part.isPublicationCurrent">Publicada (revisão vigente {{ part.travelData?.published_revision }})</strong>
                <strong v-else-if="part.isPublished">Publicação anterior (aguardando republicação da revisão atual)</strong>
                <strong v-else>Ainda não publicada pela empresa</strong>
              </li>
            </ul>
          </div>
        </div>

        <!-- Desistência por trecho antes do embarque (6.2) -->
        <div
          v-if="
            selectedEligibility.response &&
            ((selectedEligibility.response.outbound_service && !selectedEligibility.response.outbound_withdrawn_at) ||
              (selectedEligibility.response.return_service && !selectedEligibility.response.return_withdrawn_at))
          "
          class="withdraw-box"
        >
          <h4>Desistir de um trecho antes do embarque</h4>
          <p class="sub-info">Desistir de um trecho invalida pedidos conflitantes daquele trecho sem desfazer o outro trecho.</p>
          <div class="opcoes">
            <button
              v-if="selectedEligibility.response.outbound_service && !selectedEligibility.response.outbound_withdrawn_at"
              type="button"
              class="btn-voltar"
              :disabled="busy"
              @click="withdrawLeg('outbound')"
            >
              Desistir da Ida
            </button>
            <button
              v-if="selectedEligibility.response.return_service && !selectedEligibility.response.return_withdrawn_at"
              type="button"
              class="btn-voltar"
              :disabled="busy"
              @click="withdrawLeg('return')"
            >
              Desistir do Retorno
            </button>
          </div>
        </div>

        <!-- JANELA NORMAL: Resposta direta com ida e retorno independentes (4.2) -->
        <form
          v-if="selectedEligibility.dayData.window === 'normal'"
          class="normal-form"
          @submit.prevent="sendNormalAnswer"
        >
          <h4>Responder na Janela Normal (Revisão esperada: {{ selectedEligibility.response?.revision ?? 0 }})</h4>

          <div class="pergunta-container">
            <div class="pergunta-titulo">
              <span class="pergunta-numero">1</span>
              <span>Trecho de Ida (serviços autorizados)</span>
            </div>
            <div class="opcoes-horario">
              <button
                type="button"
                :class="['opcao-horario', { selecionado: outboundChoice === '' }]"
                :disabled="busy"
                @click="outboundChoice = ''"
              >
                <span class="mdi mdi-close-circle-outline"></span>
                <div class="horario-info">
                  <span class="hora">Não vou na ida</span>
                  <span class="periodo">Negativa para o trecho de ida</span>
                </div>
              </button>
              <button
                v-for="srv in selectedEligibility.outboundServices"
                :key="srv.id"
                type="button"
                :class="['opcao-horario', { selecionado: outboundChoice === String(srv.id) }]"
                :disabled="busy"
                @click="outboundChoice = String(srv.id)"
              >
                <span class="mdi mdi-bus-clock"></span>
                <div class="horario-info">
                  <span class="hora">{{ srv.targetTimeLabel }}</span>
                  <span class="periodo">{{ srv.name }}</span>
                </div>
              </button>
            </div>
          </div>

          <div class="pergunta-container">
            <div class="pergunta-titulo">
              <span class="pergunta-numero">2</span>
              <span>Trecho de Retorno (serviços autorizados)</span>
            </div>
            <div class="opcoes-horario">
              <button
                type="button"
                :class="['opcao-horario', { selecionado: returnChoice === '' }]"
                :disabled="busy"
                @click="returnChoice = ''"
              >
                <span class="mdi mdi-close-circle-outline"></span>
                <div class="horario-info">
                  <span class="hora">Não volto com o transporte</span>
                  <span class="periodo">Negativa para o trecho de retorno</span>
                </div>
              </button>
              <button
                v-for="srv in selectedEligibility.returnServices"
                :key="srv.id"
                type="button"
                :class="['opcao-horario', { selecionado: returnChoice === String(srv.id) }]"
                :disabled="busy"
                @click="returnChoice = String(srv.id)"
              >
                <span class="mdi mdi-bus-clock"></span>
                <div class="horario-info">
                  <span class="hora">{{ srv.targetTimeLabel }}</span>
                  <span class="periodo">{{ srv.name }}</span>
                </div>
              </button>
            </div>
          </div>

          <button type="submit" class="btn-enviar" :disabled="busy">
            <span class="mdi mdi-check"></span>
            {{ busy ? 'Enviando...' : 'Salvar Resposta de Ida e Retorno' }}
          </button>
        </form>

        <!-- PRORROGAÇÃO: Solicitar inclusão ou troca por trecho (6.1) -->
        <form
          v-else-if="selectedEligibility.dayData.window === 'extension'"
          class="normal-form"
          @submit.prevent="sendExtensionRequest"
        >
          <h4>Janela em Prorrogação — Solicitar Inclusão ou Troca</h4>
          <p class="sub-info">
            Na prorrogação, alterações dependem de decisão da empresa, recálculo de rota e aplicação validada. Sua escolha e alocação anteriores são preservadas até a aplicação.
          </p>

          <div class="opcoes">
            <button
              type="button"
              :class="['opcao-btn', { selecionado: changeLeg === 'outbound' }]"
              :disabled="busy"
              @click="changeLeg = 'outbound'; proposedServiceId = ''"
            >
              Alterar Ida
            </button>
            <button
              type="button"
              :class="['opcao-btn', { selecionado: changeLeg === 'return' }]"
              :disabled="busy"
              @click="changeLeg = 'return'; proposedServiceId = ''"
            >
              Alterar Retorno
            </button>
          </div>

          <div class="opcoes-horario" style="margin-top: 14px">
            <button
              v-for="srv in extensionServices"
              :key="srv.id"
              type="button"
              :class="['opcao-horario', { selecionado: proposedServiceId === String(srv.id) }]"
              :disabled="busy"
              @click="proposedServiceId = String(srv.id)"
            >
              <span class="mdi mdi-clock-edit-outline"></span>
              <div class="horario-info">
                <span class="hora">{{ srv.targetTimeLabel }}</span>
                <span class="periodo">{{ srv.name }}</span>
              </div>
            </button>
            <p v-if="!extensionServices.length" class="sub-info">Nenhum serviço autorizado neste sentido.</p>
          </div>

          <button type="submit" class="btn-enviar" :disabled="busy || !proposedServiceId">
            {{ busy ? 'Enviando pedido...' : 'Enviar Pedido na Prorrogação' }}
          </button>
        </form>

        <!-- Histórico de pedidos na prorrogação deste atendimento -->
        <div v-if="selectedEligibility.requests.length" class="requests-box">
          <h4>Pedidos na Prorrogação deste Atendimento</h4>
          <div v-for="req in selectedEligibility.requests" :key="req.id" class="req-item">
            <div>
              <strong>Pedido #{{ req.id }} ({{ req.leg === 'outbound' ? 'Ida' : 'Retorno' }})</strong> →
              {{ serviceLabel(selectedEligibility, req.proposed_service) }}
              <p class="sub-info">
                Decisão (`status`): <strong>{{ req.status }}</strong> ·
                Aplicação (`application`): <strong>{{ req.application || 'não aplicada' }}</strong>
                <span v-if="req.reason"> · Motivo: {{ req.reason }}</span>
              </p>
            </div>
            <button
              v-if="req.status === 'pending'"
              type="button"
              class="btn-voltar"
              :disabled="busy"
              @click="cancelPendingRequest(req.id)"
            >
              Retirar pedido
            </button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
* {
  box-sizing: border-box;
}

.lista-page {
  padding: 24px 16px 140px;
  min-height: 100vh;
  max-width: 680px;
  margin: 0 auto;
}

.page-header {
  text-align: center;
  margin-bottom: 20px;
}

.header-accent {
  width: 48px;
  height: 4px;
  background: var(--gradient-primary);
  border-radius: 4px;
  margin: 0 auto 12px;
}

.page-header h2 {
  font-size: 1.45rem;
  font-weight: 800;
  color: var(--text);
  margin: 0 0 8px;
}

.header-date {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin: 0 0 12px;
  line-height: 1.5;
}

.notice-banner {
  padding: 12px 16px;
  border-radius: 12px;
  background: rgba(5, 150, 105, 0.12);
  color: var(--success, #059669);
  font-weight: 600;
  margin-bottom: 14px;
}

.error-banner {
  padding: 12px 16px;
  border-radius: 12px;
  background: rgba(220, 38, 38, 0.12);
  color: var(--danger, #dc2626);
  font-weight: 600;
  margin-bottom: 14px;
}

.day-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}

.day-chip {
  padding: 8px 14px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: var(--superfice);
  color: var(--text-muted);
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
}

.day-chip.active {
  border-color: var(--primary);
  background: rgba(223, 128, 26, 0.12);
  color: var(--primary);
}

.questionario-card {
  background: var(--superfice);
  border: 1px solid var(--border);
  border-radius: 20px;
  padding: 24px 20px;
  box-shadow: var(--shadow);
}

.section-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.section-head h3 {
  margin: 0;
  font-size: 1.15rem;
  color: var(--text);
}

.tag-data {
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--primary);
  background: rgba(223, 128, 26, 0.1);
  padding: 4px 12px;
  border-radius: 20px;
}

.sub-info {
  font-size: 0.84rem;
  color: var(--text-muted);
  line-height: 1.45;
  margin: 6px 0;
}

.axes-box {
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 14px;
  margin: 14px 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  font-size: 0.86rem;
  color: var(--text);
}

.axes-box p {
  margin: 4px 0 0;
}

.part-list {
  margin: 6px 0 0;
  padding-left: 18px;
}

.withdraw-box,
.requests-box,
.normal-form {
  margin-top: 18px;
  padding-top: 16px;
  border-top: 1px solid var(--border);
}

.withdraw-box h4,
.requests-box h4,
.normal-form h4 {
  margin: 0 0 10px;
  font-size: 1rem;
  color: var(--text);
}

.pergunta-container {
  margin-bottom: 20px;
}

.pergunta-titulo {
  font-size: 0.98rem;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.pergunta-numero {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  background: var(--primary);
  color: white;
  border-radius: 50%;
  font-size: 0.78rem;
  font-weight: 700;
}

.opcoes {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.opcao-btn {
  flex: 1;
  min-width: 120px;
  padding: 12px 16px;
  font-size: 0.9rem;
  border: 2px solid rgba(223, 128, 26, 0.25);
  border-radius: 12px;
  background: var(--bg);
  color: var(--text);
  cursor: pointer;
  font-weight: 600;
}

.opcao-btn.selecionado {
  background: var(--primary);
  color: white;
  border-color: transparent;
}

.opcoes-horario {
  display: flex;
  gap: 10px;
  flex-direction: column;
}

.opcao-horario {
  padding: 14px 16px;
  border: 2px solid rgba(223, 128, 26, 0.2);
  border-radius: 14px;
  background: var(--bg);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 14px;
  text-align: left;
}

.opcao-horario .mdi {
  font-size: 1.5rem;
  color: var(--primary);
}

.horario-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.opcao-horario .hora {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text);
}

.opcao-horario .periodo {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.opcao-horario.selecionado {
  background: var(--primary);
  border-color: transparent;
}

.opcao-horario.selecionado .mdi,
.opcao-horario.selecionado .hora,
.opcao-horario.selecionado .periodo {
  color: white;
}

.btn-voltar {
  padding: 10px 16px;
  font-size: 0.85rem;
  font-weight: 600;
  background: var(--bg);
  color: var(--text);
  border: 1px solid var(--border);
  border-radius: 10px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.btn-enviar {
  width: 100%;
  padding: 14px;
  font-size: 0.95rem;
  font-weight: 700;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: 14px;
  cursor: pointer;
  margin-top: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-enviar:disabled,
.btn-voltar:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.req-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  padding: 10px 12px;
  border-radius: 10px;
  background: var(--bg);
  border: 1px solid var(--border);
  margin-bottom: 8px;
}

.status-card {
  text-align: center;
  background: var(--superfice);
  border: 1px solid var(--border);
  border-radius: 20px;
  padding: 36px 24px;
  margin: 24px auto;
}

.status-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--text);
  margin: 0 0 8px;
}

.status-msg {
  font-size: 0.88rem;
  color: var(--text-muted);
  margin: 0;
  line-height: 1.5;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--bg);
  border-top-color: var(--primary);
  border-radius: 50%;
  margin: 0 auto 16px;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
