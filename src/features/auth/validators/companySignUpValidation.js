import {
  isCEP,
  isCNPJ,
  isCPF,
  isEmail,
  requiredField,
  validatePassword,
} from '@/utils/validators'
import { DEFAULT_EMPTY_LABEL } from '@/constants'

export function validateCompanyPage1(validateForm, page1Form) {
  return validateForm([
    { fn: () => requiredField(page1Form.legalName, 'Razão Social'), field: 'legalName' },
    { fn: () => requiredField(page1Form.tradeName, 'Nome Fantasia'), field: 'tradeName' },
    { fn: () => requiredField(page1Form.cnpj, 'CNPJ') || isCNPJ(page1Form.cnpj), field: 'cnpj' },
    { fn: () => requiredField(page1Form.cep, 'Endereço') || isCEP(page1Form.cep), field: 'cep' },
  ])
}

export function validateCompanyPage2(validateForm, page1Form, files) {
  return validateForm([
    { fn: () => requiredField(page1Form.stateRegistration, 'Inscrição Estadual'), field: 'stateRegistration' },
    { fn: () => requiredField(files.articlesOfAssociation.file, 'Contrato Social'), field: 'articlesOfAssociation' },
    { fn: () => requiredField(files.stateOperatingLicense.file, 'Licença de Operação'), field: 'stateOperatingLicense' },
    { fn: () => requiredField(files.certificateOfGoodStading.file, 'Certidões Negativas'), field: 'certificateOfGoodStading' },
  ])
}

export function validateCompanyPage3(validateForm, page3Form) {
  return validateForm([
    { fn: () => requiredField(page3Form.ceoName, 'Nome'), field: 'ceoName' },
    { fn: () => requiredField(page3Form.ceoCpf, 'CPF') || isCPF(page3Form.ceoCpf), field: 'ceoCpf' },
    { fn: () => requiredField(page3Form.loginEmail, 'Email de login') || isEmail(page3Form.loginEmail), field: 'loginEmail' },
    { fn: () => validatePassword(page3Form.password, page3Form.passwordConfirm), field: 'password' },
  ])
}

export function buildCompanyReviewSections({ page1Form, page3Form, files }) {
  return {
    company: [
      { label: 'Razão Social:', value: page1Form.legalName },
      { label: 'Nome Fantasia:', value: page1Form.tradeName },
      { label: 'CNPJ:', value: page1Form.cnpj },
      { label: 'Telefone:', value: page1Form.contactPhone || DEFAULT_EMPTY_LABEL },
      { label: 'E-mail:', value: page1Form.contactEmail || DEFAULT_EMPTY_LABEL },
      { label: 'Localização:', value: `${page1Form.city}, ${page1Form.state} - ${page1Form.cep}` },
    ],
    ceo: [
      { label: 'Nome do CEO/Diretor/Sócio:', value: page3Form.ceoName },
      { label: 'CPF:', value: page3Form.ceoCpf },
      { label: 'Senha:', value: '••••••••' },
    ],
    documents: [
      { label: 'Contrato Social:', value: `✓ ${files.articlesOfAssociation.name}` },
      { label: 'Licença de Operação:', value: `✓ ${files.stateOperatingLicense.name}` },
      { label: 'Certidões Negativas:', value: `✓ ${files.certificateOfGoodStading.name}` },
    ],
  }
}
