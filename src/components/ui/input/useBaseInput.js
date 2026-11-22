import { computed, shallowRef } from 'vue'

export function useBaseInput({ props, model, externalShowPassword, emit }) {
  const localShowPassword = shallowRef(false)
  const isFocused = shallowRef(false)

  const isPassword = computed(() => props.type === 'password')
  const isFloating = computed(() => props.variant === 'floating')
  const floatingLabel = computed(() => props.label || props.placeholder || props.ariaLabel)
  const hasValue = computed(() => String(model.value ?? '').length > 0)
  const isFloated = computed(() => isFloating.value && (isFocused.value || hasValue.value))
  const isPasswordVisible = computed(() =>
    externalShowPassword.value !== undefined ? externalShowPassword.value : localShowPassword.value,
  )
  const resolvedType = computed(() =>
    isPassword.value ? (isPasswordVisible.value ? 'text' : 'password') : props.type,
  )
  const resolvedInputMode = computed(() =>
    props.onlyNumbers || props.format ? 'numeric' : undefined,
  )

  function togglePassword() {
    const next = !isPasswordVisible.value
    if (externalShowPassword.value !== undefined) externalShowPassword.value = next
    else localShowPassword.value = next
  }

  function handleFocus(event) {
    isFocused.value = true
    emit('focus', event)
  }

  function handleInput(event) {
    if (props.format) {
      props.format(event, (formatted) => {
        model.value = formatted
      })
      emit('input', event)
      return
    }
    let value = event.target.value
    if (props.onlyNumbers) {
      value = String(value || '').replace(/\D/g, '')
      if (props.maxlength) value = value.slice(0, Number(props.maxlength))
      event.target.value = value
    }
    model.value = value
    emit('input', event)
  }

  function handleBlur(event) {
    isFocused.value = false
    emit('blur', event)
  }

  return {
    isFocused,
    isPassword,
    isFloating,
    floatingLabel,
    isFloated,
    isPasswordVisible,
    resolvedType,
    resolvedInputMode,
    togglePassword,
    handleFocus,
    handleInput,
    handleBlur,
  }
}
