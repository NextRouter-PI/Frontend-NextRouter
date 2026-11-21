import { useAuthStore } from './useAuthStore.js'

export function useLoginState() {
  return useAuthStore()
}
