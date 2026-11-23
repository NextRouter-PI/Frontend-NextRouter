import {
  decideChangeRequest,
  applyChangeRequest,
  calculateTravel,
  publishTravel,
  cancelTravel,
  assignTravelVehicle,
  inviteTravelDriver,
} from '@/api/transport'
import { runStoreRequest } from './requestHelper'

export function createTravelActions(storeState) {
  return {
    calcularViagem(travelId, expectedRevision, { signal } = {}) {
      return runStoreRequest(storeState, signal, 'Não foi possível enfileirar o cálculo do percurso.', () =>
        calculateTravel(travelId, expectedRevision, { signal }),
      )
    },

    publicarViagem(travelId, expectedRevision, { signal } = {}) {
      return runStoreRequest(storeState, signal, 'Não foi possível publicar a viagem.', () =>
        publishTravel(travelId, expectedRevision, { signal }),
      )
    },

    cancelarViagem(travelId, { signal } = {}) {
      return runStoreRequest(storeState, signal, 'Não foi possível cancelar a viagem.', () =>
        cancelTravel(travelId, { signal }),
      )
    },

    designarVeiculoViagem(travelId, vehicleId, { signal } = {}) {
      return runStoreRequest(storeState, signal, 'Não foi possível substituir o veículo da viagem.', () =>
        assignTravelVehicle(travelId, vehicleId, { signal }),
      )
    },

    convidarMotoristaViagem(travelId, { driverMembershipId, expiresAt }, { signal } = {}) {
      return runStoreRequest(storeState, signal, 'Não foi possível enviar convite ao motorista.', () =>
        inviteTravelDriver(
          travelId,
          { driver_membership_id: driverMembershipId, expires_at: expiresAt },
          { signal },
        ),
      )
    },

    decidirPedidoAlteracao(requestId, action, reason = '', { signal } = {}) {
      return runStoreRequest(storeState, signal, 'Não foi possível decidir o pedido na prorrogação.', () =>
        decideChangeRequest(requestId, action, reason, { signal }),
      )
    },

    aplicarPedidoAlteracao(requestId, { signal } = {}) {
      return runStoreRequest(storeState, signal, 'Não foi possível aplicar o pedido de alteração.', () =>
        applyChangeRequest(requestId, { signal }),
      )
    },
  }
}
