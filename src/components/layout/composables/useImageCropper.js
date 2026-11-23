import { computed, onUnmounted, shallowRef, watch } from 'vue'
import { exportCroppedAvatarFile } from '@/utils/canvasCrop'

const VIEWPORT_SIZE = 280
const OUTPUT_SIZE = 512

export function useImageCropper({ getFile, imgRef, onConfirm, onCancel, onError }) {
  const imageUrl = shallowRef('')
  const naturalWidth = shallowRef(0)
  const naturalHeight = shallowRef(0)
  const zoom = shallowRef(1)
  const offsetX = shallowRef(0)
  const offsetY = shallowRef(0)
  const dragging = shallowRef(false)
  const processing = shallowRef(false)

  let dragStartX = 0
  let dragStartY = 0
  let startOffsetX = 0
  let startOffsetY = 0

  const baseScale = computed(() =>
    naturalWidth.value && naturalHeight.value
      ? Math.max(VIEWPORT_SIZE / naturalWidth.value, VIEWPORT_SIZE / naturalHeight.value)
      : 1,
  )
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
    if (!imageUrl.value) return
    URL.revokeObjectURL(imageUrl.value)
    imageUrl.value = ''
  }

  function resetCrop() {
    zoom.value = 1
    offsetX.value = offsetY.value = 0
  }

  watch(getFile, (nextFile) => {
    revokeUrl()
    naturalWidth.value = naturalHeight.value = 0
    resetCrop()
    if (nextFile) imageUrl.value = URL.createObjectURL(nextFile)
  }, { immediate: true })

  watch(zoom, () => clampOffsets(offsetX.value, offsetY.value))

  function onImageLoad(event) {
    naturalWidth.value = event.target.naturalWidth || 0
    naturalHeight.value = event.target.naturalHeight || 0
    resetCrop()
  }

  function onImageError() {
    revokeUrl()
    onError('Não foi possível carregar a imagem selecionada. Tente outro arquivo JPG ou PNG.')
    onCancel()
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
    if (dragging.value) clampOffsets(startOffsetX + (event.clientX - dragStartX), startOffsetY + (event.clientY - dragStartY))
  }

  function onPointerUp(event) {
    if (!dragging.value) return
    dragging.value = false
    event.currentTarget.releasePointerCapture?.(event.pointerId)
  }

  const stepZoom = (delta) => { zoom.value = Number(Math.min(3, Math.max(1, zoom.value + delta)).toFixed(2)) }
  const onWheel = (event) => { if (naturalWidth.value && !processing.value) stepZoom(event.deltaY < 0 ? 0.12 : -0.12) }
  const handleCancel = () => { if (!processing.value) onCancel() }
  const onKeydown = (event) => { if (event.key === 'Escape' && getFile() && !processing.value) onCancel() }

  watch(() => Boolean(getFile()), (open) => {
    if (open) document.addEventListener('keydown', onKeydown)
    else document.removeEventListener('keydown', onKeydown)
  }, { immediate: true })

  async function confirmCrop() {
    const img = imgRef.value
    const file = getFile()
    if (!img || !naturalWidth.value || !file || processing.value) return
    processing.value = true
    try {
      const cropped = await exportCroppedAvatarFile({
        img, file, viewportSize: VIEWPORT_SIZE, outputSize: OUTPUT_SIZE,
        displayWidth: displayWidth.value, displayHeight: displayHeight.value,
        currentScale: currentScale.value, offsetX: offsetX.value, offsetY: offsetY.value,
        naturalWidth: naturalWidth.value, naturalHeight: naturalHeight.value,
      })
      if (!cropped) {
        onError('Não foi possível recortar a imagem selecionada.')
        onCancel()
        return
      }
      onConfirm(cropped)
    } finally {
      processing.value = false
    }
  }

  onUnmounted(() => {
    document.removeEventListener('keydown', onKeydown)
    revokeUrl()
  })

  return {
    imageUrl, naturalWidth, zoom, dragging, processing, imageStyle,
    resetCrop, onImageLoad, onImageError, onPointerDown, onPointerMove, onPointerUp,
    onWheel, stepZoom, handleCancel, confirmCrop,
  }
}
