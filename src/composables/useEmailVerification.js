import { ref, onUnmounted } from 'vue'
import api from '@/api/client'

const RESEND_COOLDOWN_SECONDS = 60

export function useEmailVerification() {
  const codigo = ref(['', '', '', '', '', ''])
  const enviandoCodigo = ref(false)
  const erroCodigo = ref('')
  const cooldown = ref(0)
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
    if (cooldown.value > 0) {
      erroCodigo.value = `Aguarde ${cooldown.value}s para reenviar o código.`
      return false
    }

    erroCodigo.value = ''
    enviandoCodigo.value = true
    try {
      await api.post('/email-tokens/send-email/', { email, token_type: 'new-user' })
      startCooldown()
      return true
    } catch (error) {
      erroCodigo.value =
        error.response?.data?.detail ||
        error.response?.data?.email?.[0] ||
        'Não foi possível enviar o código de verificação. Verifique o e-mail informado.'
      return false
    } finally {
      enviandoCodigo.value = false
    }
  }

  function resetCodigo() {
    codigo.value = ['', '', '', '', '', '']
  }

  function codigoCompleto() {
    return codigo.value.join('')
  }

  onUnmounted(stopCooldownTimer)

  return { codigo, enviandoCodigo, erroCodigo, enviarCodigo, resetCodigo, codigoCompleto, cooldown }
}
