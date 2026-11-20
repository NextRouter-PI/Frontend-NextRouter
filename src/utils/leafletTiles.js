import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

let iconsConfigured = false

export const DEFAULT_MAP_CENTER = [-26.3044, -48.8455]

const TILE_URLS = {
  light: 'https://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
  dark: 'https://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
}
const TILE_ATTRIBUTION = 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ'

export function ensureLeafletIcons() {
  if (iconsConfigured) return
  delete L.Icon.Default.prototype._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
  })
  iconsConfigured = true
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
