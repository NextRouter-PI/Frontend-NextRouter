<script setup>
import { computed, ref } from 'vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'

defineProps({
  grupos: { type: Array, required: true },
  busy: { type: Boolean, default: false },
})

const emit = defineEmits(['generate-horizon', 'cancel-date'])

const gerarForm = ref({ groupId: '', start_date: '', horizon_days: '', batch_size: '' })
const datasExcluidas = ref([])
const cancelarDataForm = ref({ groupId: '', date: '', reason: '' })

const tomorrowIso = computed(() => {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
})

const datasPrevistasLote = computed(() => {
  const { start_date, horizon_days, batch_size } = gerarForm.value
  const total = Math.min(Number(horizon_days) || 0, Number(batch_size) || 0, 31)
  if (!start_date || total < 1) return []
  const base = new Date(`${start_date}T12:00:00`)
  if (Number.isNaN(base.getTime())) return []
  const dias = []
  for (let i = 0; i < total; i++) {
    const d = new Date(base)
    d.setDate(base.getDate() + i)
    const iso = d.toISOString().slice(0, 10)
    const label = d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })
    dias.push({ iso, label })
  }
  return dias
})

function toggleExcluirData(iso) {
  datasExcluidas.value = datasExcluidas.value.includes(iso)
    ? datasExcluidas.value.filter((d) => d !== iso)
    : [...datasExcluidas.value, iso]
}

function submitGenerate() {
  const validExcluded = datasExcluidas.value.filter((iso) =>
    datasPrevistasLote.value.some((d) => d.iso === iso),
  )
  emit('generate-horizon', {
    ...gerarForm.value,
    tomorrowIso: tomorrowIso.value,
    excludedDates: validExcluded,
    onSuccess: () => {
      datasExcluidas.value = []
    },
  })
}

function submitCancelDate() {
  emit('cancel-date', {
    ...cancelarDataForm.value,
    onSuccess: () => {
      cancelarDataForm.value = { groupId: '', date: '', reason: '' }
    },
  })
}
</script>

<template>
  <BaseCard
    title="Aplicar Atendimentos em Lote ou Cancelar Data"
    subtitle="Aplique atendimentos para dias futuros (até 31 dias por lote). Clique nas datas previstas abaixo para excluir feriados ou folgas antes de aplicar, ou cancele uma data específica."
  >
    <form class="op-grid" @submit.prevent="submitGenerate">
      <select v-model="gerarForm.groupId" required :disabled="busy">
        <option value="">Grupo para aplicar atendimentos...</option>
        <option v-for="g in grupos" :key="g.id" :value="g.id">{{ g.name }}</option>
      </select>
      <input
        v-model="gerarForm.start_date"
        type="date"
        :min="tomorrowIso"
        required
        :disabled="busy"
        aria-label="Data inicial (a partir de amanhã)"
      />
      <input
        v-model="gerarForm.horizon_days"
        type="number"
        min="1"
        max="31"
        placeholder="Dias posteriores (1-31)"
        required
        :disabled="busy"
      />
      <input
        v-model="gerarForm.batch_size"
        type="number"
        min="1"
        max="31"
        placeholder="Lote (1-31)"
        required
        :disabled="busy"
      />
      <BaseButton type="submit" size="sm" :disabled="busy">Aplicar atendimentos</BaseButton>
    </form>

    <div v-if="datasPrevistasLote.length" class="exclude-dates-box">
      <p class="exclude-hint">
        Clique em uma data para <strong>excluir</strong> da aplicação (ex.: feriados):
        <span v-if="datasExcluidas.length">({{ datasExcluidas.length }} excluída(s))</span>
      </p>
      <div class="exclude-chips">
        <button
          v-for="item in datasPrevistasLote"
          :key="item.iso"
          type="button"
          :class="['exclude-chip', { excluded: datasExcluidas.includes(item.iso) }]"
          :disabled="busy"
          @click="toggleExcluirData(item.iso)"
        >
          {{ item.label }}
        </button>
      </div>
    </div>

    <form class="op-grid" @submit.prevent="submitCancelDate">
      <select v-model="cancelarDataForm.groupId" required :disabled="busy">
        <option value="">Grupo para cancelar data...</option>
        <option v-for="g in grupos" :key="g.id" :value="g.id">{{ g.name }}</option>
      </select>
      <input v-model="cancelarDataForm.date" type="date" required :disabled="busy" aria-label="Data a cancelar" />
      <input
        v-model="cancelarDataForm.reason"
        placeholder="Motivo do cancelamento (até 500 caracteres)"
        maxlength="500"
        required
        :disabled="busy"
      />
      <BaseButton type="submit" variant="outline" size="sm" :disabled="busy">Cancelar data</BaseButton>
    </form>
  </BaseCard>
</template>

<style lang="scss" scoped>
.op-grid {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;
  align-items: center;

  input,
  select {
    flex: 1 1 160px;
    padding: 9px $space-3;
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

.exclude-dates-box {
  display: flex;
  flex-direction: column;
  gap: $space-2;
  padding: $space-3;
  border-radius: $radius-md;
  background: var(--altbg);
}

.exclude-hint {
  font-size: $text-xs;
  color: var(--text-muted);
}

.exclude-chips {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;
}

.exclude-chip {
  padding: $space-1 $space-3;
  border-radius: $radius-pill;
  background: var(--color-surface);
  color: var(--text);
  outline: 1.5px solid var(--border);
  outline-offset: -1.5px;
  font-size: $text-xs;
  font-weight: $font-semibold;

  &.excluded {
    background: var(--danger-soft);
    color: var(--danger);
    outline-color: var(--danger);
    text-decoration: line-through;
  }
}
</style>
