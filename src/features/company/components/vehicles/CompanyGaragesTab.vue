<script setup>
import { computed, shallowRef } from 'vue'
import { ROUTE_PATHS } from '@/constants'
import { useTransporteStore } from '@/stores/useTransporteStore'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import ListToolbar from '@/components/ui/ListToolbar.vue'

const store = useTransporteStore()
const busca = shallowRef('')

// Busca por nome, rua, bairro ou cidade.
const garagensFiltradas = computed(() => {
  const termo = busca.value.trim().toLowerCase()
  if (!termo) return store.garagens
  return store.garagens.filter((p) =>
    [p.name, p.street, p.neighborhood, p.city].some((v) => String(v || '').toLowerCase().includes(termo)),
  )
})

const editPath = (id) => ROUTE_PATHS.EDIT_GARAGE.replace(':id', id)

const vehiclePlatesByGarageId = computed(() => {
  const map = new Map()
  for (const v of store.veiculos || []) {
    if (!v.garagePointId) continue
    const list = map.get(v.garagePointId)
    if (list) list.push(v.placa)
    else map.set(v.garagePointId, [v.placa])
  }
  return map
})
</script>

<template>
  <div class="garages-tab">
    <ListToolbar
      v-model="busca"
      placeholder="Busque por nome, bairro ou cidade..."
      search-label="Buscar garagem"
      action-label="Adicionar garagem"
      :action-to="ROUTE_PATHS.REGISTER_GARAGE"
    />

    <Transition name="fade-slide" mode="out-in">
      <EmptyState v-if="store.pointsLoading" key="loading" loading description="Carregando garagens..." />
      <EmptyState
        v-else-if="!store.garagens.length"
        key="empty"
        icon="mdi-garage-outline"
        description="Nenhuma garagem cadastrada ainda. Use “Adicionar garagem” para vincular os veículos a ela."
      />
      <EmptyState
        v-else-if="!garagensFiltradas.length"
        key="no-match"
        icon="mdi-magnify"
        description="Nenhuma garagem encontrada para essa busca."
      />

      <div v-else key="list" class="garages-list">
        <BaseCard
          interactive
          v-for="ponto in garagensFiltradas"
          :key="ponto.id"
          :title="ponto.name"
          :subtitle="`${ponto.street}, ${ponto.number}${ponto.complement ? ` (${ponto.complement})` : ''} — ${ponto.neighborhood}, ${ponto.city}/${ponto.state} · CEP ${ponto.cep}`"
        >
          <template #actions>
            <BaseButton variant="outline" size="sm" icon="mdi-pencil-outline" @click="$router.push(editPath(ponto.id))">Editar</BaseButton>
          </template>

          <div class="card-details">
            <div class="detail-item">
              <BaseIcon name="mdi-crosshairs-gps" />
              <span>{{ ponto.latitude }}, {{ ponto.longitude }}</span>
            </div>
            <div class="detail-item">
              <BaseIcon name="mdi-bus-multiple" />
              <span v-if="vehiclePlatesByGarageId.get(ponto.id)?.length">
                Veículos vinculados: {{ vehiclePlatesByGarageId.get(ponto.id).join(', ') }}
              </span>
              <span v-else>Nenhum veículo vinculado</span>
            </div>
          </div>
        </BaseCard>
      </div>
    </Transition>
  </div>
</template>

<style lang="scss" scoped>
.garages-tab,
.garages-list {
  display: flex;
  flex-direction: column;
  gap: $space-4;
}

.card-details {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2 $space-4;
}

.detail-item {
  display: inline-flex;
  align-items: center;
  gap: $space-1;
  font-size: $text-sm;
  color: var(--text-muted);

  .mdi {
    color: var(--primary);
  }
}
</style>
