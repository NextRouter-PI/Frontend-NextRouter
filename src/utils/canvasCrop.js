export async function exportCroppedAvatarFile({
  img,
  file,
  viewportSize,
  outputSize,
  displayWidth,
  displayHeight,
  currentScale,
  offsetX,
  offsetY,
  naturalWidth,
  naturalHeight,
}) {
  const canvas = document.createElement('canvas')
  canvas.width = outputSize
  canvas.height = outputSize
  const ctx = canvas.getContext('2d')

  const imgLeft = viewportSize / 2 - displayWidth / 2 + offsetX
  const imgTop = viewportSize / 2 - displayHeight / 2 + offsetY
  const sx = Math.max(0, -imgLeft / currentScale)
  const sy = Math.max(0, -imgTop / currentScale)
  const sSize = Math.min(viewportSize / currentScale, naturalWidth - sx, naturalHeight - sy)

  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, sx, sy, sSize, sSize, 0, 0, outputSize, outputSize)

  const isPng = /\.png$/i.test(file.name) || file.type === 'image/png'
  const mimeType = isPng ? 'image/png' : 'image/jpeg'
  const ext = isPng ? 'png' : 'jpg'
  const baseName = file.name.replace(/\.[^.]+$/, '') || 'avatar'

  const blob = await new Promise((resolve) =>
    canvas.toBlob(resolve, mimeType, isPng ? undefined : 0.92),
  )
  if (!blob) return null
  return new File([blob], `${baseName}.${ext}`, { type: mimeType })
}
