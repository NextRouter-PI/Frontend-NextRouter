<script setup>
defineProps({
  modelValue: [String, Number],
  label: String,
  required: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  placeholder: String,
  maxlength: [String, Number],
  format: { type: Function, default: null }
})

const emit = defineEmits(['update:modelValue'])

function handleInput(event) {
  const setter = (val) => emit('update:modelValue', val)
  if (event.target.value) {
    event.target.value = event.target.value
  }
  emit('update:modelValue', event.target.value)
}
</script>

<template>
  <div class="field-group">
    <label v-if="label">
      {{ label }} <span v-if="required" class="required">*</span>
    </label>
    <input
      :value="modelValue"
      @input="format ? format($event, v => emit('update:modelValue', v)) : emit('update:modelValue', $event.target.value)"
      type="text"
      :placeholder="placeholder"
      :maxlength="maxlength"
      :disabled="disabled"
    />
  </div>
</template>

<style scoped>
.field-group {
  display: flex;
  flex-direction: column;
  margin-bottom: 16px;
}

.field-group label {
  color: #f48a1d;
  font-weight: 600;
  font-size: 0.85rem;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.required { color: #e74c3c; }

.field-group input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  font-size: 1rem;
  transition: all 0.3s ease;
  background: #fafafa;
}

.field-group input:focus {
  outline: none;
  border-color: #f48a1d;
  background: #ffffff;
  box-shadow: 0 0 0 3px rgba(244, 138, 29, 0.1);
}

.field-group input:disabled {
  background: #f5f5f5;
  cursor: not-allowed;
}
</style>
