import { createHttpClient } from './http.js'

export const http = createHttpClient({
  channel: typeof window !== 'undefined' && typeof BroadcastChannel === 'function'
    ? new BroadcastChannel('nextrouter-vue-session') : null,
})

if (import.meta.hot) import.meta.hot.dispose(() => http.dispose())

export default http.api
