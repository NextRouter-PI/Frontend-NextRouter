import { onScopeDispose, ref, shallowRef, watch } from 'vue'
import api from '@/api/client'
import { useValidator } from '@/composables/useValidation'
import { useCooldownTimer } from '@/composables/useCooldownTimer'
import { mapPasswordResetFailure, resolveConfirmResetError } from '@/features/auth/utils/passwordResetErrors'

export function usePasswordReset(options = {}) {
  const etapa = shallowRef(1)
  const email = shallowRef('')
  const emailCodigo = shallowRef('')
  const codigo = ref(['', '', '', '', '', ''])
  const novaSenha = shallowRef('')
  const confirmarSenha = shallowRef('')
  const erro = shallowRef('')
  const ocupado = shallowRef(false)
  const { cooldown, startCooldown, resetCooldown } = useCooldownTimer(60)
  const { requiredField, isEmail, isStrongPassword } = useValidator()
  const controller = new AbortController()
  const signal = options.signal ? AbortSignal.any([controller.signal, options.signal]) : controller.signal
  let verifiedCode = ''

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
        erro.value = mapPasswordResetFailure(
          error,
          'Não foi possível solicitar o código. Confira o formato do e-mail e tente novamente mais tarde.',
        )
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
        erro.value = mapPasswordResetFailure(
          error,
          'Código inválido, expirado ou utilizado. Confira o código ou solicite outro.',
        )
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
      resetCooldown()
      etapa.value = 4
    } catch (error) {
      if (signal.aborted) return
      const resolved = resolveConfirmResetError(error)
      if (resolved.backToCode) {
        verifiedCode = ''
        clearPasswords()
        codigo.value = ['', '', '', '', '', '']
        etapa.value = 2
      }
      erro.value = resolved.message
    } finally {
      if (!signal.aborted) ocupado.value = false
    }
  }

  watch(codigo, () => { verifiedCode = ''; erro.value = '' }, { flush: 'sync' })
  onScopeDispose(() => {
    controller.abort()
    clearPasswords()
    codigo.value = ['', '', '', '', '', '']
    verifiedCode = ''
  })

  return {
    etapa, email, emailCodigo, codigo, novaSenha, confirmarSenha, erro, ocupado, cooldown,
    solicitarCodigo, verificarCodigo, redefinirSenha, voltarAoEmail, voltarAoCodigo,
  }
}
