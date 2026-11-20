<script setup>
import { useTemplateRef } from 'vue'
import { useRouteSnapshotMap } from '@/features/transport/composables/useRouteSnapshotMap'

const props = defineProps({
  snapshot: { type: Object, default: null },
  stops: { type: Array, default: () => [] },
  title: { type: String, default: 'Traçado e Paradas da Rota' },
  height: { type: String, default: '280px' },
})

const mapContainer = useTemplateRef('mapEl')
const { orderedStops, distanceLabel, durationLabel, hasMapData } = useRouteSnapshotMap({
  mapContainer,
  getSnapshot: () => props.snapshot,
  getStops: () => props.stops,
})
</script>

<template>
  <div v-if="hasMapData" class="route-snapshot-box">
    <div class="snapshot-header">
      <h4>{{ title }}</h4>
      <div class="snapshot-meta">
        <span v-if="distanceLabel" class="meta-pill">{{ distanceLabel }}</span>
        <span v-if="durationLabel" class="meta-pill">{{ durationLabel }}</span>
        <span v-if="orderedStops.length" class="meta-pill">{{ orderedStops.length }} parada(s)</span>
      </div>
    </div>
    <div ref="mapEl" class="snapshot-map" :style="{ height }"></div>
    <div class="snapshot-legend">
      <span><i class="dot origin"></i> Origem</span>
      <span><i class="dot stop"></i> Paradas</span>
      <span><i class="dot dest"></i> Destino</span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.route-snapshot-box {
  margin-top: $space-3;
  padding: $space-3;
  border-radius: $radius-md;
  background: var(--bg);
  border: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: $space-2;
}

.snapshot-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: $space-2;

  h4 {
    font-size: $text-sm;
    font-weight: $font-bold;
  }
}

.snapshot-meta {
  display: flex;
  flex-wrap: wrap;
  gap: $space-1;
}

.meta-pill {
  padding: 2px $space-2;
  border-radius: $radius-pill;
  background: var(--color-primary-soft);
  color: var(--primary);
  font-size: $text-xs;
  font-weight: $font-semibold;
}

.snapshot-map {
  width: 100%;
  border-radius: $radius-sm;
  border: 1px solid var(--border);
  z-index: $z-base;
}

.snapshot-legend {
  display: flex;
  flex-wrap: wrap;
  gap: $space-3;
  font-size: $text-xs;
  color: var(--text-muted);

  span {
    display: inline-flex;
    align-items: center;
    gap: 5px;
  }
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: $radius-round;
  display: inline-block;

  &.origin {
    background: var(--success);
  }

  &.stop {
    background: var(--primary);
  }

  &.dest {
    background: var(--danger);
  }
}
</style>
