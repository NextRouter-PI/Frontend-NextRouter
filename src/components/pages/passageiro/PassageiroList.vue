<template>
  <div class="usuarios-list-container">
    <div v-if="!questionarioState.state.submitted && questionarioState.canAnswerToday()" class="questionario-form">
      <div class="questionario-header">
        <h2>Transporte do Amanhã</h2>
        <p class="data-proxima">{{ formatarDataProxima() }}</p>
      </div>

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
          Vou com o transporte?
          <span class="data-pergunta">{{ formatarData() }}</span>
        </div>

        <div class="opcoes">
          <button
            @click="setResponse('transporteIda', 'sim'); nextStep()"
            :class="['opcao-btn', { 'selecionado': questionarioState.state.responses.transporteIda === 'sim' }]"
          >
            Sim
          </button>
          <button
            @click="setResponse('transporteIda', 'nao'); nextStep()"
            :class="['opcao-btn', { 'selecionado': questionarioState.state.responses.transporteIda === 'nao' }]"
          >
            Não
          </button>
        </div>
      </div>

      <div class="pergunta-container" :class="{ 'fade-in': step === 2 }" v-show="step === 2">
        <div class="pergunta-titulo">
          <span class="pergunta-numero">2</span>
          Voltarei com o transporte?
        </div>

        <div class="opcoes">
          <button
            @click="setResponse('transporteVolta', 'sim'); nextStep()"
            :class="['opcao-btn', { 'selecionado': questionarioState.state.responses.transporteVolta === 'sim' }]"
          >
            Sim
          </button>
          <button
            @click="setResponse('transporteVolta', 'nao'); finalStep()"
            :class="['opcao-btn', { 'selecionado': questionarioState.state.responses.transporteVolta === 'nao' }]"
          >
            Não
          </button>
        </div>
      </div>

      <div class="pergunta-container" :class="{ 'fade-in': step === 3 }" v-show="step === 3">
        <div class="pergunta-titulo">
          <span class="pergunta-numero">3</span>
          Voltarei que horas?
        </div>

        <div class="opcoes-horario">
          <button
            @click="setResponse('horaVolta', '12:00'); finalStep()"
            :class="['opcao-horario', { 'selecionado': questionarioState.state.responses.horaVolta === '12:00' }]"
          >
            <span class="hora">12:00</span>
            <span class="periodo">Meio-dia</span>
          </button>
          <button
            @click="setResponse('horaVolta', '17:00'); finalStep()"
            :class="['opcao-horario', { 'selecionado': questionarioState.state.responses.horaVolta === '17:00' }]"
          >
            <span class="hora">17:00</span>
            <span class="periodo">Tarde</span>
          </button>
        </div>
      </div>

      <div class="navigation-buttons" v-if="step > 1 && step < 3">
        <button @click="prevStep" class="btn-voltar">
          ← Voltar
        </button>
      </div>

      <button
        v-if="step === 3 && podeEnviar"
        @click="enviarFormulario"
        class="btn-enviar"
      >
        Confirmar Respostas ✓
      </button>
    </div>

    <div v-else-if="isSubmitting" class="loading-container">
      <div class="spinner"></div>
      <p>Enviando respostas...</p>
    </div>

    <div v-else-if="questionarioState.state.submitted" class="sucesso-container">
      <div class="icone-certinho">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </div>
      <p class="mensagem-sucesso">Resposta registrada com sucesso!</p>
      <p class="mensagem-aguarde">Aguarde até amanhã para a próxima enquete</p>
      <div class="data-proxima-resposta">
        Próxima enquete: {{ formatarDataProxima() }}
      </div>
    </div>

    <div v-else-if="questionarioState.state.hasAnsweredToday" class="agradecimento-container">
      <div class="icone-obrigado">🙏</div>
      <p class="mensagem-agradecimento">Obrigado por responder!</p>
      <p class="mensagem-aguarde">Você já respondeu a enquete de hoje</p>
      <div class="data-proxima-resposta">
        Próxima enquete: {{ formatarDataProxima() }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { useTransporteQuestionario } from "@/composables/useTransporteQuestionario";

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
} = useTransporteQuestionario();
</script>

<style scoped>
* {
  box-sizing: border-box;
}

.usuarios-list-container {
  padding: 16px;
  min-height: 100vh;
}

