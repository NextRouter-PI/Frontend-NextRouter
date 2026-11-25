import { computed, onUnmounted, shallowRef, watch } from 'vue'
import { useTransportState } from '@/stores/useTransportState'
import { useTravelTracking } from '@/features/transport/composables/useTravelTracking'
import { useAdaptivePolling } from '@/composables/useAdaptivePolling'
import { useToast } from '@/composables/useToast'
import { estimateEtaMinutes, formatDistanceLabel, haversineMeters } from '@/utils/geo'

/**
 * Coordena dados ao vivo, HUD da próxima parada, prompt de aproximação e polling da Home do motorista.
 */
export function useDriverHomeLive({ scope }) {
  const { state: transportState, loadDriverData, registrarPresencaParticipante } = useTransportState()
  const { state: tracking, startViewerTracking, stopTracking } = useTravelTracking()
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
  const nextPendingStop = computed(() =>
    (driverTransport.value?.stops || []).find((s) => s.state !== 'handled' && s.state !== 'completed') || null,
  )

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
    const ok = await registrarPresencaParticipante(participation, kind)
    if (ok) {
      showToast(
        kind === 'boarded'
          ? `Embarque de ${participation.name || 'passageiro'} confirmado!`
          : `Ausência de ${participation.name || 'passageiro'} registrada.`,
        'success',
      )
      await loadDriverData(driverTransport.value?.travelId)
    }
  }

  watch(
    () => [driverTransport.value?.travelId, driverTransport.value?.travelStatus],
    ([travelId, status]) => {
      if (travelId && status === 'in_progress' && !tracking.tracking) startViewerTracking(travelId)
    },
  )

  watch(
    () => tracking.lastPresence?.at,
    () => {
      if (scope.current() && driverTransport.value?.travelId) loadDriverData(driverTransport.value.travelId)
    },
  )

  const isSharing = computed(() => tracking.tracking && tracking.role === 'driver')
  const mapsUrl = computed(() => {
    if (tracking.latitude == null || tracking.longitude == null) return null
    return `https://www.google.com/maps?q=${tracking.latitude},${tracking.longitude}`
  })
  const updatedAtLabel = computed(() => (tracking.updatedAt ? new Date(tracking.updatedAt).toLocaleTimeString('pt-BR') : ''))
  const routeStatusLabel = computed(() => (isSharing.value ? 'Rota em andamento' : 'Rota não iniciada'))

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
    approachingPassenger,
    isSharing,
    mapsUrl,
    updatedAtLabel,
    routeStatusLabel,
    quickPresence,
    startLivePolling,
  }
}
