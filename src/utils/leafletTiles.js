import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

export const DEFAULT_MAP_CENTER = [-26.3044, -48.8455]

const TILE_URLS = {
  light: 'https://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
  dark: 'https://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
}
const TILE_ATTRIBUTION = 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ'

// Mantido como no-op compatível para evitar ícones azuis padrão do Leaflet.
export function ensureLeafletIcons() {}

function escapeAttr(value) {
  return String(value ?? '').replace(/[^a-zA-Z0-9_-]/g, '')
}

function escapeHtmlAttr(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

export function createPinIcon({
  variant = 'primary',
  icon = 'mdi-map-marker',
  label = '',
  avatarUrl = '',
  avatarAlt = '',
  pulse = false,
  size = 'md',
} = {}) {
  const safeVariant = escapeAttr(variant) || 'primary'
  const safeSize = size === 'sm' ? 'sm' : 'md'
  const safeIcon = escapeAttr(icon)
  let inner
  if (avatarUrl) {
    const safeUrl = escapeHtmlAttr(avatarUrl)
    const safeAlt = escapeHtmlAttr(avatarAlt || 'Passageiro')
    inner = `<img src="${safeUrl}" alt="${safeAlt}" class="nr-map-pin__avatar" />`
  } else if (label) {
    inner = `<span class="nr-map-pin__label">${escapeHtmlAttr(label)}</span>`
  } else {
    inner = `<span class="mdi ${safeIcon}" aria-hidden="true"></span>`
  }

  const dim = safeSize === 'sm' ? [28, 36] : [36, 44]
  const anchor = safeSize === 'sm' ? [14, 34] : [18, 42]
  const popupAnchor = safeSize === 'sm' ? [0, -34] : [0, -42]

  return L.divIcon({
    className: 'nr-pin-wrapper',
    html: `<div class="nr-map-pin nr-map-pin--${safeVariant} nr-map-pin--${safeSize}${pulse ? ' nr-map-pin--pulse' : ''}${avatarUrl ? ' nr-map-pin--avatar' : ''}"><span class="nr-map-pin__body">${inner}</span></div>`,
    iconSize: dim,
    iconAnchor: anchor,
    popupAnchor,
    tooltipAnchor: [0, -anchor[1] + 4],
  })
}

export function currentMapTheme() {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

export function attachThemedTileLayer(map) {
  let tileLayer = null

  function apply(theme = currentMapTheme()) {
    if (!map) return
    if (tileLayer) map.removeLayer(tileLayer)
    tileLayer = L.tileLayer(TILE_URLS[theme], {
      maxZoom: 18,
      maxNativeZoom: 16,
      attribution: TILE_ATTRIBUTION,
    }).addTo(map)
  }

  apply()
  const observer = new MutationObserver(() => apply())
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })

  return () => {
    observer.disconnect()
    if (tileLayer && map) map.removeLayer(tileLayer)
    tileLayer = null
  }
}
