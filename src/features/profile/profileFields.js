const address = [
  { key: 'cep', label: 'CEP', maxlength: 9 },
  { key: 'street', label: 'Rua' }, { key: 'number', label: 'Número' },
  { key: 'complement', label: 'Complemento' }, { key: 'neighborhood', label: 'Bairro' },
  { key: 'city', label: 'Cidade' }, { key: 'state', label: 'UF', maxlength: 2 },
]

export const PROFILE_SECTIONS = {
  personal: {
    title: 'Dados pessoais', target: 'user',
    fields: [
      { key: 'name', label: 'Nome', required: true },
      { key: 'email', label: 'E-mail de acesso', readonly: true },
      { key: 'cpf', label: 'CPF', readonly: true },
      { key: 'phone', label: 'Telefone', type: 'tel' },
      { key: 'birthday', label: 'Data de nascimento', type: 'date' },
    ],
  },
  personalAddress: { title: 'Endereço pessoal', target: 'user', fields: address },
  company: {
    title: 'Dados empresariais', target: 'profile',
    fields: [
      { key: 'trade_name', label: 'Nome fantasia', required: true },
      { key: 'legal_name', label: 'Razão social', required: true },
      { key: 'cnpj', label: 'CNPJ', readonly: true },
      { key: 'state_registration', label: 'Inscrição estadual' },
      { key: 'contact_phone', label: 'Telefone de contato', type: 'tel' },
      { key: 'contact_email', label: 'E-mail de contato', type: 'email' },
    ],
  },
  companyAddress: { title: 'Endereço cadastral da empresa', target: 'profile', fields: address },
}

export const PROFILE_DOCUMENTS = {
  cnh: 'CNH (opcional)',
  articles_of_association_document: 'Contrato social',
  state_operating_license_document: 'Licença de operação',
  certificate_of_good_stading_document: 'Certidões negativas',
}
