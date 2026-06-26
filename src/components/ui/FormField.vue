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
  color: #f48a1d;
  font-weight: 600;
  font-size: 0.85rem;
  text-transform: uppercase;
  margin-bottom: 6px;
}

.required {
  color: #e74c3c;
}

.field-group input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  background: #fafafa;
  font-size: 14px;
  color: #333;
  transition: all 0.3s ease;
}

.field-group input:focus {
  outline: none;
  border-color: #f48a1d;
  box-shadow: 0 0 0 3px rgba(244, 138, 29, 0.1);
}

.field-group input:disabled {
  background: #f5f5f5;
  color: #666;
  cursor: not-allowed;
}

.field-group.has-error input {
  border-color: #e74c3c;
}

.field-error {
  color: #e74c3c;
  font-size: 12px;
  margin-top: 4px;
}
</style>
