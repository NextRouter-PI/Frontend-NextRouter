<script setup>
import { useId } from 'vue'

defineProps({
  days: { type: Array, required: true },
  months: { type: Array, required: true },
  years: { type: Array, required: true },
  required: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  dayError: { type: String, default: '' },
  monthError: { type: String, default: '' },
  yearError: { type: String, default: '' },
})

const day = defineModel('day', { type: [String, Number], required: true })
const month = defineModel('month', { type: [String, Number], required: true })
const year = defineModel('year', { type: [String, Number], required: true })
const dateInputId = useId()
</script>

<template>
  <div class="field-group" role="group" :aria-labelledby="`${dateInputId}-label`">
    <label :id="`${dateInputId}-label`">Data de nascimento<span v-if="required"> *</span></label>
    <div class="date-row">
      <div class="date-field">
        <input
          v-model="day"
          :list="`${dateInputId}-days`"
          placeholder="Dia"
          aria-label="Dia de nascimento"
          inputmode="numeric"
          :required="required"
          :disabled="disabled"
          :class="{ 'has-error': dayError }"
          :aria-invalid="dayError ? true : undefined"
          :aria-describedby="dayError ? `${dateInputId}-day-error` : undefined"
        />
        <p v-if="dayError" :id="`${dateInputId}-day-error`" class="field-error">{{ dayError }}</p>
      </div>
      <div class="date-field">
        <input
          v-model="month"
          :list="`${dateInputId}-months`"
          placeholder="Mês"
          aria-label="Mês de nascimento"
          :required="required"
          :disabled="disabled"
          :class="{ 'has-error': monthError }"
          :aria-invalid="monthError ? true : undefined"
          :aria-describedby="monthError ? `${dateInputId}-month-error` : undefined"
        />
        <p v-if="monthError" :id="`${dateInputId}-month-error`" class="field-error">
          {{ monthError }}
        </p>
      </div>
      <div class="date-field">
        <input
          v-model="year"
          :list="`${dateInputId}-years`"
          placeholder="Ano"
          aria-label="Ano de nascimento"
          inputmode="numeric"
          :required="required"
          :disabled="disabled"
          :class="{ 'has-error': yearError }"
          :aria-invalid="yearError ? true : undefined"
          :aria-describedby="yearError ? `${dateInputId}-year-error` : undefined"
        />
        <p v-if="yearError" :id="`${dateInputId}-year-error`" class="field-error">{{ yearError }}</p>
      </div>
    </div>

    <datalist :id="`${dateInputId}-days`">
      <option
        v-for="dayOption in days"
        :key="dayOption"
        :value="String(dayOption).padStart(2, '0')"
      />
    </datalist>
    <datalist :id="`${dateInputId}-months`">
      <option v-for="monthOption in months" :key="monthOption.value" :value="monthOption.label" />
    </datalist>
    <datalist :id="`${dateInputId}-years`">
      <option v-for="yearOption in years" :key="yearOption" :value="yearOption" />
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

.date-field {
  min-width: 0;
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

.date-row input.has-error {
  border-color: var(--danger);
}

.field-error {
  color: var(--danger);
  font-size: 12px;
  margin-top: 4px;
}
</style>
