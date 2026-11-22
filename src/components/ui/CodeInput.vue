<script setup>
import { useId } from 'vue'

const props = defineProps({ disabled: { type: Boolean, default: false } })
const modelValue = defineModel({ type: Array, default: () => ['', '', '', '', '', ''] })
const codeId = useId()
const inputs = []

function writeDigits(index, value) {
  if (props.disabled) return
  const digits = value.replace(/\D/g, '').slice(0, 6 - index)
  const next = Array.from({ length: 6 }, (_, position) => modelValue.value[position] || '')
  next[index] = ''
  for (let offset = 0; offset < digits.length; offset++) next[index + offset] = digits[offset]
  modelValue.value = next
  if (digits) inputs[Math.min(index + digits.length, 5)]?.focus()
  return next
}

function handleInput(index, event) {
  const next = writeDigits(index, event.target.value)
  if (next) event.target.value = next[index]
}

function handleKeydown(index, event) {
  if (props.disabled) return
  if (event.key === 'Backspace' && !modelValue.value[index] && index > 0) {
    event.preventDefault()
    inputs[index - 1]?.focus()
  }
}

function handlePaste(index, event) {
  event.preventDefault()
  const digits = (event.clipboardData?.getData('text') || '').replace(/\D/g, '')
  if (digits) writeDigits(index, digits)
}
</script>

<template>
  <div class="codigo-inputs">
    <input
      v-for="(digit, index) in modelValue"
      :id="`${codeId}-${index}`"
      :ref="(element) => { inputs[index] = element }"
      :key="index"
      :value="digit"
      type="text"
      maxlength="6"
      inputmode="numeric"
      :autocomplete="index === 0 ? 'one-time-code' : 'off'"
      :aria-label="`Código de verificação, dígito ${index + 1}`"
      :disabled="disabled"
      class="codigo-input"
      @input="handleInput(index, $event)"
      @keydown="handleKeydown(index, $event)"
      @paste="handlePaste(index, $event)"
    />
  </div>
</template>

<style lang="scss" scoped>
.codigo-inputs {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 20px;
}

.codigo-input {
  width: 45px;
  height: 50px;
  border: 2px solid var(--primary);
  border-radius: 8px;
  text-align: center;
  font-size: 20px;
  font-weight: bold;
  color: var(--primary);
  outline: none;
  transition: 0.2s;
}

.codigo-input:focus {
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.1);
  border-color: var(--primary);
}
</style>
