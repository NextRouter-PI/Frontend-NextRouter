<template>
  <div class="lista-page">
    <div class="page-header">
      <div class="header-accent"></div>
      <h2>Transporte do Amanhã</h2>
      <p class="header-date">{{ formatarDataProxima() }}</p>
    </div>

    <div v-if="!questionarioState.state.submitted && questionarioState.canAnswerToday()" class="questionario-card">
      <div class="progress-indicator">
        <div class="progress-steps">
          <div class="step" :class="{ active: step >= 1, completed: step > 1 }">1</div>
          <div class="step-line" :class="{ active: step > 1 }"></div>
          <div class="step" :class="{ active: step >= 2, completed: step > 2 }">2</div>
          <div class="step-line" :class="{ active: step > 2 }"></div>
          <div class="step" :class="{ active: step >= 3 }">3</div>
        </div>
      </div>

      <div class="pergunta-container" :class="{ 'fade-in': step === 1 }" v-show="step === 1">
        <div class="pergunta-titulo">
          <span class="pergunta-numero">1</span>
          <span>Vou com o transporte?</span>
          <span class="tag-data">{{ formatarData() }}</span>
        </div>

        <div class="opcoes">
          <button
            @click="setResponse('transporteIda', 'sim'); nextStep()"
            :class="['opcao-btn', { 'selecionado': questionarioState.state.responses.transporteIda === 'sim' }]"
          >
            <span class="mdi mdi-check-circle-outline"></span>
            Sim
          </button>
          <button
            @click="setResponse('transporteIda', 'nao'); nextStep()"
            :class="['opcao-btn', { 'selecionado': questionarioState.state.responses.transporteIda === 'nao' }]"
          >
            <span class="mdi mdi-close-circle-outline"></span>
            Não
          </button>
        </div>
      </div>

      <div class="pergunta-container" :class="{ 'fade-in': step === 2 }" v-show="step === 2">
        <div class="pergunta-titulo">
          <span class="pergunta-numero">2</span>
          <span>Voltarei com o transporte?</span>
        </div>

        <div class="opcoes">
          <button
            @click="setResponse('transporteVolta', 'sim'); nextStep()"
            :class="['opcao-btn', { 'selecionado': questionarioState.state.responses.transporteVolta === 'sim' }]"
          >
            <span class="mdi mdi-check-circle-outline"></span>
            Sim
          </button>
          <button
            @click="setResponse('transporteVolta', 'nao'); finalStep()"
            :class="['opcao-btn', { 'selecionado': questionarioState.state.responses.transporteVolta === 'nao' }]"
          >
            <span class="mdi mdi-close-circle-outline"></span>
            Não
          </button>
        </div>
      </div>

      <div class="pergunta-container" :class="{ 'fade-in': step === 3 }" v-show="step === 3">
        <div class="pergunta-titulo">
          <span class="pergunta-numero">3</span>
          <span>Voltarei que horas?</span>
        </div>

        <div class="opcoes-horario">
          <button
            @click="setResponse('horaVolta', '12:00'); finalStep()"
            :class="['opcao-horario', { 'selecionado': questionarioState.state.responses.horaVolta === '12:00' }]"
          >
            <span class="mdi mdi-weather-sunset"></span>
            <div class="horario-info">
              <span class="hora">12:00</span>
              <span class="periodo">Meio-dia</span>
            </div>
          </button>
          <button
            @click="setResponse('horaVolta', '17:00'); finalStep()"
            :class="['opcao-horario', { 'selecionado': questionarioState.state.responses.horaVolta === '17:00' }]"
          >
            <span class="mdi mdi-weather-night"></span>
            <div class="horario-info">
              <span class="hora">17:00</span>
              <span class="periodo">Tarde</span>
            </div>
          </button>
        </div>
      </div>

      <div class="navigation-buttons" v-if="step > 1 && step < 3">
        <button @click="prevStep" class="btn-voltar">
          <span class="mdi mdi-arrow-left"></span>
          Voltar
        </button>
      </div>

      <button
        v-if="step === 3 && podeEnviar"
        @click="enviarFormulario"
        class="btn-enviar"
      >
        <span class="mdi mdi-check"></span>
        Confirmar Respostas
      </button>
    </div>

    <div v-else-if="isSubmitting" class="status-card">
      <div class="spinner"></div>
      <p class="status-msg">Enviando respostas...</p>
    </div>

    <div v-else-if="questionarioState.state.submitted" class="status-card success">
      <div class="status-icon">
        <span class="mdi mdi-check-circle"></span>
      </div>
      <h3 class="status-title">Resposta registrada!</h3>
      <p class="status-msg">Aguarde até amanhã para a próxima enquete</p>
      <div class="next-date-tag">
        <span class="mdi mdi-calendar"></span>
        Próxima enquete: {{ formatarDataProxima() }}
      </div>
    </div>

    <div v-else-if="questionarioState.state.hasAnsweredToday" class="status-card">
      <div class="status-icon thanks">
        <span class="mdi mdi-hand-wave"></span>
      </div>
      <h3 class="status-title">Obrigado por responder!</h3>
      <p class="status-msg">Você já respondeu a enquete de hoje</p>
      <div class="next-date-tag">
        <span class="mdi mdi-calendar"></span>
        Próxima enquete: {{ formatarDataProxima() }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { useTransportQuestionnaire } from "@/composables/useTransportQuestionnaire";

const {
  step,
  isSubmitting,
  questionarioState,
  podeEnviar,
  formatarDataProxima,
  formatarData,
  nextStep,
  prevStep,
  finalStep,
  setResponse,
  enviarFormulario
} = useTransportQuestionnaire();
</script>

<style scoped>
* {
  box-sizing: border-box;
}

.lista-page {
  padding: 24px 16px;
  min-height: 100vh;
}

.page-header {
  text-align: center;
  margin-bottom: 32px;
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;
}

.header-accent {
  width: 48px;
  height: 4px;
  background: var(--gradient-primary);
  border-radius: 4px;
  margin: 0 auto 16px;
}

.page-header h2 {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--text);
  margin: 0 0 6px;
}

