<script setup>
import CompanyFilterDropdown from '@/features/directory/components/CompanyFilterDropdown.vue'

defineProps({
  servedCities: { type: Array, default: () => [] },
  citiesLoading: { type: Boolean, default: false },
  citiesError: { type: String, default: '' },
  activeFilterCount: { type: Number, default: 0 },
  disabled: { type: Boolean, default: false },
})

const destination = defineModel('destination', { type: String, default: '' })
const stateFilter = defineModel('state', { type: String, default: '' })
const city = defineModel('city', { type: String, default: '' })
const ordering = defineModel('ordering', { type: String, default: '' })

const emit = defineEmits(['search', 'clear', 'remove-state', 'remove-city'])
</script>

<template>
  <div>
    <form class="search-row" @submit.prevent="emit('search')">
      <div class="search-input-wrap">
        <button
          type="submit"
          class="search-icon-btn"
          aria-label="Pesquisar grupo de rota"
          :disabled="disabled"
        >
          <BaseIcon name="mdi-magnify" />
        </button>
        <input
          v-model="destination"
          type="search"
          class="search-input"
          placeholder="Buscar grupo de rota..."
          aria-label="Nome do grupo de rota"
          autocomplete="off"
        />
      </div>

      <CompanyFilterDropdown
        v-model:state="stateFilter"
        v-model:city="city"
        v-model:ordering="ordering"
        :served-cities="servedCities"
        :cities-loading="citiesLoading"
        :cities-error="citiesError"
        :active-filter-count="activeFilterCount"
        :disabled="disabled"
        @apply="emit('search')"
        @clear="emit('clear')"
      />
    </form>

    <div v-if="stateFilter || city" class="active-chips" aria-label="Filtros aplicados">
      <button v-if="stateFilter" type="button" class="filter-chip" @click="emit('remove-state')">
        UF: {{ stateFilter }}
        <BaseIcon name="mdi-close" />
      </button>
      <button v-if="city" type="button" class="filter-chip" @click="emit('remove-city')">
        Cidade: {{ city }}
        <BaseIcon name="mdi-close" />
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.search-row {
  display: flex;
  align-items: stretch;
  gap: 8px;
  margin-bottom: 12px;
}

.search-input-wrap {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  min-height: 46px;
  padding: 0 10px 0 4px;
  border: 1.5px solid var(--border-primary);
  border-radius: 10px;
  background: var(--color-surface);
  transition: box-shadow 0.2s ease;

  &:focus-within {
    border-color: var(--primary);
  }
}

.search-icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border: none;
  background: transparent;
  color: var(--text-muted);
  font-size: 1.35rem;
  cursor: pointer;
  flex-shrink: 0;

  &:hover:not(:disabled) {
    color: var(--primary);
  }
}

.search-input {
  flex: 1;
  min-width: 0;
  border: none;
  background: transparent;
  color: var(--text);
  font-size: 0.95rem;
  padding: 8px 4px;

  &:focus {
    outline: none;
  }

  &::placeholder {
    color: var(--text-muted);
  }
}

.active-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.filter-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  border: 1px solid var(--border-primary);
  border-radius: 999px;
  background: var(--color-surface);
  color: var(--text);
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
}
</style>
