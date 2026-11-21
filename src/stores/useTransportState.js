import { useOperationExecutionStore } from './useOperationExecutionStore'

export function useTransportState() {
  const store = useOperationExecutionStore()
  return {
    state: store,
    loadPassengerData: store.loadPassengerData,
    loadDriverData: store.loadDriverData,
    iniciarViagemDesignada: store.iniciarViagemDesignada,
    finalizarViagemDesignada: store.finalizarViagemDesignada,
    informarIndisponibilidade: store.informarIndisponibilidade,
    registrarPresencaParticipante: store.registrarPresencaParticipante,
    tratarParadaPercurso: store.tratarParadaPercurso,
    responderConviteMotorista: store.responderConviteMotorista,
  }
}
