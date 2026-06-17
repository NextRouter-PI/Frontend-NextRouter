<script setup>
defineProps({
  modelValue: String,
  label: String,
  options: { type: Array, default: () => [] },
  required: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  placeholder: { type: String, default: 'Selecione' }
})

const emit = defineEmits(['update:modelValue'])
</script>

<template>
  <div class="field-group">
    <label v-if="label">
      {{ label }} <span v-if="required" class="required">*</span>
    </label>
    <select
      :value="modelValue"
      @change="emit('update:modelValue', $event.target.value)"
      :disabled="disabled"
    >
      <option value="">{{ placeholder }}</option>
      <option
        v-for="opt in options"
        :key="opt.value"
        :value="opt.value"
      >
        {{ opt.label }}
      </option>
    </select>
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

.field-group select {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  font-size: 1rem;
  transition: all 0.3s ease;
  background: #fafafa;
}

.field-group select:focus {
  outline: none;
  border-color: #f48a1d;
  background: #ffffff;
  box-shadow: 0 0 0 3px rgba(244, 138, 29, 0.1);
}
</style>
