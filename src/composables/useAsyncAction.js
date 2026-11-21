import { shallowRef } from 'vue'
import { sessionError } from '@/stores/session'
import { formatApiError } from '@/utils/apiErrors'

/**
 * Coordena escrita assíncrona respeitando o escopo da conta autenticada
 * e evitando execuções simultâneas ou atualizações após desmontagem/troca de conta.
 */
export function useAsyncAction(scope) {
  const busy = shallowRef(false)
  const error = shallowRef('')
  const notice = shallowRef('')

  async function run(operation, { successMessage = '', fallbackError = 'Não foi possível concluir a operação.', onSuccess } = {}) {
    if (!scope.current() || busy.value) return { ok: false, data: null }
    busy.value = true
    error.value = ''
    notice.value = ''
    try {
      const data = await operation(scope.signal)
      if (!scope.current()) return { ok: false, data: null }
      if (successMessage) {
        notice.value = typeof successMessage === 'function' ? successMessage(data) : successMessage
      }
      if (onSuccess) await onSuccess(data)
      return { ok: true, data }
    } catch (cause) {
      if (scope.current() && !scope.signal.aborted) {
        error.value = sessionError(cause, formatApiError(cause, fallbackError))
      }
      return { ok: false, data: null }
    } finally {
      if (scope.current()) busy.value = false
    }
  }

  function clearFeedback() {
    error.value = ''
    notice.value = ''
  }

  return {
    busy,
    error,
    notice,
    run,
    clearFeedback,
  }
}
