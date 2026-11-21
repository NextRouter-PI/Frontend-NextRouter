import { useTrackingStore } from '@/stores/useTrackingStore'

export function useTravelTracking() {
  const store = useTrackingStore()
  return {
    state: store,
    startDriverTracking: store.startDriverTracking,
    startViewerTracking: store.startViewerTracking,
    stopTracking: store.stopTracking,
  }
}
