<script setup>
import { computed, useTemplateRef } from 'vue'
import { useRouteCalculationMap } from '@/features/company/composables/useRouteCalculationMap'
import BaseButton from '@/components/ui/BaseButton.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  travel: { type: Object, default: null },
  serviceName: { type: String, default: '' },
  originPoint: { type: Object, default: null },
  destinationPoint: { type: Object, default: null },
  participants: { type: Array, default: () => [] },
  snapshot: { type: Object, default: null },
  job: { type: Object, default: null },
  busy: { type: Boolean, default: false },
})

const emit = defineEmits(['close', 'calculate', 'publish'])

const mapEl = useTemplateRef('mapEl')

useRouteCalculationMap({
  mapEl,
  isOpen: () => props.open,
  getSnapshot: () => props.snapshot,
  getParticipants: () => props.participants,
  getOriginPoint: () => props.originPoint,
  getDestinationPoint: () => props.destinationPoint,
})

const isCalculating = computed(
  () => props.busy || props.job?.status === 'pending' || props.job?.status === 'running',
)
const isReady = computed(
  () =>
    props.travel?.planning_status === 'ready' &&
    props.snapshot?.state === 'ready' &&
    Boolean(props.snapshot?.geometry?.coordinates?.length),
)
const distanceLabel = computed(() => {
  const m = Number(props.snapshot?.distance_meters)
  return Number.isFinite(m) && m > 0 ? `${(m / 1000).toFixed(1)} km` : ''
})
const durationLabel = computed(() => {
  const s = Number(props.snapshot?.duration_seconds)
  return Number.isFinite(s) && s > 0 ? `${Math.max(1, Math.round(s / 60))} min` : ''
})
</script>

<template>
  <Teleport to="body">
    <Transition name="fade-scale">
      <div
        v-if="open && travel"
        class="calc-backdrop"
        role="dialog"
        aria-modal="true"
        aria-label="Cálculo de rota"
        @click.self="emit('close')"
      >
        <div class="calc-modal">
          <header class="calc-header">
            <div>
              <h3>Cálculo de Rota · Viagem #{{ travel.id }}</h3>
              <p class="calc-subtitle">{{ serviceName }} · {{ participants.length }} passageiro(s) confirmado(s)</p>
            </div>
            <button type="button" class="calc-close" aria-label="Fechar" @click="emit('close')">
              <span class="mdi mdi-close" aria-hidden="true"></span>
            </button>
          </header>

          <div class="calc-map-wrap">
            <div ref="mapEl" class="calc-map"></div>
            <div v-if="isCalculating" class="calc-overlay">
              <LoadingSpinner size="md" text="Calculando melhor trajeto no OSRM..." />
            </div>
          </div>

          <div class="calc-legend">
            <span><i class="dot origin"></i> Origem</span>
            <span><i class="dot passenger"></i> Passageiros confirmados</span>
            <span><i class="dot dest"></i> Destino</span>
            <span v-if="distanceLabel" class="meta-pill">{{ distanceLabel }}</span>
            <span v-if="durationLabel" class="meta-pill">{{ durationLabel }}</span>
          </div>

          <div v-if="job?.status === 'failed'" class="calc-error" role="alert">
            <span class="mdi mdi-alert-circle-outline" aria-hidden="true"></span>
            <span>Falha no cálculo ({{ job.error || 'erro desconhecido' }}). Verifique o OSRM e tente novamente.</span>
          </div>

          <footer class="calc-footer">
            <BaseButton variant="outline" size="sm" @click="emit('close')">Fechar</BaseButton>
            <div class="calc-footer-right">
              <BaseButton
                variant="outline"
                size="sm"
                icon="mdi-map-marker-path"
                :loading="isCalculating"
                :disabled="isCalculating || participants.length === 0"
                @click="emit('calculate', travel)"
              >
                {{ isReady ? 'Recalcular rota' : 'Calcular rota' }}
              </BaseButton>
              <BaseButton
                v-if="isReady"
                size="sm"
                icon="mdi-send-check"
                :disabled="busy"
                @click="emit('publish', travel)"
              >
                Publicar viagem
              </BaseButton>
            </div>
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style lang="scss" scoped>
.calc-backdrop {
  position: fixed;
  inset: 0;
  z-index: $z-modal;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $space-4;
}

.calc-modal {
  width: 100%;
  max-width: 780px;
  max-height: 92vh;
  overflow-y: auto;
  background: var(--color-surface);
  color: var(--text);
  border: 1px solid var(--border);
  border-radius: $radius-lg;
  box-shadow: var(--shadow), 0 20px 48px rgba(0, 0, 0, 0.35);
  padding: $space-4;
  display: flex;
  flex-direction: column;
  gap: $space-3;
}

.calc-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: $space-3;

  h3 {
    margin: 0;
    font-size: $text-lg;
    font-weight: $font-bold;
  }
}

.calc-subtitle {
  margin: 2px 0 0;
  font-size: $text-sm;
  color: var(--text-muted);
}

.calc-close {
  width: 34px;
  height: 34px;
  border-radius: $radius-round;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;

  &:hover {
    color: var(--primary);
    border-color: var(--primary);
  }
}

.calc-map-wrap {
  position: relative;
  border-radius: $radius-md;
  overflow: hidden;
  border: 1px solid var(--border);
}

.calc-map {
  width: 100%;
  height: 380px;
  z-index: $z-base;
}

.calc-overlay {
  position: absolute;
  inset: 0;
  z-index: 500;
  background: rgba(15, 15, 18, 0.55);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.calc-legend {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: $space-3;
  font-size: $text-xs;
  color: var(--text-muted);

  span {
    display: inline-flex;
    align-items: center;
    gap: 6px;
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
  &.passenger {
    background: var(--primary);
  }
  &.dest {
    background: var(--danger);
  }
}

.meta-pill {
  padding: 2px $space-2;
  border-radius: $radius-pill;
  background: var(--color-primary-soft);
  color: var(--primary);
  font-weight: $font-semibold;
}

.calc-error {
  display: flex;
  align-items: center;
  gap: $space-2;
  padding: $space-2 $space-3;
  border-radius: $radius-md;
  background: var(--danger-soft);
  color: var(--danger);
  font-size: $text-sm;
  font-weight: $font-medium;
}

.calc-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: $space-2;
  padding-top: $space-2;
  border-top: 1px solid var(--border);
}

.calc-footer-right {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;
}
</style>
