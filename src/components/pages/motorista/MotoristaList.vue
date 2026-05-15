<template>
  <div class="usuarios-list-container">
    <div v-if="!questionarioState.state.submitted && questionarioState.canAnswerToday()" class="questionario-form">
      <div class="questionario-header">
        <h2>Questionário</h2>
        <p class="data-proxima">{{ formatarDataProxima() }}</p>
      </div>

      <div class="pergunta-container">
        <div class="pergunta-titulo">
          Vou com o transporte?
          <span class="data-pergunta">{{ formatarData() }}</span>
        </div>

        <div class="opcoes">
          <button
            @click="setResponse('transporteIda', 'sim')"
            :class="['opcao-btn', { 'selecionado': questionarioState.state.responses.transporteIda === 'sim' }]"
          >
            Sim
          </button>
          <button
            @click="setResponse('transporteIda', 'nao')"
            :class="['opcao-btn', { 'selecionado': questionarioState.state.responses.transporteIda === 'nao' }]"
          >
            Não
          </button>
        </div>
      </div>

      <div class="separator-line"></div>

      <div class="pergunta-container">
        <div class="pergunta-titulo">Voltarei com o transporte?</div>

        <div class="opcoes">
          <button
            @click="setResponse('transporteVolta', 'sim')"
            :class="['opcao-btn', { 'selecionado': questionarioState.state.responses.transporteVolta === 'sim' }]"
          >
            Sim
          </button>
          <button
            @click="setResponse('transporteVolta', 'nao')"
            :class="['opcao-btn', { 'selecionado': questionarioState.state.responses.transporteVolta === 'nao' }]"
          >
            Não
          </button>
        </div>
      </div>

      <div v-if="questionarioState.state.responses.transporteVolta === 'sim'" class="pergunta-container">
        <div class="separator-line"></div>

        <div class="pergunta-titulo">Voltarei que horas?</div>

        <div class="opcoes">
          <button
            @click="setResponse('horaVolta', '12:00')"
            :class="['opcao-btn', { 'selecionado': questionarioState.state.responses.horaVolta === '12:00' }]"
          >
            12:00
          </button>
          <button
            @click="setResponse('horaVolta', '17:00')"
            :class="['opcao-btn', { 'selecionado': questionarioState.state.responses.horaVolta === '17:00' }]"
          >
            17:00
          </button>
        </div>
      </div>

      <button
        @click="enviarFormulario"
        :disabled="!podeEnviar"
        :class="['btn-enviar', { 'desabilitado': !podeEnviar }]"
      >
        Enviar
      </button>
    </div>

    <div v-else-if="questionarioState.state.submitted" class="sucesso-container">
      <div class="icone-certinho">✓</div>
      <p class="mensagem-sucesso">Aguarde até a próxima enquete</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useQuestionarioState } from "@/store/useQuestionarioState";
import { useTransporteQuestionario } from "@/composables/useTransporteQuestionario";

const questionarioState = useQuestionarioState();
const { formatarData } = useTransporteQuestionario();

const formatarDataProxima = () => {
  const amanha = new Date();
  amanha.setDate(amanha.getDate() + 1);

  const dia = String(amanha.getDate()).padStart(2, "0");
  const mes = String(amanha.getMonth() + 1).padStart(2, "0");
  const ano = amanha.getFullYear();

  return `${dia}/${mes}/${ano}`;
};

const podeEnviar = computed(() => {
  return (
    questionarioState.state.responses.transporteIda &&
    questionarioState.state.responses.transporteVolta
  );
});

const setResponse = (field, value) => {
  questionarioState.setResponse(field, value);
};

const enviarFormulario = () => {
  if (questionarioState.submitForm()) {
    console.log("Respostas enviadas:", questionarioState.state.responses);
  }
};
</script>

<style scoped>
.usuarios-list-container {
  padding: 20px;
  background-color: #f5f5f5;
  min-height: 100vh;
}

.questionario-form {
  background-color: white;
  border-radius: 8px;
  padding: 30px;
  max-width: 600px;
  margin: 100px auto 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.questionario-header {
  text-align: center;
  margin-bottom: 30px;
}

.questionario-header h2 {
  font-size: 24px;
  color: #333;
  margin: 0 0 10px 0;
}

.data-proxima {
  font-size: 14px;
  color: #666;
  margin: 0;
  text-transform: capitalize;
}

.pergunta-container {
  margin-bottom: 25px;
}

.pergunta-titulo {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.data-pergunta {
  font-size: 14px;
  font-weight: 400;
  color: #666;
  text-transform: capitalize;
}

.opcoes {
  display: flex;
  gap: 15px;
  justify-content: center;
}

.opcao-btn {
  padding: 12px 30px;
  font-size: 16px;
  border: 2px solid #ddd;
  border-radius: 6px;
  background-color: white;
  color: #333;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
}

.opcao-btn:hover {
  border-color: #ff8c00;
  background-color: #fff8f0;
}

.opcao-btn.selecionado {
  background-color: #333;
  color: white;
  border-color: #333;
}

.separator-line {
  height: 3px;
  background-color: #ff8c00;
  margin: 25px 0;
}

.btn-enviar {
  width: 100%;
  padding: 14px;
  font-size: 16px;
  font-weight: 600;
  background-color: #ff8c00;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  margin-top: 20px;
  transition: all 0.3s ease;
}

.btn-enviar:hover:not(.desabilitado) {
  background-color: #e67e00;
}

.btn-enviar.desabilitado {
  background-color: #ccc;
  cursor: not-allowed;
  opacity: 0.6;
}

.sucesso-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: #f5f5f5;
}

.icone-certinho {
  font-size: 80px;
  color: #4caf50;
  margin-bottom: 20px;
  font-weight: bold;
  width: 100px;
  height: 100px;
  border: 3px solid #4caf50;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mensagem-sucesso {
  font-size: 18px;
  color: #666;
  text-align: center;
}
</style>
