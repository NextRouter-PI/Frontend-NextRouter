import { onScopeDispose, ref } from 'vue'
import { requestEmailChange, verifyEmailChange, confirmEmailChange } from '@/api/account'
import { useAccountScope } from '@/composables/useAccountScope'
import { sessionError } from '@/stores/session'

export function useEmailChange() {
  const scope = useAccountScope()
  const step = ref(1)
  const newEmail = ref('')
  const requestedEmail = ref('')
  const code = ref(['', '', '', '', '', ''])
  const password = ref('')
  const busy = ref(false)
  const resending = ref(false)
  const blocked = ref(false)
  const error = ref('')
  const cooldown = ref(0)
  let verifiedCode = ''
  let timer = null
  let resendAt = 0

  function clearCode() {
    code.value = ['', '', '', '', '', '']
    verifiedCode = ''
    password.value = ''
  }
  function startCooldown() {
    clearInterval(timer)
    resendAt = Date.now() + 60000
    cooldown.value = 60
    timer = setInterval(() => {
      cooldown.value = Math.max(0, Math.ceil((resendAt - Date.now()) / 1000))
      if (!cooldown.value) clearInterval(timer)
    }, 1000)
  }
  async function run(operation, success, fallback, confirming = false) {
    if (!scope.current() || busy.value || blocked.value) return
    busy.value = true
    error.value = ''
    try {
      await operation({ signal: scope.signal })
      if (scope.current()) success()
    } catch (cause) {
      if (scope.current()) {
        error.value = sessionError(cause, fallback)
        if (!cause.response || cause.response.status >= 500) {
          error.value += ' O resultado é incerto; a operação não foi repetida. Confira o e-mail e entre novamente antes de repetir uma confirmação.'
        }
        if (confirming && (!cause.response || cause.response.status >= 500 || cause.response.status === 403)) {
          clearCode()
          blocked.value = true
          error.value += ' Atualize a conta ou recarregue a página para reiniciar o fluxo.'
        }
      }
    } finally {
      if (scope.current()) busy.value = false
    }
  }
  function request() {
    if (step.value > 2) return
    const target = step.value === 2 ? requestedEmail.value : newEmail.value.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(target)) {
      error.value = 'Digite um endereço de e-mail válido.'
      return
    }
    if (cooldown.value > 0 && target === requestedEmail.value) {
      step.value = 2
      return
    }
    const isResend = step.value === 2
    if (isResend) resending.value = true
    return run((options) => requestEmailChange(target, options), () => {
      requestedEmail.value = target
      clearCode()
      step.value = 2
      startCooldown()
    }, 'Não foi possível solicitar o código. Tente novamente mais tarde.').finally(() => {
      if (scope.current()) resending.value = false
    })
  }
  function verify() {
    const value = code.value.join('')
    if (step.value !== 2 || !/^\d{6}$/.test(value)) {
      error.value = 'Digite o código completo de seis dígitos.'
      return
    }
    return run((options) => verifyEmailChange(value, options), () => {
      if (code.value.join('') !== value) {
        error.value = 'O código mudou durante a verificação. Verifique os dígitos novamente.'
        return
      }
      verifiedCode = value
      step.value = 3
    }, 'Código inválido, expirado ou utilizado. Confira os dígitos ou solicite outro.')
  }
  function confirm() {
    if (step.value !== 3 || !verifiedCode || verifiedCode !== code.value.join('') || !password.value) {
      error.value = 'Verifique o código e informe sua senha atual.'
      return
    }
    return run((options) => confirmEmailChange(verifiedCode, password.value, options), () => {
      clearCode()
      newEmail.value = ''
      requestedEmail.value = ''
      step.value = 4
    }, 'Não foi possível confirmar a troca. Confira código e senha atual ou solicite outro código; nenhuma alteração foi presumida.', true)
  }
  function back() {
    if (busy.value || blocked.value) return
    clearCode()
    step.value = 1
    error.value = ''
  }
  onScopeDispose(() => {
    clearInterval(timer)
    clearCode()
    newEmail.value = ''
    requestedEmail.value = ''
  })
  return { step, newEmail, requestedEmail, code, password, busy, resending, blocked, error, cooldown, request, verify, confirm, back }
}
