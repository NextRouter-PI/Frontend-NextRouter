//// /* Arquivo de função de questionario de presença nas rotas
import { reactive } from "vue";

const state = reactive({
  responses: {
    transporteIda: null,
    transporteVolta: null,
    horaVolta: null,
  },
  submitted: false,
  submittedDate: null,
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

  if (field === "transporteVolta" && value === "nao") {
    state.responses.horaVolta = null;
  }
}

function submitForm() {
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
// */
