<script setup>
import { useTemplateRef } from 'vue'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useTravelTracking } from '@/features/transport/composables/useTravelTracking'
import { useDriverMap3D } from '@/features/driver/composables/useDriverMap3D'

const props = defineProps({
  snapshot: { type: Object, default: null },
  stops: { type: Array, default: () => [] },
  is3d: { type: Boolean, default: true },
  // Trechos [lng, lat][] da posição atual por cada parada aberta até o fim.
  approach: { type: Array, default: null },
  // Próxima parada a cumprir (laranja até ela quando não há trajeto ao vivo).
  nextStop: { type: Object, default: null },
})

const emit = defineEmits(['toggle-3d'])

const { state: tracking } = useTravelTracking()
const mapEl = useTemplateRef('mapEl')

const { following, recenter } = useDriverMap3D({
  mapEl,
  tracking,
  getSnapshot: () => props.snapshot,
  getStops: () => props.stops,
  is3d: () => props.is3d,
  getApproach: () => props.approach,
  getNextStop: () => props.nextStop,
})
</script>

<template>
  <div ref="mapEl" class="driver-gps-map"></div>

  <!-- Controles no estilo app de motorista: modo 3D/2D e recentralizar quando o mapa foi movido. -->
  <div class="map-controls">
    <button
      type="button"
      class="map-control"
      :aria-pressed="is3d"
      :aria-label="is3d ? 'Mudar para mapa 2D' : 'Mudar para mapa 3D'"
      @click="emit('toggle-3d')"
    >
      {{ is3d ? '2D' : '3D' }}
    </button>
    <Transition name="recenter">
      <button
        v-if="!following"
        type="button"
        class="map-control map-control--recenter"
        aria-label="Recentralizar na minha posição"
        @click="recenter"
      >
        <BaseIcon name="mdi-crosshairs-gps" />
        <span>Recentralizar</span>
      </button>
    </Transition>
  </div>
</template>

<style lang="scss" scoped>
.driver-gps-map {
  position: fixed;
  inset: 0;
  z-index: 0;
}

.map-controls {
  position: fixed;
  right: 16px;
  top: calc(var(--header-height) + 16px);
  z-index: 4;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10px;
}

.map-control {
  @include action-button;
  min-width: 48px;
  height: 48px;
  padding: 0 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(18, 18, 22, 0.92);
  color: #ffffff;
  font-size: 0.85rem;
  font-weight: 800;
  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.35);
  cursor: pointer;

  .mdi {
    font-size: 1.3rem;
  }

  &:hover {
    border-color: var(--primary);
    color: var(--primary);
  }

  &:active {
    transform: scale(0.95);
  }

  &:focus-visible {
    outline: 3px solid var(--primary);
    outline-offset: 2px;
  }
}

.map-control--recenter {
  background: var(--primary);
  border-color: var(--primary);

  &:hover {
    color: #ffffff;
    filter: brightness(1.08);
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
