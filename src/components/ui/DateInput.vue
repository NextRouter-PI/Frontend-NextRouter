<!-- TODO: Refatorar campo, faltando: required dinâmico e formatção no input -->

<script setup>
import { computed } from 'vue'

const props = defineProps({
  days: { type: Array, required: true },
  months: { type: Array, required: true },
  years: { type: Array, required: true },
  modelValue: { type: Object, required: true },
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue'])

const formModel = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})
</script>

<template>
  <div class="field-group">
    <label>Data de nascimento *</label>
    <div class="date-row">
      <input v-model="formModel.day" list="days-date" placeholder="Dia" :disabled="disabled" />
      <input v-model="formModel.month" list="months-date" placeholder="Mês" :disabled="disabled" />
      <input v-model="formModel.year" list="years-date" placeholder="Ano" :disabled="disabled" />
    </div>

    <datalist id="days-date">
      <option v-for="day in days" :key="day" :value="String(day).padStart(2, '0')" />
    </datalist>
    <datalist id="months-date">
      <option v-for="month in months" :key="month.value" :value="month.label" />
    </datalist>
    <datalist id="years-date">
      <option v-for="year in years" :key="year" :value="year" />
    </datalist>
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

.date-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.date-row input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid var(--border-primary);
  border-radius: 12px;
  font-size: 1rem;
  transition: all 0.3s ease;
  background: var(--bg);
  color: var(--text);
}

.date-row input:focus {
  outline: none;
  border-color: var(--primary);
  background: var(--bg);
  box-shadow: 0 0 0 3px rgba(223, 128, 26, 0.1);
}
</style>
