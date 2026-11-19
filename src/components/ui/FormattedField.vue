<script setup>
import { useId } from 'vue'

const props = defineProps({
  modelValue: [String, Number],
  label: String,
  required: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  placeholder: String,
  maxlength: [String, Number],
  format: { type: Function, default: null },
  error: String,
  onlyNumbers: { type: Boolean, default: false },
})

const fieldId = useId()
const emit = defineEmits(['update:modelValue', 'blur'])

function handleInput(event) {
  if (props.format) {
    props.format(event, (v) => emit('update:modelValue', v))
    return
  }
  let value = event.target.value
  if (props.onlyNumbers) {
    value = String(value || '').replace(/\D/g, '')
    if (props.maxlength) value = value.slice(0, Number(props.maxlength))
    event.target.value = value
  }
  emit('update:modelValue', value)
}
</script>

<template>
  <div class="field-group" :class="{ 'has-error': error }">
    <label v-if="label" :for="fieldId"> {{ label }} <span v-if="required" class="required">*</span> </label>
    <input
      :id="fieldId"
      :value="modelValue"
      type="text"
      :inputmode="onlyNumbers || format ? 'numeric' : undefined"
      :placeholder="placeholder"
      :maxlength="maxlength"
      :disabled="disabled"
      :required="required"
      :aria-invalid="error ? true : undefined"
      :aria-describedby="error ? `${fieldId}-error` : undefined"
      @input="handleInput"
      @blur="$emit('blur', $event)"
    />
    <p v-if="error" :id="`${fieldId}-error`" class="field-error">{{ error }}</p>
  </div>
</template>

<style scoped>
.field-group {
  display: flex;
  flex-direction: column;
  margin-bottom: 16px;
}

.field-group label {
  color: var(--primary);
  font-weight: 600;
  font-size: 0.85rem;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.required {
  color: var(--danger);
}

.field-group input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid var(--border-primary);
  border-radius: 12px;
  font-size: 1rem;
  transition: all 0.3s ease;
  background: var(--bg);
  color: var(--text);
}

.field-group input:focus {
  outline: none;
  border-color: var(--primary);
  background: var(--bg);
  box-shadow: 0 0 0 3px rgba(223, 128, 26, 0.1);
}

.field-group input:disabled {
  background: var(--superfice);
  cursor: not-allowed;
  opacity: 0.6;
}

.field-group.has-error input {
  border-color: var(--danger);
}

.field-error {
  color: var(--danger);
  font-size: 12px;
  margin-top: 4px;
}
</style>
