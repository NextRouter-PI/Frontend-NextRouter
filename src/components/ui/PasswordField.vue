<script setup>
import { ref } from 'vue'

defineProps({
  modelValue: String,
  label: String,
  autocomplete: String
})
defineEmits(['update:modelValue'])

const mostrar = ref(false)
</script>

<template>
  <div class="input-group">
    <input
      :value="modelValue"
      @input="$emit('update:modelValue', $event.target.value)"
      :type="mostrar ? 'text' : 'password'"
      :autocomplete="autocomplete"
      required
    />
    <label>{{ label }}</label>
    <span
      class="mdi toggle"
      :class="mostrar ? 'mdi-eye-off' : 'mdi-eye'"
      @click="mostrar = !mostrar"
    ></span>
  </div>
</template>

<style scoped>
.input-group {
  position: relative;
  margin-bottom: 18px;
  width: 100%;
}

.input-group input {
  width: 100%;
  padding: 12px 10px;
  border: none;
  border-bottom: 2px solid var(--primary);
  outline: none;
  background: transparent;
  color: var(--primary);
  font-size: 14px;
}

.input-group label {
  position: absolute;
  left: 10px;
  top: 12px;
  color: #999;
  font-size: 14px;
  pointer-events: none;
  transition: 0.3s;
}

.input-group input:focus + label,
.input-group input:valid + label {
  top: -8px;
  font-size: 12px;
  color: var(--primary);
}

.toggle {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
  color: #999;
}

.toggle:hover {
  color: var(--primary);
}
</style>
