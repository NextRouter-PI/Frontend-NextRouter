<script setup>
import BaseCard from '@/components/ui/BaseCard.vue'

defineProps({
  veiculo: { type: Object, required: true },
  menuOpen: { type: Boolean, default: false },
})

const emit = defineEmits(['toggle-menu', 'edit', 'toggle-status'])
</script>

<template>
  <BaseCard :title="veiculo.placa" :subtitle="veiculo.modelo || 'Modelo não informado'">
    <template #actions>
      <div class="menu-container">
        <button
          type="button"
          class="menu-dots"
          aria-label="Opções do veículo"
          @click="emit('toggle-menu', veiculo.id)"
        >
          <span class="mdi mdi-dots-vertical" aria-hidden="true"></span>
        </button>

        <Transition name="fade-scale">
          <div v-if="menuOpen" class="menu-dropdown">
            <button type="button" @click="emit('edit', veiculo.id)">
              Editar informações do veículo
            </button>
            <button type="button" @click="emit('toggle-status', veiculo.id)">
              {{ veiculo.status === 'Ativo' ? 'Enviar para a manutenção' : 'Retirar de manutenção' }}
            </button>
          </div>
        </Transition>
      </div>
    </template>

    <div class="card-details">
      <div class="detail-item">
        <span class="mdi mdi-seat-passenger" aria-hidden="true"></span>
        <span>{{ veiculo.capacidade }} Lugares</span>
      </div>
      <div v-if="veiculo.ano" class="detail-item">
        <span class="mdi mdi-calendar-outline" aria-hidden="true"></span>
        <span>{{ veiculo.ano }}</span>
      </div>
      <div v-if="veiculo.cor" class="detail-item">
        <span class="mdi mdi-palette-outline" aria-hidden="true"></span>
        <span>{{ veiculo.cor }}</span>
      </div>
      <div v-if="veiculo.garagePointName" class="detail-item">
        <span class="mdi mdi-garage-outline" aria-hidden="true"></span>
        <span>Garagem: {{ veiculo.garagePointName }}</span>
      </div>
    </div>

    <div v-if="veiculo.caracteristicas?.length" class="feature-chips">
      <span v-for="feature in veiculo.caracteristicas" :key="feature" class="feature-chip">
        {{ feature }}
      </span>
    </div>

    <template #footer>
      <span :class="['status-tag', veiculo.status.toLowerCase()]">{{ veiculo.status }}</span>
    </template>
  </BaseCard>
</template>

<style lang="scss" scoped>
.menu-container {
  position: relative;
}

.menu-dots {
  width: 34px;
  height: 34px;
  border-radius: $radius-round;
  @include flex-center;
  color: var(--text-muted);
  font-size: 1.25rem;

  &:hover {
    background: var(--altbg);
    color: var(--text);
  }
}

.menu-dropdown {
  position: absolute;
  right: 0;
  top: 38px;
  min-width: 210px;
  @include surface-card($space-2, $radius-md);
  display: flex;
  flex-direction: column;
  gap: $space-1;
  z-index: $z-sticky;

  button {
    width: 100%;
    text-align: left;
    padding: $space-2 $space-3;
    border-radius: $radius-sm;
    color: var(--text);
    font-size: $text-sm;

    &:hover {
      background: var(--altbg);
      color: var(--primary);
    }
  }
}

.card-details {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2 $space-4;
}

.detail-item {
  display: inline-flex;
  align-items: center;
  gap: $space-1;
  font-size: $text-sm;
  color: var(--text-muted);

  .mdi {
    color: var(--primary);
  }
}

.feature-chips {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;
}

.feature-chip {
  padding: 2px $space-3;
  border-radius: $radius-pill;
  background: var(--altbg);
  color: var(--text);
  font-size: $text-xs;
  font-weight: $font-semibold;
}

.status-tag {
  padding: $space-1 $space-3;
  border-radius: $radius-pill;
  font-size: $text-xs;
  font-weight: $font-bold;
  background: var(--color-primary-soft);
  color: var(--primary);

  &.ativo {
    background: var(--success-soft);
    color: var(--success);
  }

  &.manutenção {
    background: var(--warning-soft);
    color: var(--warning);
  }
}
</style>
