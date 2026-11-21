import { sessionError } from '@/stores/session'
import { formatApiError } from '@/utils/apiErrors'

export async function runStoreRequest(storeState, signal, fallback, fn, fallbackResult = null) {
  storeState.error = null
  try {
    return await fn()
  } catch (error) {
    if (!signal?.aborted) {
      storeState.error = sessionError(error, formatApiError(error, fallback))
    }
    return fallbackResult
  }
}
