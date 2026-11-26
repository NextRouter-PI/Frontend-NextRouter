import { computed, onUnmounted, shallowRef, watch } from 'vue'
import { useTransportState } from '@/stores/useTransportState'
import { useTravelTracking } from '@/features/transport/composables/useTravelTracking'
import { useAdaptivePolling } from '@/composables/useAdaptivePolling'
import { useToast } from '@/composables/useToast'
import { estimateEtaMinutes, formatDistanceLabel, haversineMeters } from '@/utils/geo'
import { readTravelApproach } from '@/api/transport'

// Recalcula o caminho até a próxima parada quando ela muda ou o motorista se afasta de onde foi o último cálculo.
const APPROACH_REFRESH_METERS = 200
const APPROACH_MIN_INTERVAL_MS = 15_000

/**
 * Coordena dados ao vivo, HUD da próxima parada, prompt de aproximação e polling da Home do motorista.
 */
export function useDriverHomeLive({ scope }) {
  const { state: transportState, loadDriverData, registrarPresencaParticipante, desembarcarTodos, finalizarViagemDesignada } =
    useTransportState()
  const { state: tracking, startDriverTracking, startViewerTracking, stopTracking } = useTravelTracking()
  const { showToast } = useToast()

  const is3dMode = shallowRef(true)
  const dismissedPromptId = shallowRef(null)

  const driverTransport = computed(() => transportState.driver)
  const isTravelActive = computed(() => driverTransport.value?.travelStatus === 'in_progress')
  const pendingBoardingPassengers = computed(() =>
    (driverTransport.value?.participations || []).filter((p) => p.status === 'allocated'),
  )
  const onBoardPassengers = computed(() =>
    (driverTransport.value?.participations || []).filter((p) => p.status === 'on_board'),
  )
  // Próxima parada a cumprir: não tratada e com alguém ainda para embarcar/desembarcar (a última sempre conta).
  // Mesma regra do servidor, para o "embarcou" já levar a linha laranja para a casa seguinte.
  const nextPendingStop = computed(() => {
    const stops = driverTransport.value?.stops || []
    const statusById = new Map((driverTransport.value?.participations || []).map((p) => [p.id, p.status]))
    return (
      stops.find((stop, index) => {
        if (stop.handled_at || ['handled', 'completed', 'skipped'].includes(stop.state)) return false
        const items = stop.participants || []
        if (index === stops.length - 1 || !items.length) return true
        return items.some((item) => {
          const status = statusById.get(item.participation)
          return (item.operation === 'board' && status === 'allocated') || (item.operation === 'drop' && status === 'on_board')
        })
      }) || null
    )
  })

  const nextStopDistanceMeters = computed(() => {
    const pt = nextPendingStop.value?.point_snapshot
    if (tracking.latitude == null || tracking.longitude == null || pt?.latitude == null || pt?.longitude == null) {
      return null
    }
    return haversineMeters(tracking.latitude, tracking.longitude, Number(pt.latitude), Number(pt.longitude))
  })

  const nextStopHud = computed(() => {
    if (!nextPendingStop.value) return null
    const names = (nextPendingStop.value.participants || []).map((p) => p.passenger_name).filter(Boolean).join(', ')
    const dist = nextStopDistanceMeters.value
    return {
      title: nextPendingStop.value.point_snapshot?.name || `Parada #${nextPendingStop.value.position}`,
      subtitle: names || `Parada #${nextPendingStop.value.position}`,
      distanceLabel: dist != null ? formatDistanceLabel(dist) : '',
      etaLabel: dist != null ? `${estimateEtaMinutes(dist)} min` : '',
      // Horário esperado na parada (previsto na rota + atraso atual), calculado pelo servidor.
      expectedLabel: nextPendingStop.value.expected_at
        ? new Date(nextPendingStop.value.expected_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        : '',
      delayMinutes: Math.round((nextPendingStop.value.delay_seconds || 0) / 60),
    }
  })

  const approachingPassenger = computed(() => {
    if (!isTravelActive.value) return null
    const wsId = tracking.lastApproaching?.participationId
    if (wsId) {
      const found = pendingBoardingPassengers.value.find((p) => p.id === wsId)
      if (found && dismissedPromptId.value !== found.id) {
        return { participation: found, distanceMeters: tracking.lastApproaching.distanceMeters }
      }
    }
    if (tracking.latitude != null && tracking.longitude != null) {
      for (const p of pendingBoardingPassengers.value) {
        if (dismissedPromptId.value === p.id) continue
        const pt = p.point_snapshot
        if (pt?.latitude == null || pt?.longitude == null) continue
        const dist = haversineMeters(tracking.latitude, tracking.longitude, Number(pt.latitude), Number(pt.longitude))
        if (dist <= 150) return { participation: p, distanceMeters: Math.round(dist) }
      }
    }
    return null
  })

  async function quickPresence(participation, kind) {
    if (transportState.busy || !isTravelActive.value) return
    // A ação espera o id; antes recebia o objeto inteiro e a requisição ia para ".../[object Object]/record/".
    const ok = await registrarPresencaParticipante(participation.id, kind)
    if (ok) {
      showToast(
        kind === 'boarded'
          ? `Embarque de ${participation.name || 'passageiro'} confirmado!`
          : `Ausência de ${participation.name || 'passageiro'} registrada.`,
        'success',
      )
    } else if (transportState.error) {
      showToast(transportState.error, 'error')
    }
  }

  // Viagem em andamento: com consentimento, este aparelho volta a enviar o GPS (ex.: depois de recarregar a
  // página); sem consentimento, só acompanha a posição.
  watch(
    () => [driverTransport.value?.travelId, driverTransport.value?.travelStatus, driverTransport.value?.locationConsentAt],
    ([travelId, status, consentAt]) => {
      if (!travelId || status !== 'in_progress') return
      if (consentAt) startDriverTracking(travelId)
      else if (!tracking.tracking) startViewerTracking(travelId)
    },
    { immediate: true },
  )

  watch(
    () => tracking.lastPresence?.at,
    () => {
      if (scope.current() && driverTransport.value?.travelId) loadDriverData(driverTransport.value.travelId)
    },
  )

  // Trajeto de rua da posição atual por todas as paradas abertas até o fim: um trecho ([lng, lat][]) por parada.
  const approach = shallowRef(null)
  let approachFrom = null
  let approachBusy = false

  async function refreshApproach() {
    const travelId = driverTransport.value?.travelId
    const stopId = nextPendingStop.value?.id
    const { latitude: lat, longitude: lng } = tracking
    if (!isTravelActive.value || !travelId || !stopId || lat == null || lng == null) {
      if (!isTravelActive.value) approach.value = null
      return
    }
    const now = Date.now()
    const sameStop = approachFrom?.stopId === stopId
    if (approachBusy || (sameStop && now - approachFrom.at < APPROACH_MIN_INTERVAL_MS)) return
    if (sameStop && haversineMeters(lat, lng, approachFrom.lat, approachFrom.lng) < APPROACH_REFRESH_METERS) return
    approachBusy = true
    try {
      const data = await readTravelApproach(travelId)
      approachFrom = { stopId, lat, lng, at: now }
      const legs = (data?.legs || []).map((leg) => leg.geometry?.coordinates || []).filter((c) => c.length >= 2)
      approach.value = legs.length ? legs : null
    } catch {
      // Sem posição no servidor ainda ou serviço de rotas fora: mantém o último caminho e tenta no próximo GPS.
    } finally {
      approachBusy = false
    }
  }

  watch(() => [isTravelActive.value, nextPendingStop.value?.id, tracking.latitude, tracking.longitude], refreshApproach)

  // Fim do percurso: todos embarcados -> "Desembarcou todos"; ninguém pendente nem a bordo -> "Finalizar viagem".
  const canDropAll = computed(
    () => isTravelActive.value && !pendingBoardingPassengers.value.length && onBoardPassengers.value.length > 0,
  )
  const canFinish = computed(
    () => isTravelActive.value && !pendingBoardingPassengers.value.length && !onBoardPassengers.value.length,
  )

  async function dropAll() {
    if (transportState.busy || !canDropAll.value) return
    const ok = await desembarcarTodos(driverTransport.value?.travel)
    showToast(ok ? 'Desembarque de todos registrado.' : transportState.error || 'Não foi possível desembarcar.', ok ? 'success' : 'error')
  }

  async function finishTrip() {
    if (transportState.busy || !canFinish.value) return
    const ok = await finalizarViagemDesignada(driverTransport.value?.travel)
    if (ok) {
      stopTracking()
      approach.value = null
      showToast('Viagem finalizada. Bom trabalho!', 'success')
    } else {
      showToast(transportState.error || 'Não foi possível finalizar a viagem.', 'error')
    }
  }

  const isSharing = computed(() => tracking.tracking && tracking.role === 'driver')
  const mapsUrl = computed(() => {
    if (tracking.latitude == null || tracking.longitude == null) return null
    return `https://www.google.com/maps?q=${tracking.latitude},${tracking.longitude}`
  })
  const updatedAtLabel = computed(() => (tracking.updatedAt ? new Date(tracking.updatedAt).toLocaleTimeString('pt-BR') : ''))
  const routeStatusLabel = computed(() => {
    if (!isTravelActive.value) return 'Rota não iniciada'
    return isSharing.value ? 'Rota em andamento' : 'Em andamento · GPS desligado'
  })

  const polling = useAdaptivePolling({
    getIntervalMs: () => (tracking.connected ? 25_000 : 6_000),
    canRun: () => scope.current() && !transportState.loading,
    onTick: () => loadDriverData(driverTransport.value?.travelId),
  })

  function startLivePolling() {
    loadDriverData()
    polling.start(false)
  }

  onUnmounted(() => {
    polling.stop()
    if (tracking.role === 'viewer') stopTracking()
  })

  return {
    transportState,
    tracking,
    is3dMode,
    dismissedPromptId,
    driverTransport,
    isTravelActive,
    pendingBoardingPassengers,
    onBoardPassengers,
    nextStopHud,
    nextPendingStop,
    approach,
    approachingPassenger,
    isSharing,
    mapsUrl,
    updatedAtLabel,
    routeStatusLabel,
    quickPresence,
    canDropAll,
    canFinish,
    dropAll,
    finishTrip,
    startLivePolling,
  }
}
