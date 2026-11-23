// Nomes legíveis dos campos que a API pode devolver nas mensagens de erro.
const FIELD_LABELS = {
  user_data: '',
  email: 'E-mail',
  password: 'Senha',
  name: 'Nome',
  cpf: 'CPF',
  phone: 'Telefone',
  birthday: 'Data de nascimento',
  code: 'Código de verificação',
  cep: 'CEP',
  street: 'Rua',
  number: 'Número',
  complement: 'Complemento',
  neighborhood: 'Bairro',
  city: 'Cidade',
  state: 'Estado',
  profile_picture: 'Foto de perfil',
  cnh: 'CNH',
  cnpj: 'CNPJ',
  trade_name: 'Nome fantasia',
  legal_name: 'Razão social',
  state_registration: 'Inscrição estadual',
  contact_phone: 'Telefone de contato',
  contact_email: 'E-mail de contato',
  articles_of_association_document: 'Contrato social',
  state_operating_license_document: 'Licença de operação',
  certificate_of_good_stading_document: 'Certidões negativas',
  file: 'Arquivo',
  non_field_errors: '',
  detail: '',
}

function collectMessages(data, prefix = '') {
  if (data === null || data === undefined) return []
  if (typeof data === 'string') return [prefix ? `${prefix}: ${data}` : data]
  if (Array.isArray(data)) return data.flatMap((item) => collectMessages(item, prefix))
  if (typeof data === 'object') {
    return Object.entries(data).flatMap(([field, value]) => {
      const label = field in FIELD_LABELS ? FIELD_LABELS[field] : field
      return collectMessages(value, label || prefix)
    })
  }
  return [String(data)]
}

/**
 * Converte o erro de uma requisição (axios) numa mensagem legível para o usuário.
 * Os erros de validação do Django REST Framework vêm aninhados, ex.:
 * { "user_data": { "cpf": ["CPF inválido."] } } -> "CPF: CPF inválido."
 */
export function formatApiError(error, fallback = 'Não foi possível concluir a operação. Tente novamente.') {
  if (!error) return fallback

  if (!error.response) {
    if (typeof error === 'string') return error
    return 'Não foi possível conectar ao servidor. Verifique sua conexão ou se a API está no ar.'
  }

  const { status, data } = error.response

  if (status === 429) return 'Muitas tentativas. Aguarde alguns minutos e tente novamente.'
  if (status >= 500) {
    // Ex.: 502 do envio de e-mail, que traz uma mensagem própria em `detail`.
    return typeof data?.detail === 'string' ? data.detail : 'Erro interno no servidor. Tente novamente em instantes.'
  }

  // Respostas que não são JSON (ex.: página HTML de erro do Django)
  if (typeof data === 'string') return fallback

  const messages = collectMessages(data)
  return messages.length ? messages.join('\n') : fallback
}
