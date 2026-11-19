import { ref, onScopeDispose, watch } from 'vue'
import { requestRegistrationCode } from '@/api/registration'
import { formatApiError } from '@/utils/apiErrors'

const RESEND_COOLDOWN_SECONDS = 60

export function useEmailVerification() {
  const codigo = ref(['', '', '', '', '', ''])
  const enviandoCodigo = ref(false)
  const erroCodigo = ref('')
  const cooldown = ref(0)
  const emailCodigo = ref('')
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
    const normalized = email.trim().toLowerCase()
    if (cooldown.value > 0 && emailCodigo.value === normalized) {
      erroCodigo.value = `Aguarde ${cooldown.value}s para reenviar o código.`
      return false
    }

    erroCodigo.value = ''
    enviandoCodigo.value = true
    try {
      await requestRegistrationCode(normalized, { signal })
      if (signal.aborted) return false
      emailCodigo.value = normalized
      resetCodigo()
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

  async function prepararVerificacao(email) {
    if (signal.aborted || enviandoCodigo.value) return false
    if (emailCodigo.value === email.trim().toLowerCase() && cooldown.value > 0) {
      erroCodigo.value = ''
      return true
    }
    return enviarCodigo(email)
  }

  function codigoPara(email) {
    if (emailCodigo.value !== email.trim().toLowerCase()) {
      erroCodigo.value = 'O e-mail foi alterado. Volte à revisão e solicite um código para esse endereço.'
      return null
    }
    const code = codigoCompleto()
    if (!/^\d{6}$/.test(code)) {
      erroCodigo.value = 'Digite o código completo de 6 dígitos.'
      return null
    }
    return code
  }

  watch(codigo, () => { erroCodigo.value = '' })

  onScopeDispose(() => {
    controller.abort()
    stopCooldownTimer()
  })

  return {
    codigo, enviandoCodigo, erroCodigo, enviarCodigo, prepararVerificacao,
    codigoPara, cooldown, emailCodigo,
  }
}
