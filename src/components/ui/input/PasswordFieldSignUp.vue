<script setup>
defineProps({
  modelValue: String,
  label: String,
  required: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  placeholder: String,
  showPassword: { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue', 'update:showPassword'])
</script>

<template>
  <div class="field-group">
    <label v-if="label">
      {{ label }} <span v-if="required" class="required">*</span>
    </label>
    <div class="password-input">
      <input
        :value="modelValue"
        @input="emit('update:modelValue', $event.target.value)"
        :type="showPassword ? 'text' : 'password'"
        :placeholder="placeholder"
        :disabled="disabled"
      />
      <span
        class="mdi toggle-password"
        :class="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
        @click="emit('update:showPassword', !showPassword)"
      ></span>
    </div>
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

.password-input { position: relative; }

.password-input input {
  width: 100%;
  padding: 12px 45px 12px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  font-size: 1rem;
  transition: all 0.3s ease;
  background: #fafafa;
}

.password-input input:focus {
  outline: none;
  border-color: #f48a1d;
  background: #ffffff;
  box-shadow: 0 0 0 3px rgba(244, 138, 29, 0.1);
}

.password-input input:disabled {
  background: #f5f5f5;
  cursor: not-allowed;
}

.toggle-password {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
  color: #999;
  font-size: 20px;
}

.toggle-password:hover { color: #f48a1d; }
</style>
