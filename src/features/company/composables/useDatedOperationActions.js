/**
 * Cria handlers nomeados para as ações de operação datada, mantendo o template enxuto.
 */
export function createDatedOperationHandlers({
  store,
  scope,
  calcTravelId,
  runAction,
}) {
  const handleDecideRequest = ({ req, action, reason }) =>
    runAction(
      () => store.decidirPedidoAlteracao(req.id, action, reason.trim(), { signal: scope.signal }),
      action === 'approve'
        ? 'Pedido aprovado e em preparação de cálculo.'
        : 'Pedido recusado. A escolha e a alocação anteriores foram preservadas.',
      'Não foi possível decidir o pedido.',
    )

  const handleApplyRequest = (req) =>
    runAction(
      () => store.aplicarPedidoAlteracao(req.id, { signal: scope.signal }),
      'Alteração na prorrogação aplicada às viagens após cálculo válido.',
      'Não foi possível aplicar o pedido.',
    )

  const handleCloseDayWindow = (day) =>
    runAction(
      () => store.fecharDiaAtendimento(day.id, { signal: scope.signal }),
      'Janela normal encerrada e alocações preparadas.',
      'Não foi possível preparar alocações deste dia.',
    )

  const handleReviseDay = (day) =>
    runAction(
      () => store.revisarDiaAtendimento(day.id, day.revision, { signal: scope.signal }),
      (res) => `Atendimento revisado para revisão ${res.revision}.`,
      'Não foi possível revisar o atendimento.',
    )

  const handlePublishTravel = (travel) =>
    runAction(
      () => store.publicarViagem(travel.id, travel.revision, { signal: scope.signal }),
      (res) => `Viagem #${travel.id} publicada na revisão ${res.revision}.`,
      'Não foi possível publicar a viagem.',
    )

  const handleAssignVehicle = ({ travel, vehicleId, onSuccess }) =>
    runAction(
      () => store.designarVeiculoViagem(travel.id, Number(vehicleId), { signal: scope.signal }),
      'Veículo substituído. Recalcule e republique a revisão da viagem.',
      'Não foi possível substituir o veículo.',
      onSuccess,
    )

  const handleCalculateTravel = (travel) =>
    runAction(
      () => store.calcularViagem(travel.id, travel.revision, { signal: scope.signal }),
      'Cálculo de percurso iniciado. O trajeto aparecerá no mapa automaticamente.',
      'Não foi possível solicitar o cálculo.',
    )

  const handlePublishModalTravel = (travel) =>
    runAction(
      () => store.publicarViagem(travel.id, travel.revision, { signal: scope.signal }),
      'Viagem publicada com sucesso.',
      'Não foi possível publicar a viagem.',
      () => {
        calcTravelId.value = null
      },
    )

  return {
    handleDecideRequest,
    handleApplyRequest,
    handleCloseDayWindow,
    handleReviseDay,
    handlePublishTravel,
    handleAssignVehicle,
    handleCalculateTravel,
    handlePublishModalTravel,
  }
}