.questionario-form {
  background-color: white;
  border-radius: 20px;
  padding: 24px 20px;
  max-width: 500px;
  margin: 60px auto 0;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  animation: slideUp 0.5s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.questionario-header {
  text-align: center;
  margin-bottom: 30px;
}

.questionario-header h2 {
  font-size: 28px;
  font-weight: 700;
  background: var(--primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 8px 0;
}

.data-proxima {
  font-size: 14px;
  color: #666;
  margin: 0;
  font-weight: 500;
}

.progress-indicator {
  margin-bottom: 30px;
}

.progress-steps {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}

.step {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  color: #999;
  transition: all 0.3s ease;
  position: relative;
  z-index: 2;
}

.step.active {
  background: var(--primary);
  color: white;
  box-shadow: 0 4px 10px rgba(102, 126, 234, 0.4);
}

.step.completed {
  background-color: var(--primary);
  color: white;
}

.step-line {
  flex: 1;
  height: 3px;
  background-color: #f0f0f0;
  margin: 0 10px;
  transition: all 0.3s ease;
}

.step-line.active {
  background: var(--primary);
}

.pergunta-container {
  margin-bottom: 30px;
  animation: fadeIn 0.5s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.pergunta-titulo {
  font-size: 18px;
  font-weight: 600;
  color: #333;
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
  width: 32px;
  height: 32px;
  background: var(--primary);
  color: white;
  border-radius: 50%;
  font-size: 14px;
  font-weight: bold;
}

.data-pergunta {
  font-size: 13px;
  font-weight: 400;
  color: #999;
  background-color: #f5f5f5;
  padding: 4px 12px;
  border-radius: 20px;
}

.opcoes {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}

.opcao-btn {
  flex: 1;
  min-width: 120px;
  padding: 14px 20px;
  font-size: 16px;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  background-color: white;
  color: #666;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.opcao-btn:hover {
  border-color: var(--primary);
  background-color: #f8f9ff;
  transform: translateY(-2px);
}

.opcao-btn.selecionado {
  background: var(--primary);
  color: white;
  border-color: transparent;
}

.opcoes-horario {
  display: flex;
  gap: 15px;
  justify-content: center;
  flex-direction: column;
}

.opcao-horario {
  padding: 20px;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  background-color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.opcao-horario .hora {
  font-size: 20px;
  font-weight: 700;
  color: #333;
}

.opcao-horario .periodo {
  font-size: 14px;
  color: #999;
}

.opcao-horario:hover {
  border-color: var(--primary);
  background-color: #f8f9ff;
  transform: translateX(5px);
}

.opcao-horario.selecionado {
  background: var(--primary);
  border-color: transparent;
}

.opcao-horario.selecionado .hora,
.opcao-horario.selecionado .periodo {
  color: white;
}

.navigation-buttons {
  margin-top: 20px;
}

.btn-voltar {
  padding: 12px 24px;
  font-size: 14px;
  font-weight: 600;
  background-color: #f5f5f5;
  color: #666;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
  width: 100%;
}

.btn-voltar:hover {
  transform: translateX(-2px);
}

.btn-enviar {
  width: 100%;
  padding: 16px;
  font-size: 16px;
  font-weight: 700;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  margin-top: 20px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.btn-enviar:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.btn-enviar:active {
  transform: translateY(0);
}

.loading-container {
  text-align: center;
  padding: 40px;
  background-color: white;
  border-radius: 20px;
  max-width: 400px;
  margin: 100px auto;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #f0f0f0;
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

.sucesso-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: white;
  border-radius: 20px;
  max-width: 400px;
  margin: 100px auto;
  padding: 40px 20px;
  animation: scaleUp 0.5s ease;
}

@keyframes scaleUp {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.icone-certinho {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
  animation: bounce 0.5s ease;
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.icone-certinho svg {
  width: 50px;
  height: 50px;
  color: white;
  stroke-width: 3;
}

.mensagem-sucesso {
  font-size: 20px;
  font-weight: 700;
  color: #333;
  margin: 0 0 8px 0;
  text-align: center;
}

.mensagem-aguarde {
  font-size: 14px;
  color: #666;
  margin: 0 0 16px 0;
  text-align: center;
}

.agradecimento-container {
  text-align: center;
  background-color: white;
  border-radius: 20px;
  max-width: 400px;
  margin: 100px auto;
  padding: 40px 20px;
}

.icone-obrigado {
  font-size: 60px;
  margin-bottom: 20px;
}

.mensagem-agradecimento {
  font-size: 20px;
  font-weight: 700;
  color: #333;
  margin: 0 0 8px 0;
}

.data-proxima-resposta {
  font-size: 13px;
  color: #999;
  margin-top: 20px;
  padding: 10px;
  background-color: #f5f5f5;
  border-radius: 20px;
  display: inline-block;
}

@media (min-width: 768px) {
  .usuarios-list-container {
    padding: 24px;
  }

  .questionario-form {
    padding: 40px;
  }

  .opcoes-horario {
    flex-direction: row;
  }

  .opcao-horario {
    flex: 1;
    justify-content: center;
    gap: 12px;
  }

  .opcao-btn {
    padding: 14px 30px;
  }
}
</style>