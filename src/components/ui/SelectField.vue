<script setup>
import { useId } from 'vue'

defineProps({
  modelValue: String,
  label: String,
  options: { type: Array, default: () => [] },
  required: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  placeholder: { type: String, default: 'Selecione' },
})

const fieldId = useId()
const emit = defineEmits(['update:modelValue'])
</script>

<template>
  <div class="field-group">
    <label v-if="label" :for="fieldId">
      {{ label }}<span v-if="required" class="required">*</span>
    </label>
    <select
      :id="fieldId"
      :value="modelValue"
      :disabled="disabled"
      :required="required"
      @change="emit('update:modelValue', $event.target.value)"
    >
      <option value="">{{ placeholder }}</option>
      <option v-for="opt in options" :key="opt.value" :value="opt.value">
        {{ opt.label }}
      </option>
    </select>
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

.field-group select {
  width: 100%;
  padding: 11px 14px;
  border: none;
  outline: 1.5px solid var(--border);
  outline-offset: -1.5px;
  border-radius: var(--border-radius);
  font-size: 0.92rem;
  transition: outline-color 0.2s var(--ease-fluid);
  background: var(--superfice);
  color: var(--text);
  appearance: auto;
}

.field-group select:focus {
  outline: 2px solid var(--primary);
  outline-offset: -2px;
}
</style>
