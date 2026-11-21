<script setup>
import { computed, onBeforeUnmount, onMounted, shallowRef, useId, useTemplateRef } from 'vue'
import { BRAZIL_STATES } from '@/constants/brazilStates'

const stateModel = defineModel('state', { type: String, default: '' })
const cityModel = defineModel('city', { type: String, default: '' })
const orderingModel = defineModel('ordering', { type: String, default: 'trade_name' })

const props = defineProps({
  servedCities: { type: Array, default: () => [] },
  citiesLoading: { type: Boolean, default: false },
  citiesError: { type: String, default: '' },
  activeFilterCount: { type: Number, default: 0 },
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits(['apply', 'clear'])

const open = shallowRef(false)
const rootRef = useTemplateRef('root')
const stateId = useId()
const cityId = useId()
const orderingId = useId()
const panelId = useId()

const triggerLabel = computed(() => (orderingModel.value === '-trade_name' ? 'Z a A' : 'A a Z'))

const cityPlaceholder = computed(() => {
  if (props.citiesLoading) return 'Carregando cidades...'
  if (!props.servedCities.length) {
    return stateModel.value ? 'Nenhuma cidade atendida nesta UF' : 'Nenhuma cidade atendida'
  }
  return 'Todas as cidades atendidas'
})

const cityOptions = computed(() =>
  props.servedCities.map((item) => ({
    key: `${item.state}-${item.city}`,
    value: item.city,
    label: stateModel.value || !item.state ? item.city : `${item.city} — ${item.state}`,
  }))
)

function toggle() {
  open.value = !open.value
}

function close() {
  open.value = false
}

function handleApply() {
  close()
  emit('apply')
}

function handleClear() {
  emit('clear')
}

function onDocumentClick(event) {
  if (!open.value) return
  if (rootRef.value && !rootRef.value.contains(event.target)) {
    close()
  }
}

function onKeydown(event) {
  if (event.key === 'Escape' && open.value) {
    close()
  }
}

onMounted(() => {
  document.addEventListener('click', onDocumentClick)
  document.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocumentClick)
  document.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <div ref="root" class="filter-dropdown">
    <button
      type="button"
      class="filter-trigger"
      :aria-expanded="open"
      :aria-controls="panelId"
      :disabled="disabled"
      @click="toggle"
    >
      <span class="trigger-text">{{ triggerLabel }}</span>
      <span v-if="activeFilterCount > 0" class="filter-badge" :aria-label="`${activeFilterCount} filtros ativos`">
        {{ activeFilterCount }}
      </span>
      <BaseIcon :class="{ rotated: open }" name="mdi-chevron-down" class="trigger-icon" />
    </button>

    <div v-show="open" :id="panelId" class="filter-panel" role="region" aria-label="Filtros da busca">
      <div class="filter-group">
        <label :for="stateId" class="filter-label">Estado (UF)</label>
        <select :id="stateId" v-model="stateModel" class="filter-select" :disabled="disabled">
          <option value="">Todos os estados</option>
          <option v-for="uf in BRAZIL_STATES" :key="uf.value" :value="uf.value">
            {{ uf.label }}
          </option>
        </select>
      </div>

      <div class="filter-group">
        <label :for="cityId" class="filter-label">Cidade atendida</label>
        <select
          :id="cityId"
          v-model="cityModel"
          class="filter-select"
          :disabled="disabled || citiesLoading || !servedCities.length"
        >
          <option value="">{{ cityPlaceholder }}</option>
          <option v-for="opt in cityOptions" :key="opt.key" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
        <p v-if="citiesError" class="filter-error" role="alert">{{ citiesError }}</p>
      </div>

      <div class="filter-group">
        <label :for="orderingId" class="filter-label">Ordenação</label>
        <select :id="orderingId" v-model="orderingModel" class="filter-select" :disabled="disabled">
          <option value="trade_name">A a Z</option>
          <option value="-trade_name">Z a A</option>
        </select>
      </div>

      <div class="filter-actions">
        <button type="button" class="btn-clear" :disabled="disabled" @click="handleClear">
          Limpar
        </button>
        <button type="button" class="btn-apply" :disabled="disabled" @click="handleApply">
          Aplicar
        </button>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.filter-dropdown {
  position: relative;
  flex-shrink: 0;
}

.filter-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 46px;
  padding: 0 12px;
  border: none;
  border-radius: 10px;
  background: var(--primary);
  color: #1c1917;
  font-size: 0.92rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: background-color 0.2s ease;
}

.filter-trigger:hover:not(:disabled) {
  background: var(--primary-hover);
  color: var(--color-on-primary);
}

.filter-trigger:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.filter-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 999px;
  background: #1c1917;
  color: var(--color-on-primary);
  font-size: 0.72rem;
  font-weight: 700;
}

.trigger-icon {
  font-size: 1.2rem;
  transition: transform 0.2s ease;
}

.trigger-icon.rotated {
  transform: rotate(180deg);
}

.filter-panel {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  z-index: 30;
  width: min(310px, calc(100vw - 32px));
  padding: 16px;
  border: 1px solid var(--border-primary);
  border-radius: 12px;
  background: var(--color-surface);
  box-shadow: var(--shadow);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.filter-label {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--primary);
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.filter-select {
  width: 100%;
  min-height: 42px;
  padding: 8px 12px;
  border: 1.5px solid var(--border-primary);
  border-radius: 8px;
  background: var(--bg);
  color: var(--text);
  font-size: 0.95rem;
}

.filter-select:focus {
  outline: none;
  border-color: var(--primary);
}

.filter-select:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.filter-error {
  margin: 0;
  font-size: 0.8rem;
  color: var(--danger);
}

.filter-actions {
  display: flex;
  gap: 10px;
  margin-top: 4px;
}

.btn-clear,
.btn-apply {
  flex: 1;
  min-height: 40px;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
}

.btn-clear {
  border: 1.5px solid var(--border);
  background: transparent;
  color: var(--text);
}

.btn-apply {
  border: none;
  background: var(--primary);
  color: #1c1917;
}

.btn-apply:hover:not(:disabled) {
  background: var(--primary-hover);
  color: var(--color-on-primary);
}
</style>
