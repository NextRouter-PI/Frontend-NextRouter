export function useInputFormat() {


  const onlyNumbers = (value) => value.replace(/\D/g, '')


  const formatCPF = (event, setter) => {
    let value = onlyNumbers(event.target.value)
    if (value.length > 11) value = value.slice(0, 11)
    value = value.replace(/^(\d{3})(\d)/, '$1.$2')
    value = value.replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    value = value.replace(/\.(\d{3})(\d)/, '.$1-$2')
    setter(value)
  }


  const formatPhone = (event, setter) => {
    let value = onlyNumbers(event.target.value)
    if (value.length > 11) value = value.slice(0, 11)
    if (value.length <= 10) {
      value = value.replace(/^(\d{2})(\d)/, '($1) $2')
      value = value.replace(/(\d{4})(\d)/, '$1-$2')
    } else {
      value = value.replace(/^(\d{2})(\d)/, '($1) $2')
      value = value.replace(/(\d{5})(\d)/, '$1-$2')
    }
    setter(value)
  }


  const formatCEP = (event, setter) => {
    let value = onlyNumbers(event.target.value)
    if (value.length > 8) value = value.slice(0, 8)
    value = value.replace(/^(\d{5})(\d)/, '$1-$2')
    setter(value)
  }


  const formatCNPJ = (event, setter) => {
    let value = onlyNumbers(event.target.value)
    if (value.length > 14) value = value.slice(0, 14)
    value = value.replace(/^(\d{2})(\d)/, '$1.$2')
    value = value.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    value = value.replace(/\.(\d{3})(\d)/, '.$1/$2')
    value = value.replace(/(\d{4})(\d)/, '$1-$2')
    setter(value)
  }


  return {
    formatCPF,
    formatPhone,
    formatCEP,
    formatCNPJ
  }
}
