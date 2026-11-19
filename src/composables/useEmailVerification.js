import { ref, onScopeDispose } from 'vue'
import api from '@/api/client'
import { formatApiError } from '@/utils/apiErrors'

const RESEND_COOLDOWN_SECONDS = 60

export function useEmailVerification() {
  const codigo = ref(['', '', '', '', '', ''])
  const enviandoCodigo = ref(false)
  const erroCodigo = ref('')
  const cooldown = ref(0)
  const controller = new AbortController()
  const { signal } = controller
  let intervalId = null

  function stopCooldownTimer() {
    if (intervalId !== null) {
      clearInterval(intervalId)
      intervalId = null
    }
  }

  function startCooldown() {
    stopCooldownTimer()
    cooldown.value = RESEND_COOLDOWN_SECONDS
    intervalId = setInterval(() => {
      cooldown.value -= 1
      if (cooldown.value <= 0) stopCooldownTimer()
    }, 1000)
  }

  async function enviarCodigo(email) {
    if (signal.aborted || enviandoCodigo.value) return false
    if (cooldown.value > 0) {
      erroCodigo.value = `Aguarde ${cooldown.value}s para reenviar o código.`
      return false
    }

    erroCodigo.value = ''
    enviandoCodigo.value = true
    try {
      await api.post('/email-tokens/send-email/', { email, token_type: 'new-user' }, { signal })
      if (signal.aborted) return false
      startCooldown()
      return true
    } catch (error) {
      if (!signal.aborted) {
        erroCodigo.value = formatApiError(
          error,
          'Não foi possível enviar o código de verificação. Verifique o e-mail informado.',
        )
      }
      return false
    } finally {
      if (!signal.aborted) enviandoCodigo.value = false
    }
  }

  function resetCodigo() {
    codigo.value = ['', '', '', '', '', '']
  }

  function codigoCompleto() {
    return codigo.value.join('')
  }

  onScopeDispose(() => {
    controller.abort()
    stopCooldownTimer()
  })

  return { codigo, enviandoCodigo, erroCodigo, enviarCodigo, resetCodigo, codigoCompleto, cooldown }
}
