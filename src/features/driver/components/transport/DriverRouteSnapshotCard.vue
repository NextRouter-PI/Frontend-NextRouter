<script setup>
import BaseCard from '@/components/ui/BaseCard.vue'
import RouteMapSnapshot from '@/features/transport/components/RouteMapSnapshot.vue'

defineProps({
  transport: { type: Object, required: true },
})
</script>

<template>
  <BaseCard title="Percurso Calculado (Snapshot)">
    <div class="route-info">
      <div class="route-point">
        <span class="route-dot origin"></span>
        <div>
          <span class="route-label">Origem</span>
          <span class="route-value">{{ transport.rota.ponto_origem }}</span>
          <span class="route-time">{{ transport.rota.horario_saida }}</span>
        </div>
      </div>
      <div class="route-point">
        <span class="route-dot destination"></span>
        <div>
          <span class="route-label">Destino</span>
          <span class="route-value">{{ transport.rota.ponto_destino }}</span>
          <span class="route-time">{{ transport.rota.horario_chegada }}</span>
        </div>
      </div>
    </div>

    <p v-if="transport.rota.distanciaKm" class="sub-text">
      Distância estimada: {{ transport.rota.distanciaKm }} km · Duração: {{ transport.rota.duracaoMin }} min
    </p>

    <RouteMapSnapshot
      v-if="transport.snapshot"
      :snapshot="transport.snapshot"
      :stops="transport.stops"
      title="Mapa do Percurso e Paradas"
    />
  </BaseCard>
</template>

<style lang="scss" scoped>
.route-info {
  display: grid;
  gap: $space-3;
}

.route-point {
  display: flex;
  align-items: flex-start;
  gap: $space-3;

  > div {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
}

.route-dot {
  width: 12px;
  height: 12px;
  border-radius: $radius-round;
  margin-top: 4px;
  flex-shrink: 0;

  &.origin {
    background: var(--primary);
  }

  &.destination {
    background: var(--success);
  }
}

.route-label {
  font-size: $text-xs;
  font-weight: $font-bold;
  color: var(--primary);
  text-transform: uppercase;
}

.route-value {
  font-size: $text-md;
  font-weight: $font-semibold;
  color: var(--text);
}

.route-time {
  font-size: $text-xs;
  color: var(--text-muted);
}

.sub-text {
  font-size: $text-sm;
  color: var(--text-muted);
  line-height: 1.5;
}
</style>
