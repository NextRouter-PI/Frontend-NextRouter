<script setup>
defineProps({
  approaching: { type: Object, default: null },
  busy: { type: Boolean, default: false },
})

const emit = defineEmits(['dismiss', 'presence'])
</script>

<template>
  <Transition name="fade-slide">
    <div v-if="approaching" class="approaching-prompt" role="alert">
      <div class="approaching-header">
        <img
          v-if="approaching.participation.profile_picture_url"
          :src="approaching.participation.profile_picture_url"
          :alt="approaching.participation.name"
          class="approaching-avatar"
        />
        <span v-else class="approaching-avatar-fallback">
          {{ (approaching.participation.name || 'P').charAt(0).toUpperCase() }}
        </span>
        <div class="approaching-info">
          <span class="approaching-badge">
            Chegando ao embarque · {{ approaching.distanceMeters }} m
          </span>
          <strong>{{ approaching.participation.name || 'Passageiro' }}</strong>
        </div>
        <button
          type="button"
          class="approaching-dismiss"
          aria-label="Dispensar"
          @click="emit('dismiss', approaching.participation.id)"
        >
          <BaseIcon name="mdi-close" />
        </button>
      </div>
      <div class="approaching-actions">
        <button
          type="button"
          class="approaching-confirm-btn"
          :disabled="busy"
          @click="emit('presence', approaching.participation, 'boarded')"
        >
          <BaseIcon name="mdi-check-circle-outline" />
          Confirmar Embarque
        </button>
        <button
          type="button"
          class="approaching-noshow-btn"
          :disabled="busy"
          @click="emit('presence', approaching.participation, 'no_show')"
        >
          Ausente
        </button>
      </div>
    </div>
  </Transition>
</template>

<style lang="scss" scoped>
.approaching-prompt {
  position: fixed;
  top: calc(var(--header-height) + 86px);
  left: 50%;
  transform: translateX(-50%);
  z-index: 7; // acima do painel do celular (6): aviso de passageiro próximo não pode ficar escondido
  width: min(92vw, 420px);
  padding: 14px;
  border-radius: 18px;
  background: rgba(20, 20, 24, 0.96);
  color: #ffffff;
  border: 2px solid var(--primary);
  box-shadow: 0 14px 36px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.approaching-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.approaching-avatar,
.approaching-avatar-fallback {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  flex-shrink: 0;
}

.approaching-avatar {
  object-fit: cover;
  border: 2px solid var(--primary);
}

.approaching-avatar-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--primary);
  color: #ffffff;
  font-weight: 800;
}

.approaching-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.approaching-badge {
  font-size: 0.74rem;
  font-weight: 700;
  color: var(--primary);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.approaching-dismiss {
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.65);
  font-size: 1.2rem;
  cursor: pointer;
}

.approaching-actions {
  display: flex;
  gap: 8px;
}

.approaching-confirm-btn {
  @include action-button;
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 14px;
  border: none;
  background: var(--success);
  color: #ffffff;
  font-size: 0.88rem;
  font-weight: 700;
  cursor: pointer;

  &:disabled {
    opacity: 0.6;
  }
}

.approaching-noshow-btn {
  @include action-button;
  padding: 10px 14px;
  border: 1px solid rgba(255, 255, 255, 0.25);
  background: transparent;
  color: rgba(255, 255, 255, 0.85);
  font-size: 0.84rem;
  font-weight: 600;
  cursor: pointer;
}
</style>
