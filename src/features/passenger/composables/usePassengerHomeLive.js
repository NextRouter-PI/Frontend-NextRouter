import { computed, onUnmounted, shallowRef, watch } from 'vue'
import { useTransportState } from '@/stores/useTransportState'
import { useTravelTracking } from '@/features/transport/composables/useTravelTracking'
import { useAdaptivePolling } from '@/composables/useAdaptivePolling'
import { useToast } from '@/composables/useToast'
import { estimateEtaMinutes, formatDistanceLabel, haversineMeters } from '@/utils/geo'
import { readParticipationRoute } from '@/api/transport'

// Refaz o caminho quando o status muda ou o motorista anda ~200 m (no máximo a cada 15 s).
const ROUTE_REFRESH_METERS = 200
const ROUTE_MIN_INTERVAL_MS = 15_000

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
  // Previsão calculada pelo servidor: horário na parada dele, atraso e paradas antes dele.
  const timing = computed(() => transportState.passenger?.currentParticipation?.timing || null)
  const hhmm = (iso) => (iso ? new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '')
  const timingInfo = computed(() => {
    const t = timing.value
    if (!t) return null
    const minutes = t.expected_at ? Math.max(0, Math.round((new Date(t.expected_at) - Date.now()) / 60000)) : null
    return {
      pickup: hhmm(t.expected_at || t.planned_at),
      planned: hhmm(t.planned_at),
      arrival: hhmm(t.arrival_expected_at),
      minutes,
      stopsAhead: t.stops_ahead,
      delayMinutes: Math.round((t.delay_seconds || 0) / 60),
    }
  })

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
    const info = timingInfo.value
    if (info?.pickup && participationStatus.value === 'allocated') {
      const ahead = info.stopsAhead ? ` · faltam ${info.stopsAhead} ${info.stopsAhead === 1 ? 'parada' : 'paradas'} antes de você` : ' · você é a próxima parada'
      const inMin = info.minutes != null ? ` (em ~${info.minutes} min)` : ''
      return `Chega ao seu ponto às ${info.pickup}${inMin}${ahead}`
    }
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

  // Caminho ao vivo: laranja do motorista até mim, preto de mim até o destino.
  const liveRoute = shallowRef(null)
  let routeFrom = null
  let routeBusy = false

  async function refreshLiveRoute() {
    const participationId = transportState.passenger?.currentParticipation?.id
    const status = participationStatus.value
    const { latitude: lat, longitude: lng } = tracking
    if (!participationId || !['allocated', 'on_board'].includes(status) || lat == null || lng == null) {
      if (!['allocated', 'on_board'].includes(status)) liveRoute.value = null
      return
    }
    const now = Date.now()
    const same = routeFrom?.participationId === participationId && routeFrom.status === status
    if (routeBusy || (same && now - routeFrom.at < ROUTE_MIN_INTERVAL_MS)) return
    if (same && haversineMeters(lat, lng, routeFrom.lat, routeFrom.lng) < ROUTE_REFRESH_METERS) return
    routeBusy = true
    try {
      const data = await readParticipationRoute(participationId)
      routeFrom = { participationId, status, lat, lng, at: now }
      const toMe = data?.to_me?.coordinates || null
      const toDestination = data?.to_destination?.coordinates || null
      liveRoute.value = toMe || toDestination ? { toMe, toDestination } : null
    } catch {
      // Sem viagem em andamento ou serviço de rotas fora: o mapa continua com o percurso planejado.
    } finally {
      routeBusy = false
    }
  }

  watch(() => [participationStatus.value, tracking.latitude, tracking.longitude], refreshLiveRoute)

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
    timingInfo,
    liveRoute,
    mapsUrl,
    updatedAtLabel,
    startLivePolling,
  }
}
