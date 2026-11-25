<script setup>
import { computed, defineAsyncComponent, onMounted, shallowRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ROUTE_PATHS } from '@/constants'
import { useTransporteStore } from '@/stores/useTransporteStore'
import { useAccountScope } from '@/composables/useAccountScope'
import { useDebounce } from '@/composables/useDebounce'
import PageHeader from '@/components/ui/PageHeader.vue'
import StatTile from '@/components/ui/StatTile.vue'
import ListToolbar from '@/components/ui/ListToolbar.vue'
import BaseTabs from '@/components/ui/BaseTabs.vue'
import StatusBanner from '@/components/ui/StatusBanner.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import SkeletonCard from '@/components/ui/SkeletonCard.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import CompanyVehicleCard from '@/features/company/components/vehicles/CompanyVehicleCard.vue'

const CompanyGaragesTab = defineAsyncComponent({
  loader: () => import('@/features/company/components/vehicles/CompanyGaragesTab.vue'),
  loadingComponent: LoadingSpinner,
  delay: 150,
})

const store = useTransporteStore()
const scope = useAccountScope()
const route = useRoute()
const router = useRouter()

const tabTransition = shallowRef('tab-slide-left')
const busca = shallowRef('')
const buscaDebounced = useDebounce(busca, 150)
const filtroAtivo = shallowRef('Todas')
const menuAberto = shallowRef(null)
const carregando = shallowRef(true)

const resumo = computed(() => {
  const lista = store.veiculos || []
  return {
    total: lista.length,
    ativos: lista.filter((v) => v.status === 'Ativo').length,
    manutencao: lista.filter((v) => v.status === 'Manutenção').length,
    lugares: lista.reduce((acc, v) => acc + (Number(v.capacidade) || 0), 0),
  }
})

const abaAtiva = computed(() => (route.params.tab === 'garages' ? 'garages' : 'fleet'))

const vehicleTabs = computed(() => [
  {
    value: 'fleet',
    to: ROUTE_PATHS.TRANSPORT_FLEET,
    label: 'Frota',
    icon: 'mdi-bus',
    badge: store.veiculos.length,
  },
  {
    value: 'garages',
    to: ROUTE_PATHS.TRANSPORT_GARAGES,
    label: 'Garagens',
    icon: 'mdi-garage',
    badge: store.garagens.length,
  },
])

watch(abaAtiva, (next, prev) => {
  const order = { fleet: 0, garages: 1 }
  tabTransition.value = (order[next] ?? 0) >= (order[prev] ?? 0) ? 'tab-slide-left' : 'tab-slide-right'
})

onMounted(async () => {
  await store.fetchVeiculos({ signal: scope.signal })
  carregando.value = false
})

const veiculosFiltrados = computed(() => {
  const lista = store.veiculos || []
  const termo = buscaDebounced.value.toLowerCase()
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
    <PageHeader
      title="Frota e Garagens"
      eyebrow="Painel da empresa"
      icon="mdi-bus"
      subtitle="Veículos, capacidade e garagens de onde a frota sai."
    />

    <section class="stat-grid" aria-label="Resumo da frota">
      <StatTile icon="mdi-bus" label="Veículos" :value="resumo.total" :loading="carregando" hint="Cadastrados na frota" />
      <StatTile
        icon="mdi-check-circle-outline"
        label="Ativos"
        :value="resumo.ativos"
        :total="resumo.total"
        :loading="carregando"
        tone="green"
      />
      <StatTile icon="mdi-wrench-outline" label="Em manutenção" :value="resumo.manutencao" :loading="carregando" tone="gray" />
      <StatTile icon="mdi-seat-passenger" label="Lugares" :value="resumo.lugares" :loading="carregando" tone="blue" hint="Capacidade somada" />
      <StatTile icon="mdi-garage" label="Garagens" :value="store.garagens.length" :loading="carregando" hint="Pontos de saída" />
    </section>

    <BaseTabs
      :items="vehicleTabs"
      aria-label="Configuração de frota e garagens"
    />

    <div class="tab-stage">
      <Transition :name="tabTransition" mode="out-in">
        <div v-if="abaAtiva === 'fleet'" key="fleet" class="tab-pane-stack">
          <ListToolbar
            v-model="busca"
            placeholder="Busque por placa ou modelo..."
            search-label="Buscar veículo"
            action-label="Adicionar veículo"
            :action-to="ROUTE_PATHS.REGISTER_VEHICLE"
          />

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

          <Transition name="fade-slide" mode="out-in">
            <SkeletonCard v-if="store.loading" key="loading" :count="3" />
            <StatusBanner v-else-if="store.error" key="error" variant="danger" :message="store.error" />
            <EmptyState
              v-else-if="!veiculosFiltrados.length"
              key="empty"
              icon="mdi-bus-alert"
              description="Nenhum veículo encontrado."
            />

            <TransitionGroup v-else key="list" name="list-stagger" tag="div" class="list-container">
              <CompanyVehicleCard
                v-for="veiculo in veiculosFiltrados"
                :key="veiculo.id"
                :veiculo="veiculo"
                :menu-open="menuAberto === veiculo.id"
                @toggle-menu="toggleMenu"
                @edit="(id) => router.push(`/vehicles/${id}/edit`)"
                @toggle-status="alterarStatus"
              />
            </TransitionGroup>
          </Transition>
        </div>

        <CompanyGaragesTab v-else key="garages" />
      </Transition>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.company-vehicles-page {
  --page-max: 1040px;
  @include section-container(120px);
}

.tab-stage {
  @include tab-stage;
}

.tab-pane-stack {
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
  @include filter-chip;
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
