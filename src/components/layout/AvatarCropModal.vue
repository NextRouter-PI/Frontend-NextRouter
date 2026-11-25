<script setup>
import { useTemplateRef } from 'vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import { useImageCropper } from '@/components/layout/composables/useImageCropper'

const props = defineProps({
  file: { type: Object, default: null },
})

const emit = defineEmits(['confirm', 'cancel', 'error'])
const imgRef = useTemplateRef('imgRef')

const {
  imageUrl, naturalWidth, zoom, dragging, processing, imageStyle,
  resetCrop, onImageLoad, onImageError, onPointerDown, onPointerMove, onPointerUp,
  onWheel, stepZoom, handleCancel, confirmCrop,
} = useImageCropper({
  getFile: () => props.file,
  imgRef,
  onConfirm: (file) => emit('confirm', file),
  onCancel: () => emit('cancel'),
  onError: (msg) => emit('error', msg),
})
</script>

<template>
  <Teleport to="body">
    <Transition name="fade-scale">
      <div
        v-if="file && imageUrl"
        class="crop-backdrop"
        role="dialog"
        aria-modal="true"
        aria-labelledby="avatar-crop-title"
        @click.self="handleCancel"
      >
        <div class="crop-modal">
          <header class="crop-header">
            <div>
              <h2 id="avatar-crop-title">Ajustar foto de perfil</h2>
              <p class="crop-hint">Arraste para posicionar e use o zoom para enquadrar.</p>
            </div>
            <button
              type="button"
              class="crop-close-btn"
              aria-label="Fechar recorte"
              :disabled="processing"
              @click="handleCancel"
            >
              <BaseIcon name="mdi-close" />
            </button>
          </header>

          <div
            class="crop-stage"
            :class="{ dragging }"
            @pointerdown="onPointerDown"
            @pointermove="onPointerMove"
            @pointerup="onPointerUp"
            @pointercancel="onPointerUp"
            @wheel.prevent="onWheel"
          >
            <img
              ref="imgRef"
              :src="imageUrl"
              alt="Pré-visualização do recorte"
              class="crop-image"
              :style="imageStyle"
              draggable="false"
              @load="onImageLoad"
              @error="onImageError"
            />
            <div class="crop-mask" aria-hidden="true"></div>
          </div>

          <div class="crop-controls">
            <button
              type="button"
              class="zoom-step-btn"
              aria-label="Diminuir zoom"
              :disabled="zoom <= 1 || processing"
              @click="stepZoom(-0.2)"
            >
              <BaseIcon name="mdi-magnify-minus-outline" />
            </button>

            <input
              v-model.number="zoom"
              type="range"
              min="1"
              max="3"
              step="0.01"
              class="zoom-slider"
              aria-label="Nível de zoom"
              :disabled="processing"
            />

            <button
              type="button"
              class="zoom-step-btn"
              aria-label="Aumentar zoom"
              :disabled="zoom >= 3 || processing"
              @click="stepZoom(0.2)"
            >
              <BaseIcon name="mdi-magnify-plus-outline" />
            </button>

            <button
              type="button"
              class="reset-crop-btn"
              title="Centralizar imagem"
              :disabled="processing"
              @click="resetCrop"
            >
              Centralizar
            </button>
          </div>

          <footer class="crop-actions">
            <BaseButton variant="outline" size="sm" :disabled="processing" @click="handleCancel">
              Cancelar
            </BaseButton>
            <BaseButton
              variant="primary"
              size="sm"
              icon="mdi-check"
              :loading="processing"
              :disabled="!naturalWidth"
              @click="confirmCrop"
            >
              Aplicar foto
            </BaseButton>
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style lang="scss" scoped>
.crop-backdrop {
  position: fixed;
  inset: 0;
  z-index: $z-modal;
  background: rgba(0, 0, 0, 0.72);
  backdrop-filter: blur(4px);
  @include flex-center;
  padding: $space-4;
}

.crop-modal {
  width: 100%;
  max-width: 380px;
  background: var(--color-surface);
  color: var(--text);
  border: 1px solid var(--border);
  border-radius: $radius-xl;
  padding: $space-5;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.45);
  display: flex;
  flex-direction: column;
  gap: $space-4;
}

.crop-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: $space-3;

  h2 {
    font-size: $text-lg;
    font-weight: $font-bold;
    color: var(--text);
  }
}

.crop-hint {
  margin-top: 2px;
  font-size: $text-xs;
  color: var(--text-muted);
}

.crop-close-btn {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  aspect-ratio: 1;
  border-radius: $radius-round;
  @include flex-center;
  color: var(--text-muted);
  font-size: 1.2rem;
  transition:
    background-color $duration-fast $ease-fluid,
    color $duration-fast $ease-fluid;

  &:hover {
    background: var(--altbg);
    color: var(--text);
  }
}

.crop-stage {
  position: relative;
  width: 280px;
  height: 280px;
  margin: 0 auto;
  border-radius: $radius-lg;
  overflow: hidden;
  background: var(--chrome-bg);
  cursor: grab;
  touch-action: none;
  user-select: none;

  &.dragging {
    cursor: grabbing;
  }
}

.crop-image {
  position: absolute;
  top: 50%;
  left: 50%;
  max-width: none;
  pointer-events: none;
  user-select: none;
}

.crop-mask {
  position: absolute;
  inset: 0;
  pointer-events: none;
  border-radius: $radius-round;
  border: 2px solid var(--primary);
  box-shadow: 0 0 0 999px rgba(0, 0, 0, 0.56);
}

.crop-controls {
  display: flex;
  align-items: center;
  gap: $space-2;
}

.zoom-step-btn {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  aspect-ratio: 1;
  border-radius: $radius-round;
  @include flex-center;
  color: var(--text);
  background: var(--altbg);
  font-size: 1.1rem;
  transition:
    background-color $duration-fast $ease-fluid,
    color $duration-fast $ease-fluid;

  &:hover:not(:disabled) {
    background: var(--color-primary-soft);
    color: var(--primary);
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
}

.zoom-slider {
  flex: 1;
  accent-color: var(--primary);
  cursor: pointer;
}

.reset-crop-btn {
  @include action-button;
  padding: 5px 10px;
  font-size: $text-xs;
  font-weight: $font-semibold;
  color: var(--text-muted);
  background: var(--altbg);

  &:hover:not(:disabled) {
    color: var(--primary);
    background: var(--color-primary-soft);
  }
}

.crop-actions {
  display: flex;
  justify-content: flex-end;
  gap: $space-2;
}
</style>
