/**
 * Escapa texto arbitrário antes de montar HTML para marcadores/tooltips de mapas.
 */
export function escapeHtml(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Monta HTML seguro de tooltip para marcador de passageiro no mapa.
 */
export function buildPassengerTooltipHtml(item) {
  const safeName = escapeHtml(item?.passenger_name || 'Passageiro')
  const avatar = item?.profile_picture_url
    ? `<img src="${escapeHtml(item.profile_picture_url)}" alt="${safeName}" class="pmap-tip-avatar" />`
    : `<span class="pmap-tip-fallback">${escapeHtml((item?.passenger_name || 'P').trim().charAt(0).toUpperCase())}</span>`
  return `<div class="pmap-tip">${avatar}<span class="pmap-tip-name">${safeName}</span></div>`
}
