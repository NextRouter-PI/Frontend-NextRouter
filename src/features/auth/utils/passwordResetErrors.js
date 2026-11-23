import { formatApiError } from '@/utils/apiErrors'

// Não exibir detalhes de solicitação/verificação que possam enumerar contas.
export function mapPasswordResetFailure(error, fallback) {
  const status = error.response?.status
  if (status === 429) return 'Muitas tentativas. Aguarde antes de tentar novamente.'
  if (status === 401 || status === 403) {
    return 'Solicitação recusada. Recarregue a página antes de tentar novamente; a operação não foi repetida.'
  }
  return fallback
}

export function resolveConfirmResetError(error) {
  const status = error.response?.status
  const data = error.response?.data
  const passwordErrors =
    !data?.code && (data?.password || data?.new_password || data?.non_field_errors)
  if (status === 400 && Array.isArray(passwordErrors)) {
    return {
      backToCode: false,
      message: formatApiError({ response: { status, data: { password: passwordErrors } } }),
    }
  }
  if (status === 400) {
    return {
      backToCode: true,
      message: 'Não foi possível confirmar o código. Confira os seis dígitos ou solicite outro.',
    }
  }
  return {
    backToCode: false,
    message: mapPasswordResetFailure(
      error,
      'Não foi possível confirmar a redefinição. A operação não foi repetida; tente entrar com a nova senha antes de enviar novamente.',
    ),
  }
}
