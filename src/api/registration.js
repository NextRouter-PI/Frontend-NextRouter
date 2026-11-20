import api from './client'

const text = (value) => String(value ?? '').trim()
const digits = (value) => text(value).replace(/\D/g, '')

function addressData(form) {
  const data = {}
  for (const field of ['cep', 'street', 'number', 'complement', 'neighborhood', 'city', 'state']) {
    if (form[field] !== undefined) data[field] = text(form[field])
  }
  if (data.cep !== undefined) data.cep = digits(data.cep)
  if (data.state !== undefined) data.state = data.state.toUpperCase()
  const lat = Number(form.latitude)
  const lng = Number(form.longitude)
  if (form.latitude !== null && form.latitude !== '' && form.longitude !== null && form.longitude !== '' && Number.isFinite(lat) && Number.isFinite(lng)) {
    data.latitude = lat
    data.longitude = lng
  }
  return data
}

function userData(form) {
  const data = {
    name: text(form.name),
    email: text(form.email).toLowerCase(),
    cpf: digits(form.cpf),
    password: form.password,
    code: text(form.code),
    ...addressData(form),
  }
  if (form.phone !== undefined) data.phone = digits(form.phone)
  if (form.birthday) data.birthday = form.birthday
  return data
}

async function createAccount(resource, payload, { signal } = {}) {
  const { email, code } = payload.user_data
  // Verificar não consome o código; a criação revalida e consome no servidor.
  await api.post('/registration/verify/', { email, code }, { signal })
  signal?.throwIfAborted()
  return api.post(resource, payload, { signal })
}

export function requestRegistrationCode(email, { signal } = {}) {
  return api.post('/registration/request/', { email: text(email).toLowerCase() }, { signal })
}

export function createPassengerAccount(form, options) {
  return createAccount('/passengers/', { user_data: userData(form) }, options)
}

export function createDriverAccount(form, options) {
  return createAccount('/drivers/', {
    user_data: userData(form),
    cnh: form.cnh || null,
  }, options)
}

export function createCompanyAccount({ responsible, company, documents }, options) {
  return createAccount('/companies/', {
    user_data: userData(responsible),
    trade_name: text(company.tradeName),
    legal_name: text(company.legalName),
    cnpj: digits(company.cnpj),
    state_registration: text(company.stateRegistration),
    contact_phone: digits(company.contactPhone),
    contact_email: text(company.contactEmail).toLowerCase(),
    ...addressData(company),
    articles_of_association_document: documents.articlesOfAssociation,
    state_operating_license_document: documents.stateOperatingLicense,
    certificate_of_good_stading_document: documents.certificateOfGoodStading,
  }, options)
}
