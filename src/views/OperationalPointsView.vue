<script setup>
import { computed, onMounted, shallowRef } from 'vue'
import { ROUTE_PATHS } from '@/constants'
import { useTransporteStore } from '@/stores/useTransporteStore'
import { useAccountScope } from '@/composables/useAccountScope'
import { useInputFormat } from '@/composables/useInputFormat'
import PageHeader from '@/components/ui/PageHeader.vue'
import StatTile from '@/components/ui/StatTile.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import StatusBanner from '@/components/ui/StatusBanner.vue'
import SkeletonCard from '@/components/ui/SkeletonCard.vue'
import ListToolbar from '@/components/ui/ListToolbar.vue'
import { useRotasStore } from '@/stores/useRotasStore'

const store = useTransporteStore()
const scope = useAccountScope()
const { formatCEP } = useInputFormat()

const rotas = useRotasStore()
const busca = shallowRef('')

const pontosFiltrados = computed(() => {
  const termo = busca.value.trim().toLowerCase()
  if (!termo) return store.pontosDestino
  return store.pontosDestino.filter((p) =>
    [p.name, p.street, p.neighborhood, p.city].some((v) => String(v || '').toLowerCase().includes(termo)),
  )
})

// Grupos de atendimento que usam cada destino.
const gruposPorPonto = computed(() => {
  const map = new Map()
  for (const g of rotas.grupos || []) {
    const list = map.get(g.destinationId)
    if (list) list.push(g)
    else map.set(g.destinationId, [g])
  }
  return map
})

const editPath = (id) => ROUTE_PATHS.EDIT_POINT.replace(':id', id)
const carregando = shallowRef(true)
const cidades = computed(() => new Set(store.pontosOperacionais.map((p) => `${p.city}/${p.state}`)).size)

onMounted(async () => {
  rotas.fetchRotas({ signal: scope.signal })
  await store.fetchPontosOperacionais({ signal: scope.signal })
  carregando.value = false
})
</script>

<template>
  <div class="points-page">
    <PageHeader
      title="Pontos operacionais de destino"
      highlight="destino"
      eyebrow="Painel da empresa"
      icon="mdi-map-marker-radius"
      subtitle="Escolas, campi e paradas finais dos grupos. Informe o CEP e ajuste o ponto no mapa."
    />

    <section class="stat-grid" aria-label="Resumo dos pontos">
      <StatTile icon="mdi-map-marker-radius" label="Destinos" :value="store.pontosDestino.length" :loading="carregando" hint="Para os grupos de atendimento" />
      <StatTile icon="mdi-garage" label="Garagens" :value="store.garagens.length" :loading="carregando" tone="blue" hint="Cadastradas em Veículos" :to="ROUTE_PATHS.TRANSPORT_GARAGES" />
      <StatTile icon="mdi-map-marker-multiple-outline" label="Cidades" :value="cidades" :loading="carregando" tone="green" hint="Com algum ponto cadastrado" />
    </section>

    <StatusBanner variant="danger" :message="store.error" />

    <ListToolbar
      v-model="busca"
      placeholder="Busque por nome, bairro ou cidade..."
      search-label="Buscar ponto de destino"
      action-label="Novo ponto de destino"
      :action-to="ROUTE_PATHS.REGISTER_POINT"
    />

    <Transition name="fade-slide" mode="out-in">
      <SkeletonCard v-if="store.pointsLoading" key="loading" :count="2" />
      <p v-else-if="!store.pontosDestino.length" key="empty" class="hint">
        Nenhum ponto de destino cadastrado ainda. Use “Novo ponto de destino” para cadastrar o primeiro.
      </p>
      <p v-else-if="!pontosFiltrados.length" key="no-match" class="hint">Nenhum ponto encontrado para essa busca.</p>
      <TransitionGroup v-else key="list" name="list-stagger" tag="div" class="points-list">
        <article v-for="ponto in pontosFiltrados" :key="ponto.id" class="point-card">
          <span class="point-icon" aria-hidden="true"><BaseIcon name="mdi-map-marker-radius" /></span>
          <div class="point-info">
            <h3>{{ ponto.name }}</h3>
            <p class="point-address">
              {{ ponto.street }}, {{ ponto.number }} — {{ ponto.neighborhood }}, {{ ponto.city }}/{{ ponto.state }}
              · CEP {{ formatCEP(ponto.cep) }}
            </p>
            <div class="point-groups">
              <span v-for="g in gruposPorPonto.get(ponto.id) || []" :key="g.id" class="group-chip">
                <BaseIcon name="mdi-routes" /> {{ g.name }} · {{ g.members.length }} passageiros
              </span>
              <span v-if="!(gruposPorPonto.get(ponto.id) || []).length" class="group-chip muted">
                Nenhum grupo usa este destino
              </span>
            </div>
          </div>
          <div class="point-card-actions">
            <RouterLink
              :to="{ path: ROUTE_PATHS.REGISTER_ROUTE, query: { destination: ponto.id } }"
              class="link-outline"
            >
              <BaseIcon name="mdi-routes" />
              Vincular grupo
            </RouterLink>
            <BaseButton variant="outline" size="sm" icon="mdi-pencil-outline" @click="$router.push(editPath(ponto.id))">
              Editar
            </BaseButton>
          </div>
        </article>
      </TransitionGroup>
    </Transition>
  </div>
