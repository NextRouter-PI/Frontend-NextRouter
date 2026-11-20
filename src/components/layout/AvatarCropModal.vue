<script setup>
import { computed, onUnmounted, ref, shallowRef, watch } from 'vue'
import BaseButton from '@/components/ui/BaseButton.vue'

const VIEWPORT_SIZE = 280
const OUTPUT_SIZE = 512

const props = defineProps({
  file: { type: Object, default: null },
})

const emit = defineEmits(['confirm', 'cancel', 'error'])

const imageUrl = shallowRef('')
const naturalWidth = shallowRef(0)
const naturalHeight = shallowRef(0)
const zoom = shallowRef(1)
const offsetX = shallowRef(0)
const offsetY = shallowRef(0)
const dragging = shallowRef(false)
const processing = shallowRef(false)

const imgRef = ref(null)
let dragStartX = 0
let dragStartY = 0
let startOffsetX = 0
let startOffsetY = 0

const baseScale = computed(() => {
  if (!naturalWidth.value || !naturalHeight.value) return 1
  return Math.max(VIEWPORT_SIZE / naturalWidth.value, VIEWPORT_SIZE / naturalHeight.value)
})

const currentScale = computed(() => baseScale.value * zoom.value)
const displayWidth = computed(() => naturalWidth.value * currentScale.value)
const displayHeight = computed(() => naturalHeight.value * currentScale.value)

const imageStyle = computed(() => ({
  width: `${displayWidth.value}px`,
  height: `${displayHeight.value}px`,
  transform: `translate(calc(-50% + ${offsetX.value}px), calc(-50% + ${offsetY.value}px))`,
}))

function clampOffsets(nextX, nextY) {
  const maxX = Math.max(0, (displayWidth.value - VIEWPORT_SIZE) / 2)
  const maxY = Math.max(0, (displayHeight.value - VIEWPORT_SIZE) / 2)
  offsetX.value = Math.min(maxX, Math.max(-maxX, nextX))
  offsetY.value = Math.min(maxY, Math.max(-maxY, nextY))
}

function revokeUrl() {
  if (imageUrl.value) {
    URL.revokeObjectURL(imageUrl.value)
    imageUrl.value = ''
  }
}

function resetCrop() {
  zoom.value = 1
  offsetX.value = 0
  offsetY.value = 0
}

watch(
  () => props.file,
  (nextFile) => {
    revokeUrl()
    naturalWidth.value = 0
    naturalHeight.value = 0
    resetCrop()
    if (nextFile) {
      imageUrl.value = URL.createObjectURL(nextFile)
    }
  },
  { immediate: true },
)

watch(zoom, () => {
  clampOffsets(offsetX.value, offsetY.value)
})

function onImageLoad(event) {
  naturalWidth.value = event.target.naturalWidth || 0
  naturalHeight.value = event.target.naturalHeight || 0
  resetCrop()
}

function onImageError() {
  revokeUrl()
  emit('error', 'Não foi possível carregar a imagem selecionada. Tente outro arquivo JPG ou PNG.')
  emit('cancel')
}

function onPointerDown(event) {
  if (!naturalWidth.value || processing.value) return
  dragging.value = true
  dragStartX = event.clientX
  dragStartY = event.clientY
  startOffsetX = offsetX.value
  startOffsetY = offsetY.value
  event.currentTarget.setPointerCapture?.(event.pointerId)
}

function onPointerMove(event) {
  if (!dragging.value) return
  clampOffsets(startOffsetX + (event.clientX - dragStartX), startOffsetY + (event.clientY - dragStartY))
}

function onPointerUp(event) {
  if (!dragging.value) return
  dragging.value = false
  event.currentTarget.releasePointerCapture?.(event.pointerId)
}

function onWheel(event) {
  if (!naturalWidth.value || processing.value) return
  const delta = event.deltaY < 0 ? 0.12 : -0.12
  zoom.value = Number(Math.min(3, Math.max(1, zoom.value + delta)).toFixed(2))
}

function stepZoom(delta) {
  zoom.value = Number(Math.min(3, Math.max(1, zoom.value + delta)).toFixed(2))
}

function handleCancel() {
  if (processing.value) return
  emit('cancel')
}

function onKeydown(event) {
  if (event.key === 'Escape' && props.file && !processing.value) {
    emit('cancel')
  }
}

watch(
  () => Boolean(props.file),
  (open) => {
    if (open) document.addEventListener('keydown', onKeydown)
    else document.removeEventListener('keydown', onKeydown)
  },
  { immediate: true },
)

async function confirmCrop() {
  const img = imgRef.value
  if (!img || !naturalWidth.value || !props.file || processing.value) return
  processing.value = true

  try {
    const canvas = document.createElement('canvas')
    canvas.width = OUTPUT_SIZE
    canvas.height = OUTPUT_SIZE
    const ctx = canvas.getContext('2d')

    const imgLeft = VIEWPORT_SIZE / 2 - displayWidth.value / 2 + offsetX.value
    const imgTop = VIEWPORT_SIZE / 2 - displayHeight.value / 2 + offsetY.value
    const sx = Math.max(0, -imgLeft / currentScale.value)
    const sy = Math.max(0, -imgTop / currentScale.value)
    const sSize = Math.min(
      VIEWPORT_SIZE / currentScale.value,
      naturalWidth.value - sx,
      naturalHeight.value - sy,
    )

    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(img, sx, sy, sSize, sSize, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE)

    const isPng = /\.png$/i.test(props.file.name) || props.file.type === 'image/png'
    const mimeType = isPng ? 'image/png' : 'image/jpeg'
    const ext = isPng ? 'png' : 'jpg'
    const baseName = props.file.name.replace(/\.[^.]+$/, '') || 'avatar'

    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, mimeType, isPng ? undefined : 0.92),
    )
    if (!blob) {
      emit('error', 'Não foi possível recortar a imagem selecionada.')
      emit('cancel')
      return
    }
    const croppedFile = new File([blob], `${baseName}.${ext}`, { type: mimeType })
    emit('confirm', croppedFile)
  } finally {
    processing.value = false
  }
}

onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown)
  revokeUrl()
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
              <span class="mdi mdi-close" aria-hidden="true"></span>
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
              <span class="mdi mdi-magnify-minus-outline" aria-hidden="true"></span>
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
              <span class="mdi mdi-magnify-plus-outline" aria-hidden="true"></span>
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
  padding: 5px 10px;
  border-radius: $radius-sm;
  font-size: $text-xs;
  font-weight: $font-semibold;
  color: var(--text-muted);
  background: var(--altbg);
  transition:
    color $duration-fast $ease-fluid,
    background-color $duration-fast $ease-fluid;

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
