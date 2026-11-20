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
    <label v-if="label" :for="fieldId">
      {{ label }}<span v-if="required" class="required">*</span>
    </label>
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
      @blur="emit('blur', $event)"
    />
    <Transition name="fade-slide">
      <p v-if="error" :id="`${fieldId}-error`" class="field-error">{{ error }}</p>
    </Transition>
  </div>
</template>

<style scoped>
.field-group {
  display: flex;
  flex-direction: column;
  margin-bottom: 14px;
}

.field-group label {
  color: var(--primary);
  font-weight: 600;
  font-size: 0.82rem;
  margin-bottom: 6px;
}

.required {
  color: var(--primary);
  margin-left: 2px;
}

.field-group input {
  width: 100%;
  padding: 11px 14px;
  border: 1.5px solid var(--border);
  border-radius: var(--border-radius);
  font-size: 0.92rem;
  transition: border-color 0.2s var(--ease-fluid), box-shadow 0.2s var(--ease-fluid),
    background-color 0.2s var(--ease-fluid);
  background: var(--superfice);
  color: var(--text);
}

.field-group input::placeholder {
  color: var(--text-muted);
}

.field-group input:focus {
  outline: none;
  border-color: var(--primary);
}

.field-group input:disabled {
  background: var(--input-surface);
  color: var(--text-muted);
  cursor: not-allowed;
}

.field-group.has-error input {
  border-color: var(--danger);
}

.field-error {
  color: var(--danger);
  font-size: 0.78rem;
  margin-top: 4px;
}
</style>
