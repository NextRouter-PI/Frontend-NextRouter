import { reactive } from "vue";

const state = reactive({
  responses: {
    transporteIda: null, // "sim" ou "nao"
    transporteVolta: null, // "sim" ou "nao"
    horaVolta: null, // "12:00" ou "17:00"
  },
  submitted: false,
  submittedDate: null, // Data de quando o formulário foi enviado
});

function resetResponses() {
  state.responses = {
    transporteIda: null,
    transporteVolta: null,
    horaVolta: null,
  };
  state.submitted = false;
}

function setResponse(field, value) {
  state.responses[field] = value;

  // Se mudar a resposta de transporteVolta para "nao", limpa a hora
  if (field === "transporteVolta" && value === "nao") {
    state.responses.horaVolta = null;
  }
}

function submitForm() {
  // Validar se as duas primeiras perguntas foram respondidas
  if (state.responses.transporteIda && state.responses.transporteVolta) {
    state.submitted = true;
    state.submittedDate = new Date().toDateString();
    return true;
  }
  return false;
}

function canAnswerToday() {
  if (!state.submittedDate) return true;

  const today = new Date().toDateString();
  return state.submittedDate !== today;
}

export function useQuestionarioState() {
  return {
    state,
    resetResponses,
    setResponse,
    submitForm,
    canAnswerToday,
  };
}
