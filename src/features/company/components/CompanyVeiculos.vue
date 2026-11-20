<script setup>
import { computed, onMounted, shallowRef } from 'vue'
import { useRouter } from 'vue-router'
import { ROUTE_PATHS } from '@/constants'
import { useTransporteStore } from '@/stores/useTransporteStore'
import { useAccountScope } from '@/composables/useAccountScope'
import PageHeader from '@/components/ui/PageHeader.vue'
import StatusBanner from '@/components/ui/StatusBanner.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import SkeletonCard from '@/components/ui/SkeletonCard.vue'
import CompanyVehicleCard from '@/features/company/components/vehicles/CompanyVehicleCard.vue'
import CompanyGaragesTab from '@/features/company/components/vehicles/CompanyGaragesTab.vue'

const store = useTransporteStore()
const scope = useAccountScope()
const router = useRouter()

const abaAtiva = shallowRef('frota')
const busca = shallowRef('')
const filtroAtivo = shallowRef('Todas')
const menuAberto = shallowRef(null)

onMounted(async () => {
  await store.fetchVeiculos({ signal: scope.signal })
})

const veiculosFiltrados = computed(() => {
  const lista = store.veiculos || []
  const termo = busca.value.toLowerCase()
  const statusParaFiltro = filtroAtivo.value === 'Ativas' ? 'Ativo' : filtroAtivo.value
  return lista.filter((v) => {
    const matchBusca = v.placa.toLowerCase().includes(termo) || v.modelo.toLowerCase().includes(termo)
    const matchStatus = filtroAtivo.value === 'Todas' || v.status === statusParaFiltro
    return matchBusca && matchStatus
  })
})

function toggleMenu(id) {
  menuAberto.value = menuAberto.value === id ? null : id
}

async function alterarStatus(id) {
  await store.alterarStatus(id, { signal: scope.signal })
  menuAberto.value = null
}
</script>

<template>
  <div class="company-vehicles-page">
    <PageHeader title="Frota e Garagens" accent />

    <div class="filter-chips" role="tablist" aria-label="Configuração de frota e garagens">
      <button
        type="button"
        role="tab"
        :aria-selected="abaAtiva === 'frota'"
        :class="['chip', { active: abaAtiva === 'frota' }]"
        @click="abaAtiva = 'frota'"
      >
        Frota ({{ store.veiculos.length }})
      </button>
      <button
        type="button"
        role="tab"
        :aria-selected="abaAtiva === 'garagens'"
        :class="['chip', { active: abaAtiva === 'garagens' }]"
        @click="abaAtiva = 'garagens'"
      >
        Garagens ({{ store.garagens.length }})
      </button>
    </div>

    <template v-if="abaAtiva === 'frota'">
      <div class="search-container">
        <span class="mdi mdi-magnify search-icon" aria-hidden="true"></span>
        <input v-model="busca" type="text" placeholder="Busque por placa, modelo..." aria-label="Buscar veículo" />
      </div>

      <div class="filter-chips">
        <button
          v-for="f in ['Todas', 'Ativas', 'Manutenção']"
          :key="f"
          type="button"
          :class="['chip', { active: filtroAtivo === f }]"
          @click="filtroAtivo = f"
        >
          {{ f }}
        </button>
      </div>

      <SkeletonCard v-if="store.loading" :count="3" />
      <StatusBanner v-else-if="store.error" variant="danger" :message="store.error" />
      <EmptyState v-else-if="!veiculosFiltrados.length" icon="mdi-bus-alert" description="Nenhum veículo encontrado." />

      <TransitionGroup v-else name="list-stagger" tag="div" class="list-container">
        <CompanyVehicleCard
          v-for="veiculo in veiculosFiltrados"
          :key="veiculo.id"
          :veiculo="veiculo"
          :menu-open="menuAberto === veiculo.id"
          @toggle-menu="toggleMenu"
          @edit="(id) => router.push(`/veiculos/editar/${id}`)"
          @toggle-status="alterarStatus"
        />
      </TransitionGroup>

      <button
        type="button"
        class="fab-add"
        aria-label="Cadastrar veículo"
        @click="router.push(ROUTE_PATHS.REGISTER_VEHICLE)"
      >
        <span class="mdi mdi-plus" aria-hidden="true"></span>
      </button>
    </template>

    <CompanyGaragesTab v-else />
  </div>
</template>

<style lang="scss" scoped>
.company-vehicles-page {
  margin: 0 auto;
  max-width: 680px;
  padding: $space-5 18px 120px;
  display: flex;
  flex-direction: column;
  gap: $space-4;
}

.search-container {
  position: relative;
  display: flex;
  align-items: center;

  .search-icon {
    position: absolute;
    left: 14px;
    font-size: 1.2rem;
    color: var(--text-muted);
    pointer-events: none;
  }

  input {
    width: 100%;
    padding: $space-3 $space-4 $space-3 42px;
    border-radius: $radius-md;
    background: var(--color-surface);
    outline: 1.5px solid var(--border);
    outline-offset: -1.5px;
    color: var(--text);
    font-size: $text-md;

    &:focus {
      outline: 2px solid var(--primary);
      outline-offset: -2px;
    }
  }
}

.filter-chips {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;
}

.chip {
  padding: $space-2 $space-4;
  border-radius: $radius-pill;
  background: var(--color-surface);
  color: var(--text);
  outline: 1.5px solid var(--border);
  outline-offset: -1.5px;
  font-size: $text-sm;
  font-weight: $font-semibold;

  &.active {
    background: var(--primary);
    color: var(--color-on-primary);
    outline-color: var(--primary);
  }
}

.list-container {
  display: flex;
  flex-direction: column;
  gap: $space-4;
}

.fab-add {
  position: fixed;
  right: $space-6;
  bottom: calc(var(--bottom-nav-height) + #{$space-5});
  width: 56px;
  height: 56px;
  border-radius: $radius-round;
  @include flex-center;
  background: var(--primary);
  color: var(--color-on-primary);
  font-size: 1.7rem;
  box-shadow: var(--shadow-primary);
  z-index: $z-sticky;

  &:hover {
    background: var(--primary-hover);
  }

  @include from($bp-desktop + 1px) {
    bottom: $space-6;
  }
}
</style>
