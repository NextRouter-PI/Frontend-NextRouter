// MapLibre com o worker empacotado pelo Vite.
// Sozinho, o MapLibre 6 procura `./maplibre-gl-worker.mjs` ao lado do próprio bundle; no build esse
// arquivo não é gerado e o mapa fica em branco ("Worker failed to load"). `?worker&url` gera o worker
// (com as dependências dele) como um arquivo do build e devolve a URL certa.
import * as maplibregl from 'maplibre-gl'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'

maplibregl.setWorkerUrl(workerUrl)

export default maplibregl
