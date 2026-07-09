<script setup>
defineProps({
  modelValue: String,
  label: String,
  type: { type: String, default: 'text' },
  autocomplete: String
})
defineEmits(['update:modelValue'])
</script>

<template>
  <div class="input-group">
    <input
      :value="modelValue"
      @input="$emit('update:modelValue', $event.target.value)"
      :type="type"
      :autocomplete="autocomplete"
      required
    />
    <label>{{ label }}</label>
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
  color: var(--text-muted);
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
</style>
