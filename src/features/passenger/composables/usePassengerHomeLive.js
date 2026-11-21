import { computed, onUnmounted, watch } from 'vue'
import { useTransportState } from '@/stores/useTransportState'
import { useTravelTracking } from '@/features/transport/composables/useTravelTracking'
import { useAdaptivePolling } from '@/composables/useAdaptivePolling'
import { useToast } from '@/composables/useToast'
import { estimateEtaMinutes, formatDistanceLabel, haversineMeters } from '@/utils/geo'

const PARTICIPATION_STATUS_LABELS = {
  allocated: 'Aguardando embarque',
  on_board: 'A bordo',
  dropped_off: 'Desembarcado',
  no_show: 'Ausência registrada',
  withdrawn: 'Desistência registrada',
}

const PRESENCE_TOAST_LABELS = {
  on_board: 'Embarque confirmado pelo motorista! Boa viagem.',
  dropped_off: 'Desembarque confirmado! Viagem concluída.',
  no_show: 'O motorista registrou ausência neste trecho.',
}

/**
 * Coordena viagem ao vivo, cálculo de ETA/distância, reações WS e polling da Home do passageiro.
 */
export function usePassengerHomeLive({ scope }) {
  const { state: transportState, loadPassengerData } = useTransportState()
  const { state: tracking, startViewerTracking, stopTracking } = useTravelTracking()
  const { showToast } = useToast()

  const isSharing = computed(() => tracking.tracking && tracking.role === 'viewer')
  const activeTravel = computed(() => transportState.passenger?.travel || null)
  const participationStatus = computed(() => transportState.passenger?.currentParticipation?.status || '')
  const participationStatusLabel = computed(() => PARTICIPATION_STATUS_LABELS[participationStatus.value] || '')
  const passengerPoint = computed(() => transportState.passenger?.pointSnapshot || null)

  const distanceToPointMeters = computed(() => {
    if (
      tracking.latitude == null ||
      tracking.longitude == null ||
      passengerPoint.value?.latitude == null ||
      passengerPoint.value?.longitude == null
    ) {
      return null
    }
    return haversineMeters(
      tracking.latitude,
      tracking.longitude,
      Number(passengerPoint.value.latitude),
      Number(passengerPoint.value.longitude),
    )
  })

  const etaSummary = computed(() => {
    if (distanceToPointMeters.value == null || participationStatus.value !== 'allocated') return ''
    const dist = formatDistanceLabel(distanceToPointMeters.value)
    const mins = estimateEtaMinutes(distanceToPointMeters.value)
    return distanceToPointMeters.value <= 300
      ? `Chegando ao seu ponto (${dist})`
      : `~${mins} min · ${dist} do seu ponto`
  })

  let approachedTravelId = null
  watch(distanceToPointMeters, (meters) => {
    const travelId = transportState.passenger?.travelId
    if (travelId && participationStatus.value === 'allocated' && meters != null && meters <= 300 && approachedTravelId !== travelId) {
      approachedTravelId = travelId
      showToast('O transporte está chegando ao seu ponto!', 'info', 6000)
    }
  })

  watch(
    () => tracking.lastApproaching?.at,
    () => {
      const ev = tracking.lastApproaching
      const travelId = transportState.passenger?.travelId
      if (!ev || !travelId || approachedTravelId === travelId) return
      approachedTravelId = travelId
      showToast(`O transporte está a ${ev.distanceMeters} m do seu ponto!`, 'info', 6000)
    },
  )

  watch(
    () => tracking.lastPresence?.at,
    () => {
      const ev = tracking.lastPresence
      if (!ev || !scope.current()) return
      if (PRESENCE_TOAST_LABELS[ev.status]) {
        showToast(PRESENCE_TOAST_LABELS[ev.status], ev.status === 'no_show' ? 'warning' : 'success', 6000)
      }
      loadPassengerData()
    },
  )

  watch(
    () => transportState.passenger,
    (passenger) => {
      const partStatus = passenger?.currentParticipation?.status
      if (passenger?.travelId && passenger.travelStatus === 'in_progress' && ['allocated', 'on_board'].includes(partStatus)) {
        startViewerTracking(passenger.travelId)
      } else {
        stopTracking()
      }
    },
  )

  const mapsUrl = computed(() => {
    if (tracking.latitude == null || tracking.longitude == null) return null
    return `https://www.google.com/maps?q=${tracking.latitude},${tracking.longitude}`
  })
  const updatedAtLabel = computed(() => (tracking.updatedAt ? new Date(tracking.updatedAt).toLocaleTimeString('pt-BR') : ''))

  const polling = useAdaptivePolling({
    getIntervalMs: () => (tracking.connected ? 25_000 : 5_000),
    canRun: () => scope.current() && !transportState.loading,
    onTick: () => loadPassengerData(),
  })

  function startLivePolling() {
    polling.start(true)
  }

  onUnmounted(() => {
    polling.stop()
    stopTracking()
  })

  return {
    transportState,
    tracking,
    isSharing,
    activeTravel,
    participationStatus,
    participationStatusLabel,
    passengerPoint,
    etaSummary,
    mapsUrl,
    updatedAtLabel,
    startLivePolling,
  }
}
