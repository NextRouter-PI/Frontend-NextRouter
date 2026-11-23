<script setup>
import { useTemplateRef } from 'vue'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useTravelTracking } from '@/features/transport/composables/useTravelTracking'
import { useDriverMap3D } from '@/features/driver/composables/useDriverMap3D'

const props = defineProps({
  snapshot: { type: Object, default: null },
  stops: { type: Array, default: () => [] },
  is3d: { type: Boolean, default: true },
})

const { state: tracking } = useTravelTracking()
const mapEl = useTemplateRef('mapEl')

useDriverMap3D({
  mapEl,
  tracking,
  getSnapshot: () => props.snapshot,
  getStops: () => props.stops,
  is3d: () => props.is3d,
})
</script>

<template>
  <div ref="mapEl" class="driver-gps-map"></div>
</template>

<style lang="scss" scoped>
.driver-gps-map {
  position: fixed;
  inset: 0;
  z-index: 0;
}

:deep(.gps-nav-puck) {
  position: relative;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

:deep(.gps-nav-puck__halo) {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: rgba(236, 131, 20, 0.28);
  animation: gps-puck-pulse 1.8s ease-out infinite;
}

:deep(.gps-nav-puck__core) {
  position: relative;
  z-index: 1;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: #ec8314;
  color: #ffffff;
  border: 3px solid #ffffff;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
}

@keyframes gps-puck-pulse {
  0% {
    transform: scale(0.8);
    opacity: 0.9;
  }
  100% {
    transform: scale(1.9);
    opacity: 0;
  }
}
</style>
