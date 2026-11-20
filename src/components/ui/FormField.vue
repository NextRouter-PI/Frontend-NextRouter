<script setup>
import { useId } from 'vue'

defineProps({
  modelValue: [String, Number],
  label: String,
  type: { type: String, default: 'text' },
  required: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  placeholder: String,
  autocomplete: String,
  error: String,
  maxlength: [String, Number],
})

const fieldId = useId()
const emit = defineEmits(['update:modelValue', 'blur'])
</script>

<template>
  <div class="field-group" :class="{ 'has-error': error }">
    <label v-if="label" :for="fieldId">
      {{ label }}<span v-if="required" class="required">*</span>
    </label>
    <input
      :id="fieldId"
      :value="modelValue"
      :type="type"
      :required="required"
      :disabled="disabled"
      :placeholder="placeholder"
      :autocomplete="autocomplete"
      :maxlength="maxlength"
      :aria-invalid="error ? true : undefined"
      :aria-describedby="error ? `${fieldId}-error` : undefined"
      @input="emit('update:modelValue', $event.target.value)"
      @blur="emit('blur', $event)"
    />
    <Transition name="fade-slide">
      <p v-if="error" :id="`${fieldId}-error`" class="field-error">{{ error }}</p>
    </Transition>
  </div>
</template>

<style scoped>
.field-group {
  margin-bottom: 14px;
}

.field-group label {
  display: block;
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
  background: var(--superfice);
  font-size: 0.92rem;
  color: var(--text);
  transition: border-color 0.2s var(--ease-fluid), box-shadow 0.2s var(--ease-fluid),
    background-color 0.2s var(--ease-fluid);
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