.header-date {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin: 0;
  font-weight: 500;
}

.questionario-card {
  background: var(--superfice);
  border: 1px solid rgba(223, 128, 26, 0.12);
  border-radius: 20px;
  padding: 28px 24px;
  max-width: 500px;
  margin: 0 auto;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  animation: slideUp 0.4s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(24px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Progress */
.progress-indicator {
  margin-bottom: 32px;
}

.progress-steps {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 8px;
}

.step {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: var(--bg);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.9rem;
  color: var(--text-muted);
  transition: all 0.3s ease;
  position: relative;
  z-index: 2;
}

.step.active {
  background: var(--primary);
  color: white;
  box-shadow: var(--shadow-primary);
}

.step.completed {
  background: var(--primary);
  color: white;
}

.step-line {
  flex: 1;
  height: 3px;
  background: var(--bg);
  margin: 0 6px;
  transition: all 0.3s ease;
}

.step-line.active {
  background: var(--primary);
}

/* Questions */
.pergunta-container {
  margin-bottom: 24px;
  animation: fadeIn 0.35s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateX(16px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.pergunta-titulo {
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.pergunta-numero {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  background: var(--primary);
  color: white;
  border-radius: 50%;
  font-size: 0.8rem;
  font-weight: 700;
  flex-shrink: 0;
}

.tag-data {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--text-muted);
  background: var(--bg);
  padding: 4px 12px;
  border-radius: 20px;
  margin-left: auto;
}

/* Options */
.opcoes {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}

.opcao-btn {
  flex: 1;
  min-width: 120px;
  padding: 16px 20px;
  font-size: 0.95rem;
  border: 2px solid rgba(223, 128, 26, 0.2);
  border-radius: 14px;
  background: var(--bg);
  color: var(--text);
  cursor: pointer;
  transition: all 0.25s ease;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.opcao-btn .mdi {
  font-size: 1.2rem;
}

.opcao-btn:hover {
  border-color: var(--primary);
  background: rgba(223, 128, 26, 0.06);
  transform: translateY(-2px);
}

.opcao-btn.selecionado {
  background: var(--primary);
  color: white;
  border-color: transparent;
}

.opcoes-horario {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-direction: column;
}

.opcao-horario {
  padding: 18px 20px;
  border: 2px solid rgba(223, 128, 26, 0.2);
  border-radius: 14px;
  background: var(--bg);
  cursor: pointer;
  transition: all 0.25s ease;
  display: flex;
  align-items: center;
  gap: 16px;
}

.opcao-horario .mdi {
  font-size: 1.6rem;
  color: var(--primary);
  flex-shrink: 0;
}

.horario-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.opcao-horario .hora {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text);
}

.opcao-horario .periodo {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.opcao-horario:hover {
  border-color: var(--primary);
  background: rgba(223, 128, 26, 0.06);
  transform: translateX(4px);
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

.navigation-buttons {
  margin-top: 20px;
}

.btn-voltar {
  width: 100%;
  padding: 14px 24px;
  font-size: 0.9rem;
  font-weight: 600;
  background: var(--bg);
  color: var(--text-muted);
  border: 1px solid rgba(223, 128, 26, 0.15);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.25s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-voltar:hover {
  background: rgba(223, 128, 26, 0.06);
  color: var(--primary);
  transform: translateX(-3px);
}

.btn-enviar {
  width: 100%;
  padding: 16px;
  font-size: 0.95rem;
  font-weight: 700;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: 14px;
  cursor: pointer;
  margin-top: 20px;
  transition: all 0.25s ease;
  box-shadow: var(--shadow-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-enviar:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(223, 128, 26, 0.4);
}

.btn-enviar:active {
  transform: translateY(0);
}

/* Status cards */
.status-card {
  text-align: center;
  background: var(--superfice);
  border: 1px solid rgba(223, 128, 26, 0.12);
  border-radius: 20px;
  max-width: 400px;
  margin: 60px auto;
  padding: 48px 28px;
  animation: scaleUp 0.4s ease;
}

@keyframes scaleUp {
  from {
    opacity: 0;
    transform: scale(0.92);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.status-icon {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  background: linear-gradient(135deg, var(--success) 0%, #1e8449 100%);
}

.status-icon .mdi {
  font-size: 2.4rem;
  color: white;
}

.status-icon.thanks {
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%);
}

.status-icon.thanks .mdi {
  font-size: 2.2rem;
}

.status-title {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--text);
  margin: 0 0 8px;
}

.status-msg {
  font-size: 0.88rem;
  color: var(--text-muted);
  margin: 0 0 20px;
}

.next-date-tag {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 0.82rem;
  color: var(--text-muted);
  background: var(--bg);
  padding: 10px 18px;
  border-radius: 999px;
  font-weight: 500;
}

.next-date-tag .mdi {
  font-size: 1rem;
  color: var(--primary);
}

.spinner {
  width: 44px;
  height: 44px;
  border: 4px solid var(--bg);
  border-top-color: var(--primary);
  border-radius: 50%;
  margin: 0 auto 20px;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (min-width: 768px) {
  .lista-page {
    padding: 32px 24px;
  }

  .questionario-card {
    padding: 36px 32px;
  }

  .opcoes-horario {
    flex-direction: row;
  }

  .opcao-horario {
    flex: 1;
    justify-content: center;
  }

  .opcao-btn {
    padding: 16px 28px;
  }
}
</style>
