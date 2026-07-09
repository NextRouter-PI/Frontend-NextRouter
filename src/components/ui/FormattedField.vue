<script setup>
defineProps({
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

const emit = defineEmits(['update:modelValue', 'blur'])

const onlyNumbersKeypress = (event) => {
  const keysAllowed = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']
  const keyPressed = event.key

  if (!keysAllowed.includes(keyPressed)) {
    event.preventDefault()
  }
}
</script>

<template>
  <div class="field-group" :class="{ 'has-error': error }">
    <label v-if="label"> {{ label }} <span v-if="required" class="required">*</span> </label>
    <input
      :value="modelValue"
      @input="
        format
          ? format($event, (v) => emit('update:modelValue', v))
          : emit('update:modelValue', $event.target.value)
      "
      type="text"
      :placeholder="placeholder"
      @blur="$emit('blur', $event)"
      :maxlength="maxlength"
      :disabled="disabled"
      @keypress="onlyNumbers ? onlyNumbersKeypress($event) : null"
    />
    <p v-if="error" class="field-error">{{ error }}</p>
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
