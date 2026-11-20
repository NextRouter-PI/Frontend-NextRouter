<script setup>
import { useId } from 'vue'

defineProps({
  modelValue: String,
  label: String,
  required: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  placeholder: String,
  showPassword: { type: Boolean, default: false },
  error: String,
})

const fieldId = useId()
const emit = defineEmits(['update:modelValue', 'update:showPassword'])
</script>

<template>
  <div class="field-group" :class="{ 'has-error': error }">
    <label v-if="label" :for="fieldId">
      {{ label }} <span v-if="required" class="required">*</span>
    </label>
    <div class="password-input">
      <input
        :id="fieldId"
        :value="modelValue"
        :type="showPassword ? 'text' : 'password'"
        :placeholder="placeholder"
        :disabled="disabled"
        :required="required"
        :aria-invalid="error ? true : undefined"
        :aria-describedby="error ? `${fieldId}-error` : undefined"
        @input="emit('update:modelValue', $event.target.value)"
      />
      <button
        type="button"
        class="mdi toggle-password"
        :class="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
        :disabled="disabled"
        :aria-label="showPassword ? 'Ocultar senha' : 'Mostrar senha'"
        :aria-pressed="showPassword"
        @click="emit('update:showPassword', !showPassword)"
      ></button>
    </div>
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

.required { color: var(--danger); }

.password-input { position: relative; }

.password-input input {
  width: 100%;
  padding: 12px 45px 12px 16px;
  border: 2px solid var(--border-primary);
  border-radius: 12px;
  font-size: 1rem;
  transition: all 0.3s ease;
  background: var(--bg);
  color: var(--text);
}

.password-input input:focus {
  outline: none;
  border-color: var(--primary);
  background: var(--bg);
}

.password-input input:disabled {
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

.toggle-password {
  border: none;
  background: transparent;
  padding: 4px;
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
  color: var(--text-muted);
  font-size: 20px;
}

.toggle-password:hover:not(:disabled) { color: var(--primary); }
.toggle-password:disabled { opacity: 0.6; cursor: not-allowed; }
</style>
