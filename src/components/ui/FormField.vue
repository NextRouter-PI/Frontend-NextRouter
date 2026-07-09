<script setup>
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

const emit = defineEmits(['update:modelValue', 'blur'])
</script>

<template>
  <div class="field-group" :class="{ 'has-error': error }">
    <label v-if="label"> {{ label }} <span v-if="required" class="required">*</span> </label>
    <input
      :value="modelValue"
      @input="emit('update:modelValue', $event.target.value)"
      @blur="$emit('blur', $event)"
      :type="type"
      :required="required"
      :disabled="disabled"
      :placeholder="placeholder"
      :autocomplete="autocomplete"
      :maxlength="maxlength"
    />
    <p v-if="error" class="field-error">{{ error }}</p>
  </div>
</template>

<style scoped>
.field-group {
  margin-bottom: 16px;
}

.field-group label {
  display: block;
  color: var(--primary);
  font-weight: 600;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 6px;
}

.required {
  color: var(--danger);
}

.field-group input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid var(--border-primary);
  border-radius: 12px;
  background: var(--bg);
  font-size: 14px;
  color: var(--text);
  transition: all 0.3s ease;
}

.field-group input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(223, 128, 26, 0.1);
}

.field-group input:disabled {
  background: var(--superfice);
  color: var(--text-muted);
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
