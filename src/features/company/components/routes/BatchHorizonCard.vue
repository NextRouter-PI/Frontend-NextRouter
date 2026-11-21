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
    <div class="batch-sections">
      <form class="op-section" @submit.prevent="submitGenerate">
        <p class="op-section-title">Aplicar em lote</p>
        <div class="op-fields-grid">
          <label class="op-field">
            <span class="op-label">Grupo</span>
            <select v-model="gerarForm.groupId" required :disabled="busy">
              <option value="">Selecione o grupo...</option>
              <option v-for="g in grupos" :key="g.id" :value="g.id">{{ g.name }}</option>
            </select>
          </label>
          <label class="op-field">
            <span class="op-label">Data inicial</span>
            <input
              v-model="gerarForm.start_date"
              type="date"
              :min="tomorrowIso"
              required
              :disabled="busy"
              aria-label="Data inicial (a partir de amanhã)"
            />
          </label>
          <label class="op-field">
            <span class="op-label">Dias posteriores (1–31)</span>
            <input
              v-model="gerarForm.horizon_days"
              type="number"
              min="1"
              max="31"
              placeholder="Ex.: 7"
              required
              :disabled="busy"
            />
          </label>
          <label class="op-field">
            <span class="op-label">Tamanho do lote (1–31)</span>
            <input
              v-model="gerarForm.batch_size"
              type="number"
              min="1"
              max="31"
              placeholder="Ex.: 7"
              required
              :disabled="busy"
            />
          </label>
        </div>

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

        <div class="op-actions">
          <BaseButton type="submit" size="sm" :disabled="busy">Aplicar atendimentos</BaseButton>
        </div>
      </form>

      <form class="op-section op-section-divider" @submit.prevent="submitCancelDate">
        <p class="op-section-title">Cancelar data específica</p>
        <div class="op-cancel-grid">
          <label class="op-field">
            <span class="op-label">Grupo</span>
            <select v-model="cancelarDataForm.groupId" required :disabled="busy">
              <option value="">Selecione o grupo...</option>
              <option v-for="g in grupos" :key="g.id" :value="g.id">{{ g.name }}</option>
            </select>
          </label>
          <label class="op-field">
            <span class="op-label">Data a cancelar</span>
            <input
              v-model="cancelarDataForm.date"
              type="date"
              required
              :disabled="busy"
              aria-label="Data a cancelar"
            />
          </label>
          <label class="op-field op-field-wide">
            <span class="op-label">Motivo do cancelamento</span>
            <input
              v-model="cancelarDataForm.reason"
              placeholder="Informe o motivo (até 500 caracteres)"
              maxlength="500"
              required
              :disabled="busy"
            />
          </label>
        </div>
        <div class="op-actions">
          <BaseButton type="submit" variant="outline" size="sm" :disabled="busy">
            Cancelar data
          </BaseButton>
        </div>
      </form>
    </div>
  </BaseCard>
</template>

<style lang="scss" scoped>
.batch-sections {
  display: flex;
  flex-direction: column;
  gap: $space-5;
}

.op-section {
  display: flex;
  flex-direction: column;
  gap: $space-3;

  &-divider {
    padding-top: $space-4;
    border-top: 1px solid var(--border);
  }

  &-title {
    font-size: $text-sm;
    font-weight: $font-bold;
    color: var(--text);
  }
}

.op-fields-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: $space-3;
}

.op-cancel-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: $space-3;

  @include from($bp-sm) {
    grid-template-columns: minmax(180px, 1.1fr) minmax(150px, 0.9fr) minmax(220px, 1.8fr);
  }
}

.op-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;

  input,
  select {
    width: 100%;
    padding: 10px $space-3;
    border-radius: $radius-md;
    background: var(--color-surface);
    outline: 1.5px solid var(--border);
    outline-offset: -1.5px;
    color: var(--text);
    font-size: $text-sm;
    transition: outline-color $duration-normal $ease-fluid;

    &:focus,
    &:focus-visible {
      outline: 2px solid var(--primary);
      outline-offset: -2px;
    }
  }
}

.op-label {
  font-size: $text-xs;
  font-weight: $font-semibold;
  color: var(--primary);
}

.op-actions {
  display: flex;
  justify-content: flex-end;
  padding-top: $space-1;
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
