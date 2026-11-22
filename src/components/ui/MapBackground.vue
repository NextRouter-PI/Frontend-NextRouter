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
})

const { state: tracking } = useTravelTracking()
const mapContainer = useTemplateRef('mapContainer')

useLiveBackgroundMap({
  mapContainer,
  tracking,
  getSnapshot: () => props.snapshot,
  getStops: () => props.stops,
  getTargetPoint: () => props.targetPoint,
  getSelfLabel: () => props.selfMarkerLabel,
  getTrackingLabel: () => props.trackingMarkerLabel,
  getTrackingIcon: () => props.trackingMarkerIcon,
})
</script>

<template>
  <div ref="mapContainer" class="map-background"></div>
</template>

<style lang="scss" scoped>
.map-background {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
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
</style>
