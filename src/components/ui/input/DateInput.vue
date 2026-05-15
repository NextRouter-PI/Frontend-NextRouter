<script setup>
defineProps({
  dias: { type: Array, required: true },
  meses: { type: Array, required: true },
  anos: { type: Array, required: true },
  form: { type: Object, required: true },
  disabled: { type: Boolean, default: false }
})
</script>

<template>
  <div class="field-group">
    <label>Data de nascimento *</label>
    <div class="date-row">
      <input v-model="form.dia" list="dias-date" placeholder="Dia" :disabled="disabled" />
      <input v-model="form.mes" list="meses-date" placeholder="Mês" :disabled="disabled" />
      <input v-model="form.ano" list="anos-date" placeholder="Ano" :disabled="disabled" />
    </div>

    <datalist id="dias-date">
      <option v-for="dia in dias" :key="dia" :value="String(dia).padStart(2, '0')" />
    </datalist>
    <datalist id="meses-date">
      <option v-for="mes in meses" :key="mes.value" :value="mes.label" />
    </datalist>
    <datalist id="anos-date">
      <option v-for="ano in anos" :key="ano" :value="ano" />
    </datalist>
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
  letter-spacing: 0.5px;
}

.date-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.date-row input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  font-size: 1rem;
  transition: all 0.3s ease;
  background: #fafafa;
}

.date-row input:focus {
  outline: none;
  border-color: #f48a1d;
  background: #ffffff;
  box-shadow: 0 0 0 3px rgba(244, 138, 29, 0.1);
}
</style>
