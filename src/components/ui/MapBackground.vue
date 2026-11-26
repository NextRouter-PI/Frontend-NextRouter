<script setup>
import { useTemplateRef } from 'vue'
import { useTravelTracking } from '@/features/transport/composables/useTravelTracking'
import { useLiveBackgroundMap } from '@/features/transport/composables/useLiveBackgroundMap'

const props = defineProps({
  selfMarkerLabel: { type: String, default: 'Você' },
  trackingMarkerLabel: { type: String, default: 'Motorista' },
  trackingMarkerIcon: { type: String, default: 'mdi-bus' },
  snapshot: { type: Object, default: null },
  stops: { type: Array, default: () => [] },
  targetPoint: { type: Object, default: null },
  // { toMe, toDestination }: traçados [lng, lat][] ao vivo; substituem o percurso planejado.
  liveRoute: { type: Object, default: null },
})

const { state: tracking } = useTravelTracking()
const mapContainer = useTemplateRef('mapContainer')

const { following, recenter } = useLiveBackgroundMap({
  mapContainer,
  tracking,
  getSnapshot: () => props.snapshot,
  getStops: () => props.stops,
  getTargetPoint: () => props.targetPoint,
  getLiveRoute: () => props.liveRoute,
  getSelfLabel: () => props.selfMarkerLabel,
  getTrackingLabel: () => props.trackingMarkerLabel,
  getTrackingIcon: () => props.trackingMarkerIcon,
})
</script>

<template>
  <div ref="mapContainer" class="map-background"></div>

  <Transition name="recenter">
    <button
      v-if="!following"
      type="button"
      class="map-recenter"
      aria-label="Recentralizar no motorista"
      @click="recenter"
    >
      <BaseIcon name="mdi-crosshairs-gps" />
      <span>Recentralizar</span>
    </button>
  </Transition>
</template>

<style lang="scss" scoped>
.map-background {
  position: fixed;
  inset: 0;
  z-index: 0;
}

.map-recenter {
  @include action-button;
  position: fixed;
  top: calc(var(--header-height) + 16px);
  right: 16px;
  z-index: 4;
  height: 48px;
  padding: 0 16px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 1px solid var(--primary);
  background: var(--primary);
  color: #ffffff;
  font-size: 0.85rem;
  font-weight: 800;

  .mdi,
  :deep(.base-icon) {
    font-size: 1.3rem;
  }
}

.recenter-enter-active,
.recenter-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.recenter-enter-from,
.recenter-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

.map-background::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.08) 0%, rgba(0, 0, 0, 0.28) 100%);
}

.dark .map-background::after {
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.35) 0%, rgba(0, 0, 0, 0.55) 100%);
}

// Celular: cartão da parada ocupa o topo; estes botões descem para a direita, logo acima do painel recolhido.
@media (max-width: 900px) {
  .map-recenter {
    top: auto;
    bottom: calc(var(--bottom-nav-height) + 72px);
    right: 12px;
  }
}
</style>
