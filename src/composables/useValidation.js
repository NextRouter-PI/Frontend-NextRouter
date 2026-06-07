import { ref, reactive } from 'vue'

export function useValidator() {
  const errorMessage = ref('') // String de erro que aparece lá embaixo do formulário

  const fieldErrors = reactive({}) // Objeto que guarda todos os erros de cada regra, são chamados nos templates html e usados como props como em FomattedField.vue. Aparecem embaixo de cada campo e sinalizam para o template se ele deve ter uma estilização de erro


  function clearErrors() {
    errorMessage.value = ''
    Object.keys(fieldErrors).forEach(k => delete fieldErrors[k])
  }

  // Limpa o erro específico no objeto de erros de campo, normalmente usado para limpar quando o usuário digitou novamente no campo de erro
  function clearFieldError(fieldName) {
    delete fieldErrors[fieldName]
  }


  function requiredField(value, label) {
    if (!value) return `${label} é obrigatório`

    // Não permite que o campo seja preenchido por espaços vazios
    if (typeof value === 'string' && !value.trim()) return `${label} é obrigatório`

    if (typeof value === 'number') return ''
    return ''
  }


  function minLengthField(value, min, label) {
    if (!value) return ''
    const len = typeof value === 'string' ? value.length : String(value).length
    if (len < min) return `${label} deve ter no mínimo ${min} caracteres`
    return ''
  }


  function maxLengthField(value, max, label) {
    if (!value) return ''
    const len = typeof value === 'string' ? value.length : String(value).length
    if (len > max) return `${label} deve ter no máximo ${max} caracteres`
    return ''
  }


  function isEmail(value) {
    if (!value) return ''
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!regex.test(value.trim())) return 'Email inválido'
    return ''
  }


  function isNumber(value, label) {
    if (!value && value !== 0) return ''
    if (isNaN(Number(value)) || value === '') return `${label} deve ser um número`
    return ''
  }


  function isCPF(value) {
    const digits = value.replace(/\D/g, '')
    if (digits.length !== 11) return 'CPF inválido'
    if (/^(\d)\1{10}$/.test(digits)) return 'CPF inválido'

    // TODO; Revisar validação e descomentar linhas em produção
    /*
        let sum = 0
        for (let i = 0; i < 9; i++) sum += parseInt(digits[i]) * (10 - i)
        let remainder = (sum * 10) % 11
        if (remainder === 10) remainder = 0
        if (remainder !== parseInt(digits[9])) return 'CPF inválido'
        sum = 0
        for (let i = 0; i < 10; i++) sum += parseInt(digits[i]) * (11 - i)
        remainder = (sum * 10) % 11
        if (remainder === 10) remainder = 0
        if (remainder !== parseInt(digits[10])) return 'CPF inválido'
      */
    return ''
  }


  function isCNPJ(value) {
    const digits = value.replace(/\D/g, '')
    if (digits.length !== 14) return 'CNPJ inválido'

    // TODO; Revisar validação e descomentar linhas em produção
    /*
    if (/^(\d)\1{13}$/.test(digits)) return 'CNPJ inválido'
    const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    let sum = 0
    for (let i = 0; i < 12; i++) sum += parseInt(digits[i]) * weights1[i]
    let remainder = sum % 11
    if (remainder < 2) remainder = 0
    else remainder = 11 - remainder
    if (remainder !== parseInt(digits[12])) return 'CNPJ inválido'

    const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    sum = 0
    for (let i = 0; i < 13; i++) sum += parseInt(digits[i]) * weights2[i]
    remainder = sum % 11
    if (remainder < 2) remainder = 0
    else remainder = 11 - remainder
    if (remainder !== parseInt(digits[13])) return 'CNPJ inválido'
    */
    return ''
  }


  function isPhone(value) {
    const digits = value.replace(/\D/g, '')
    if (!digits) return ''
    if (digits.length < 10 || digits.length > 11) return 'Telefone inválido'
    return ''
  }


  function isCEP(value) {
    const digits = value.replace(/\D/g, '')
    if (!digits) return ''
    if (digits.length !== 8) return 'CEP inválido'
    return ''
  }


  function passwordMatch(value, matchValue) {
    if (value !== matchValue) return `As senhas não coincidem`
    return ''
  }


  function validatePassword(password, confirmation) {
    const lengthErr = minLengthField(password, 6, 'Senha');
    if (lengthErr) return lengthErr;

    if (confirmation !== undefined) {
      return passwordMatch(password, confirmation);
    }

    return '';
  }


  function validateField(value, validators, fieldName) {
    clearFieldError(fieldName)
    for (const validator of validators) {
      const err = validator(value)
      if (err) {
        fieldErrors[fieldName] = err
        return false
      }
    }
    return true
  }


  function validateForm(rules) {
    clearErrors()

    // Condição de loop que faz a chamada de todas as regras que foram passadas para a função, exemplo no arquivo useSingUpCompanyForm.js
    for (const rule of rules) {
      // Inicia funções de validação como isEmail(), e de requerimento de campo como o requiredField()
      const err = rule.fn()

      // A constante 'err' contém ou a mensagem de erro dada pelas funções de validação, ou uma string vazia que equivale a um valor falso ('')
      if (err) {
        // Se a constante existe, passa pela condição e é atribuida a uma variável que está implementada diretamente numa tag html
        errorMessage.value = err

        // Condição que verifica qual é o campo em que a regra que retornou um erro está relacionada (nos campo de email isEmail está relacionado)
        if (rule.field) {
          fieldErrors[rule.field] = err // E atribui o erro ao objeto fieldErrors que está sendo chamado em uma tag no template
        }
        return false
      }
    }
    return true
  }


  async function getCEP(data) {
    const cleanCEP = data.cep.replace(/\D/g, '');
    if (cleanCEP.length === 8) {
      //mensagem.value = 'Buscando CEP...';
      //tipoMensagem.value = 'sucesso';
      try {
        const response = await fetch(`https://brasilapi.com.br/api/cep/v1/${cleanCEP}`); //!Mudar url para variável de ambiente e abandonar o hadcoded

        if (!response.ok) {
          throw new Error('CEP não encontrado ou inválido.');
        }

        const body = await response.json();

        data.state = body.state
        data.city = body.city

        // ? As mensagens de erro da api do brasilapi devem aparecer para o usuário? Descomentar se sim!
        /*
        mensagem.value = `
        <strong>CEP Válido!</strong><br>
        Rua: ${dados.street || 'Não informada'}<br>
        Bairro: ${dados.neighborhood || 'Não informado'}<br>
        Cidade: ${dados.city} - ${dados.state}`;
        tipoMensagem.value = 'sucesso';
        */
      } catch (error) {
        //mensagem.value = error.message;
        //tipoMensagem.value = 'erro';
      }
    } else {
      // Limpa a mensagem se o usuário apagar o CEP e ele ficar incompleto
      //mensagem.value = '';
    }
  }


  return {
    errorMessage,
    fieldErrors,
    clearErrors,
    clearFieldError,
    validateField,
    requiredField,
    minLengthField,
    maxLengthField,
    isEmail,
    passwordMatch,
    isNumber,
    isCPF,
    isCNPJ,
    isPhone,
    isCEP,
    validatePassword,
    validateForm,
    getCEP
  }
}