</template>

<style lang="scss" scoped>
.points-page {
  @include section-container(120px);
}

.hint {
  font-size: $text-sm;
  color: var(--text-muted);
}

.points-list {
  display: flex;
  flex-direction: column;
  gap: $space-3;
}

.point-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: $space-3;
  padding: $space-4;
  border-radius: $radius-md;
  background: var(--altbg);
  border: 1px solid var(--border);

  h3 {
    font-size: $text-base;
    font-weight: $font-bold;
  }
}

.point-address,
.point-coords {
  font-size: $text-xs;
  color: var(--text-muted);
  margin-top: 2px;
}

.point-card-actions {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;
  align-items: center;
}

.link-outline {
  display: inline-flex;
  align-items: center;
  gap: $space-1;
  padding: $space-2 14px;
  border-radius: $radius-md;
  outline: 1.5px solid var(--border);
  outline-offset: -1.5px;
  font-size: $text-sm;
  font-weight: $font-semibold;
  color: var(--text);
  transition: all $duration-normal $ease-fluid;

  &:hover {
    outline-color: var(--primary);
    color: var(--primary);
    background: var(--color-primary-soft);
  }
}

.point-card {
  @include surface-card($space-4, $radius-lg);
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: $space-4;
  transition:
    transform $duration-slow $ease-fluid,
    box-shadow $duration-slow $ease-fluid,
    outline-color $duration-normal $ease-fluid;

  &:hover {
    transform: translateY(-3px);

    .point-icon {
      background: var(--gradient-brand);
      color: #fff;
      transform: rotate(-8deg) scale(1.08);
    }
  }

  @include until($bp-sm) {
    grid-template-columns: auto 1fr;

    .point-card-actions {
      grid-column: 1 / -1;
    }
  }
}

.point-icon {
  @include flex-center;
  width: 46px;
  height: 46px;
  border-radius: $radius-lg;
  background: var(--color-primary-soft);
  color: var(--primary);
  font-size: 1.4rem;
  transition:
    background-color $duration-normal $ease-fluid,
    color $duration-normal $ease-fluid,
    transform $duration-slow $ease-spring;
}

.point-info {
  min-width: 0;

  h3 {
    font-size: $text-lg;
  }
}

.point-groups {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: $space-2;
}

.group-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 10px;
  border-radius: $radius-pill;
  background: var(--color-primary-soft);
  color: var(--primary-text);
  font-size: $text-xs;
  font-weight: $font-semibold;

  &.muted {
    background: var(--altbg);
    color: var(--text-muted);
  }
}
</style>
