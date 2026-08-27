import { ref, computed } from "vue";
import { useQuestionarioState } from "@/stores/useQuestionnaireState";
import api from "@/api/client";
import { state as authState } from "@/stores/state";

export function useTransportQuestionnaire() {
  const questionarioState = useQuestionarioState();
  const step = ref(1);
  const isSubmitting = ref(false);

  const formatarDataProxima = () => {
    const amanha = new Date();
    amanha.setDate(amanha.getDate() + 1);

    const dia = String(amanha.getDate()).padStart(2, "0");
    const mes = String(amanha.getMonth() + 1).padStart(2, "0");
    const ano = amanha.getFullYear();

    const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const diaSemana = diasSemana[amanha.getDay()];

    return `${diaSemana}, ${dia}/${mes}/${ano}`;
  };

  const formatarData = () => {
    const hoje = new Date();
    const dia = String(hoje.getDate()).padStart(2, "0");
    const mes = String(hoje.getMonth() + 1).padStart(2, "0");
    return `${dia}/${mes}`;
  };

  const podeEnviar = computed(() => {
    if (step.value === 3) {
      return questionarioState.state.responses.transporteIda &&
             questionarioState.state.responses.transporteVolta;
    }
    return false;
  });

  const nextStep = () => {
    if (step.value < 3) {
      step.value++;
    }
  };

  const prevStep = () => {
    if (step.value > 1) {
      step.value--;
    }
  };

  const finalStep = () => {
    if (questionarioState.state.responses.transporteVolta === 'nao') {
      enviarFormulario();
    } else {
      step.value = 3;
    }
  };

  const setResponse = (field, value) => {
    questionarioState.setResponse(field, value);
  };

  const enviarFormulario = async () => {
    if (!podeEnviar.value && questionarioState.state.responses.transporteVolta !== 'nao') {
      return;
    }

    isSubmitting.value = true;

    try {
      const { data: confirmationsData } = await api.get('/confirmations/', {
        params: { user: authState.user?.id },
      });
      const confirmations = Array.isArray(confirmationsData)
        ? confirmationsData
        : confirmationsData?.results || [];
      const currentConfirmation = confirmations[0];

      if (!currentConfirmation) {
        throw new Error('Nenhuma viagem disponível para confirmar presença.');
      }

      const confirm = questionarioState.state.responses.transporteIda === 'sim';

      await api.post('/confirmations/', {
        travel: currentConfirmation.travel,
        confirm,
      });

      questionarioState.submitForm();
    } catch (error) {
      console.error("Erro ao enviar respostas:", error);
    } finally {
      isSubmitting.value = false;
    }
  };

  const resetStep = () => {
    step.value = 1;
  };

  return {
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
    enviarFormulario,
    resetStep
  };
}
