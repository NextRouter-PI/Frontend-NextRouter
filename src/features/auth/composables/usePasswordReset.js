import { onScopeDispose, ref, watch } from 'vue'
import api from '@/api/client'
import { useValidator } from '@/composables/useValidation'
import { formatApiError } from '@/utils/apiErrors'

export function usePasswordReset(options = {}) {
  const etapa = ref(1)
  const email = ref('')
  const emailCodigo = ref('')
  const codigo = ref(['', '', '', '', '', ''])
  const novaSenha = ref('')
  const confirmarSenha = ref('')
  const erro = ref('')
  const ocupado = ref(false)
  const cooldown = ref(0)
  const { requiredField, isEmail, isStrongPassword } = useValidator()
  const controller = new AbortController()
  const signal = options.signal ? AbortSignal.any([controller.signal, options.signal]) : controller.signal
  let verifiedCode = ''
  let interval = null

  function stopCooldown() {
    clearInterval(interval)
    interval = null
  }

  function startCooldown() {
    stopCooldown()
    const until = Date.now() + 60000
    cooldown.value = 60
    interval = setInterval(() => {
      cooldown.value = Math.max(0, Math.ceil((until - Date.now()) / 1000))
      if (!cooldown.value) stopCooldown()
    }, 1000)
  }

  // Não exibir detalhes de solicitação/verificação que possam enumerar contas.
  function failure(error, fallback) {
    const status = error.response?.status
    if (status === 429) return 'Muitas tentativas. Aguarde antes de tentar novamente.'
    if (status === 401 || status === 403) {
      return 'Solicitação recusada. Recarregue a página antes de tentar novamente; a operação não foi repetida.'
    }
    return fallback
  }

  function clearPasswords() {
    novaSenha.value = ''
    confirmarSenha.value = ''
  }

  async function solicitarCodigo() {
    if (signal.aborted || ocupado.value || etapa.value > 2) return
    const target = etapa.value === 2 ? emailCodigo.value : email.value.trim().toLowerCase()
    erro.value = requiredField(target, 'E-mail') || isEmail(target)
    if (erro.value) return
    if (target === emailCodigo.value && cooldown.value > 0) {
      if (etapa.value === 1) etapa.value = 2
      else erro.value = `Aguarde ${cooldown.value}s para reenviar o código.`
      return
    }

    ocupado.value = true
    try {
      await api.post('/password-reset/request/', { email: target }, { signal })
      if (signal.aborted) return
      emailCodigo.value = target
      codigo.value = ['', '', '', '', '', '']
      clearPasswords()
      etapa.value = 2
      startCooldown()
    } catch (error) {
      if (!signal.aborted) {
        erro.value = failure(error, 'Não foi possível solicitar o código. Confira o formato do e-mail e tente novamente mais tarde.')
      }
    } finally {
      if (!signal.aborted) ocupado.value = false
    }
  }

  async function verificarCodigo() {
    if (signal.aborted || ocupado.value || etapa.value !== 2) return
    const code = codigo.value.join('')
    if (!/^\d{6}$/.test(code)) {
      erro.value = 'Digite o código completo de 6 dígitos.'
      return
    }
    erro.value = ''
    ocupado.value = true
    try {
      await api.post('/password-reset/verify/', { email: emailCodigo.value, code }, { signal })
      if (signal.aborted) return
      verifiedCode = code
      etapa.value = 3
    } catch (error) {
      if (!signal.aborted) {
        erro.value = failure(error, 'Código inválido, expirado ou utilizado. Confira o código ou solicite outro.')
      }
    } finally {
      if (!signal.aborted) ocupado.value = false
    }
  }

  function voltarAoCodigo() {
    if (signal.aborted || ocupado.value) return
    verifiedCode = ''
    clearPasswords()
    etapa.value = 2
    erro.value = ''
  }

  function voltarAoEmail() {
    if (signal.aborted || ocupado.value) return
    voltarAoCodigo()
    codigo.value = ['', '', '', '', '', '']
    etapa.value = 1
  }

  async function redefinirSenha() {
    if (signal.aborted || ocupado.value || etapa.value !== 3) return
    if (!verifiedCode || verifiedCode !== codigo.value.join('')) {
      voltarAoCodigo()
      erro.value = 'Verifique o código antes de definir a nova senha.'
      return
    }
    erro.value = requiredField(novaSenha.value, 'Nova senha') || isStrongPassword(novaSenha.value)
    if (!erro.value && novaSenha.value !== confirmarSenha.value) erro.value = 'As senhas não coincidem.'
    if (erro.value) return

    ocupado.value = true
    try {
      await api.post('/password-reset/confirm/', {
        email: emailCodigo.value, code: verifiedCode, new_password: novaSenha.value,
      }, { signal })
      if (signal.aborted) return
      verifiedCode = ''
      clearPasswords()
      codigo.value = ['', '', '', '', '', '']
      email.value = ''
      emailCodigo.value = ''
      stopCooldown()
      cooldown.value = 0
      etapa.value = 4
    } catch (error) {
      if (signal.aborted) return
      const status = error.response?.status
      const data = error.response?.data
      const passwordErrors = !data?.code &&
        (data?.password || data?.new_password || data?.non_field_errors)
      if (status === 400 && Array.isArray(passwordErrors)) {
        erro.value = formatApiError({ response: { status, data: { password: passwordErrors } } })
      } else if (status === 400) {
        verifiedCode = ''
        clearPasswords()
        codigo.value = ['', '', '', '', '', '']
        etapa.value = 2
        erro.value = 'Não foi possível confirmar o código. Confira os seis dígitos ou solicite outro.'
      } else {
        erro.value = failure(error, 'Não foi possível confirmar a redefinição. A operação não foi repetida; tente entrar com a nova senha antes de enviar novamente.')
      }
    } finally {
      if (!signal.aborted) ocupado.value = false
    }
  }

  watch(codigo, () => {
    verifiedCode = ''
    erro.value = ''
  }, { flush: 'sync' })

  onScopeDispose(() => {
    controller.abort()
    stopCooldown()
    clearPasswords()
    codigo.value = ['', '', '', '', '', '']
    verifiedCode = ''
  })

  return {
    etapa, email, emailCodigo, codigo, novaSenha, confirmarSenha, erro, ocupado, cooldown,
    solicitarCodigo, verificarCodigo, redefinirSenha, voltarAoEmail, voltarAoCodigo,
  }
}
