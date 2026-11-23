import { onScopeDispose, ref, shallowRef, watch } from 'vue'
import { requestRegistrationCode } from '@/api/registration'
import { formatApiError } from '@/utils/apiErrors'
import { useCooldownTimer } from '@/composables/useCooldownTimer'

export function useEmailVerification() {
  const codigo = ref(['', '', '', '', '', ''])
  const enviandoCodigo = shallowRef(false)
  const erroCodigo = shallowRef('')
  const emailCodigo = shallowRef('')
  const { cooldown, startCooldown } = useCooldownTimer(60)
  const controller = new AbortController()
  const { signal } = controller

  function resetCodigo() {
    codigo.value = ['', '', '', '', '', '']
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
    const code = codigo.value.join('')
    if (!/^\d{6}$/.test(code)) {
      erroCodigo.value = 'Digite o código completo de 6 dígitos.'
      return null
    }
    return code
  }

  watch(codigo, () => {
    erroCodigo.value = ''
  })
  onScopeDispose(() => controller.abort())

  return { codigo, enviandoCodigo, erroCodigo, enviarCodigo, prepararVerificacao, codigoPara, cooldown, emailCodigo }
}
