<script setup>
import { computed, shallowRef } from 'vue'
import { useTransporteStore } from '@/stores/useTransporteStore'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import GarageFormCard from '@/features/company/components/vehicles/GarageFormCard.vue'

const store = useTransporteStore()
const editingPoint = shallowRef(null)

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
    <GarageFormCard
      :editing-point="editingPoint"
      @saved="editingPoint = null"
      @cancel-edit="editingPoint = null"
    />

    <Transition name="fade-slide" mode="out-in">
      <EmptyState v-if="store.pointsLoading" key="loading" loading description="Carregando garagens..." />
      <EmptyState
        v-else-if="!store.garagens.length"
        key="empty"
        icon="mdi-garage-outline"
        description="Nenhuma garagem cadastrada ainda. Cadastre uma garagem acima para vinculá-la aos veículos da frota."
      />

      <div v-else key="list" class="garages-list">
        <BaseCard
          v-for="ponto in store.garagens"
          :key="ponto.id"
          :title="`${ponto.name} · #${ponto.id}`"
          :subtitle="`${ponto.street}, ${ponto.number}${ponto.complement ? ` (${ponto.complement})` : ''} — ${ponto.neighborhood}, ${ponto.city}/${ponto.state} · CEP ${ponto.cep}`"
        >
          <template #actions>
            <BaseButton variant="outline" size="sm" @click="editingPoint = ponto">Editar</BaseButton>
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
