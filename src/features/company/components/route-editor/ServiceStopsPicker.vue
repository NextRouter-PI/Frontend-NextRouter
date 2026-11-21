<script setup>
import { shallowRef } from 'vue'
import BaseButton from '@/components/ui/BaseButton.vue'

const props = defineProps({
  points: { type: Array, default: () => [] },
  disabled: { type: Boolean, default: false },
})

const stopIds = defineModel({ type: Array, default: () => [] })
const paradaParaAdicionar = shallowRef('')

function nomePonto(pid) {
  const p = props.points.find((item) => item.id === pid)
  return p ? `${p.name} (${p.city}/${p.state})` : `Ponto #${pid}`
}

function adicionarParada() {
  const pid = Number(paradaParaAdicionar.value)
  if (pid && !stopIds.value.includes(pid)) {
    stopIds.value = [...stopIds.value, pid]
  }
  paradaParaAdicionar.value = ''
}

function removerParada(pid) {
  stopIds.value = stopIds.value.filter((item) => item !== pid)
}
</script>

<template>
  <div class="field">
    <label>Paradas habituais na ordem configurada</label>
    <div class="inline-row">
      <select v-model="paradaParaAdicionar" :disabled="disabled">
        <option value="">Adicionar ponto operacional...</option>
        <option v-for="p in points" :key="p.id" :value="p.id">
          {{ p.name }} — {{ p.city }}/{{ p.state }}
        </option>
      </select>
      <BaseButton variant="outline" size="sm" :disabled="disabled" @click="adicionarParada">
        Adicionar parada
      </BaseButton>
    </div>
    <div v-if="stopIds.length" class="chip-row">
      <span v-for="(pid, idx) in stopIds" :key="pid" class="chip active">
        {{ idx + 1 }}. {{ nomePonto(pid) }}
        <button type="button" class="chip-x" :disabled="disabled" @click="removerParada(pid)">×</button>
      </span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.field {
  display: flex;
  flex-direction: column;
  gap: $space-1;

  label {
    font-size: $text-sm;
    font-weight: $font-semibold;
    color: var(--primary);
  }

  select {
    padding: 10px $space-3;
    border-radius: $radius-sm;
    background: var(--color-surface);
    outline: 1.5px solid var(--border);
    outline-offset: -1.5px;
    color: var(--text);
    font-size: $text-sm;

    &:focus {
      outline: 2px solid var(--primary);
      outline-offset: -2px;
    }
  }
}

.chip-row,
.inline-row {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;
  align-items: center;

  select {
    flex: 1 1 220px;
  }
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: $space-1;
  padding: $space-1 $space-3;
  border-radius: $radius-pill;
  background: var(--color-surface);
  color: var(--text);
  outline: 1.5px solid var(--border);
  outline-offset: -1.5px;
  font-size: $text-xs;
  font-weight: $font-semibold;

  &.active {
    background: var(--primary);
    color: var(--color-on-primary);
    outline-color: var(--primary);
  }
}

.chip-x {
  color: inherit;
  font-weight: $font-bold;
  padding: 0 2px;
}
</style>
