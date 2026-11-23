import api from './client'

const RESOURCES = { passenger: 'passengers', driver: 'drivers', company: 'companies' }
const ADDRESS_FIELDS = ['cep', 'street', 'number', 'complement', 'neighborhood', 'city', 'state']
const COMPANY_DOCUMENTS = [
  'articles_of_association_document',
  'state_operating_license_document',
  'certificate_of_good_stading_document',
]

export async function readOwnProfile(role, { signal }) {
  if (!RESOURCES[role]) throw new Error('Perfil não disponível.')
  const { data } = await api.get(`/${RESOURCES[role]}/me/`, { signal })
  return data
}

export function profileDocumentFields(role) {
  return role === 'company' ? [...COMPANY_DOCUMENTS] : role === 'driver' ? ['cnh'] : []
}

export async function patchOwnProfile(role, part, values, { signal }) {
  const fields = {
    personal: ['name', 'phone', 'birthday'],
    personalAddress: ADDRESS_FIELDS,
    company: ['trade_name', 'legal_name', 'state_registration', 'contact_phone', 'contact_email'],
    companyAddress: ADDRESS_FIELDS,
    photo: ['profile_picture'],
  }[part]
  const companyPart = part === 'company' || part === 'companyAddress'
  if (!fields || (companyPart && role !== 'company')) throw new Error('Edição de perfil inválida.')
  const payload = {}
  for (const field of fields) {
    if (!(field in values)) continue
    let value = values[field]
    if (typeof value === 'string') value = value.trim()
    if (['phone', 'contact_phone', 'cep'].includes(field)) value = String(value || '').replace(/\D/g, '')
    if (field === 'state') value = String(value || '').toUpperCase()
    if (field === 'contact_email') value = String(value || '').toLowerCase()
    if (field === 'birthday' && !value) value = null
    payload[field] = value
  }
  return api.patch(companyPart ? '/companies/me/' : '/users/me/', payload, { signal })
}

export function attachProfileDocument(role, field, key, { signal }) {
  if (!profileDocumentFields(role).includes(field)) throw new Error('Documento não permitido neste perfil.')
  return api.patch(`/${RESOURCES[role]}/me/`, { [field]: key }, { signal })
}

export function downloadProfileDocument(key, { signal }) {
  return api.get(`/uploads/documents/${encodeURIComponent(key)}/download/`, { signal, responseType: 'blob' })
}
