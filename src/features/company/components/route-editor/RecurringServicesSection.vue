<script setup>
import { computed, shallowRef } from 'vue'
import { SERVICE_DIRECTIONS } from '@/constants'
import { useRotasStore } from '@/stores/useRotasStore'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import RecurringServiceForm from './RecurringServiceForm.vue'

const props = defineProps({
  groupId: { type: Number, required: true },
  services: { type: Array, required: true },
  isShared: { type: Boolean, default: false },
})

const emit = defineEmits(['updated'])

const store = useRotasStore()
const editingService = shallowRef(null)

const title = computed(() =>
  props.isShared
    ? '3B. Serviços Compartilhados (viagens intermediárias)'
    : '3. Serviços Habituais (Ida e Retorno separados)',
)
const subtitle = computed(() =>
  props.isShared
    ? 'Usados para retornos ou deslocamentos intermediários onde passageiros de diferentes rotas podem viajar juntos. Por variarem a cada dia, não possuem rotas ou paradas fixas.'
    : 'Defina o sentido, horário, dias da semana, motorista/veículo habituais e os pontos obrigatórios de origem e destino.',
)

function nomePonto(pid) {
  const p = store.pontosOperacionais.find((item) => item.id === pid)
  return p ? `${p.name} (${p.city}/${p.state})` : `Ponto #${pid}`
}

function handleSaved() {
  editingService.value = null
  emit('updated')
}
</script>

<template>
  <BaseCard :title="title" :subtitle="subtitle">
    <div v-if="services.length" class="item-list">
      <div v-for="s in services" :key="s.id" class="sub-card">
        <div class="sub-card-header">
          <div>
            <strong>{{ s.name }} (#{{ s.id }})</strong> ·
            <span class="badge-dir">
              {{ s.direction === SERVICE_DIRECTIONS.OUTBOUND ? 'Ida' : 'Retorno' }}
            </span>
            <span v-if="isShared" class="badge-dir">Compartilhado</span> ·
            {{ s.targetTimeLabel }} · {{ s.weekdaysLabel }}
          </div>
          <BaseButton variant="outline" size="sm" @click="editingService = s">Editar</BaseButton>
        </div>
        <p class="sub-meta">
          Motorista: {{ s.driverName }} · Veículo: {{ s.vehiclePlate }} · Origem: {{ s.originName }} →
          Destino: {{ s.destinationName }}
        </p>
        <p v-if="!isShared" class="sub-meta">
          Paradas configuradas ({{ s.point_ids?.length || 0 }}):
          {{ s.point_ids?.length ? s.point_ids.map(nomePonto).join(' → ') : 'Nenhuma parada habitual' }}
        </p>
      </div>
    </div>
    <p v-else class="empty-msg">
      Nenhum serviço {{ isShared ? 'compartilhado' : 'habitual' }} cadastrado neste grupo.
    </p>

    <RecurringServiceForm
      :group-id="groupId"
      :is-shared="isShared"
      :editing-service="editingService"
      @saved="handleSaved"
      @cancel-edit="editingService = null"
    />
  </BaseCard>
</template>

<style lang="scss" scoped>
.item-list {
  display: flex;
  flex-direction: column;
  gap: $space-3;
}

.sub-card {
  padding: $space-3;
  border-radius: $radius-md;
  background: var(--altbg);
  border: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: $space-1;

  &-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: $space-2;
  }
}

.badge-dir {
  display: inline-block;
  padding: 2px $space-2;
  border-radius: $radius-pill;
  background: var(--color-primary-soft);
  color: var(--primary);
  font-size: $text-xs;
  font-weight: $font-bold;
  margin-left: 4px;
}

.sub-meta,
.empty-msg {
  font-size: $text-xs;
  color: var(--text-muted);
}
</style>
