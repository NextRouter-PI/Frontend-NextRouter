<script setup>
import { useTemplateRef } from 'vue'
import { useHabitualRouteBuilder } from '@/features/transport/composables/useHabitualRouteBuilder'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import StatusBanner from '@/components/ui/StatusBanner.vue'
import HabitualRouteList from '@/features/transport/components/HabitualRouteList.vue'
import HabitualRouteCandidates from '@/features/transport/components/HabitualRouteCandidates.vue'

const props = defineProps({
  groupId: { type: Number, required: true },
  destinationCoords: { type: Array, default: null },
  habitualRoutes: { type: Array, default: () => [] },
  sharedRoutes: { type: Array, default: () => [] },
})

const emit = defineEmits(['updated'])
const mapContainer = useTemplateRef('mapEl')

const {
  routeName,
  editingRouteId,
  savingHabitual,
  habitualError,
  habitualNotice,
  loadingCandidates,
  candidates,
  selectedCandidates,
  togglePassenger,
  focusPassenger,
  startEditRoute,
  cancelEditRoute,
  saveHabitualRoute,
} = useHabitualRouteBuilder({ props, emit, mapContainer })
</script>

<template>
  <div class="routes-builder">
    <BaseCard
      title="Rotas Habituais (com pontos dos passageiros)"
      subtitle="Cada passageiro do grupo pode estar vinculado a apenas uma rota habitual. Selecione-os no mapa ou na lista e arraste os pinos para ajuste fino antes de confirmar."
    >
      <HabitualRouteList :routes="habitualRoutes" @edit="startEditRoute" />

      <div class="builder-box">
        <h3>{{ editingRouteId ? 'Editar rota habitual' : 'Nova rota habitual' }}</h3>

        <div class="field-block">
          <label for="habitual-route-name">Nome da rota habitual<span>*</span></label>
          <input
            id="habitual-route-name"
            v-model="routeName"
            placeholder="Ex.: Rota Zona Norte — Manhã"
            :disabled="savingHabitual"
          />
        </div>

        <div class="map-wrap">
          <p class="map-caption">
            Clique nos marcadores ou marque os passageiros abaixo. Passageiros selecionados exibem pino azul arrastável para ajuste manual.
          </p>
          <div ref="mapEl" class="leaflet-canvas"></div>
        </div>

        <HabitualRouteCandidates
          :candidates="candidates"
          :selected-count="selectedCandidates.length"
          :loading="loadingCandidates"
          :disabled="savingHabitual"
          @toggle="togglePassenger"
          @focus="focusPassenger"
        />

        <StatusBanner variant="danger" :message="habitualError" />
        <StatusBanner variant="success" :message="habitualNotice" />

        <div class="action-row">
          <BaseButton size="sm" :loading="savingHabitual" @click="saveHabitualRoute">
            {{
              savingHabitual
                ? 'Confirmando...'
                : editingRouteId
                  ? 'Salvar alterações da rota'
                  : 'Confirmar criação da rota'
            }}
          </BaseButton>
          <BaseButton
            v-if="editingRouteId"
            variant="outline"
            size="sm"
            :disabled="savingHabitual"
            @click="cancelEditRoute"
          >
            Cancelar edição
          </BaseButton>
        </div>
      </div>
    </BaseCard>

    <BaseCard
      title="Serviços Compartilhados"
      subtitle="Viagens intermediárias compartilhadas são configuradas na aba 1. Configurações do Grupo → Serviços Compartilhados e não possuem rotas fixas, pois os passageiros variam a cada atendimento."
    />
  </div>
</template>

<style lang="scss" scoped>
.routes-builder,
.builder-box {
  display: flex;
  flex-direction: column;
  gap: $space-3;
}

.builder-box {
  padding-top: $space-3;
  border-top: 1px solid var(--border);
}

.field-block {
  display: flex;
  flex-direction: column;
  gap: $space-1;

  label {
    font-size: $text-sm;
    font-weight: $font-semibold;
    color: var(--primary);
  }

  input {
    padding: 10px $space-3;
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

.map-caption {
  font-size: $text-xs;
  color: var(--text-muted);
  margin-bottom: $space-2;
}

.leaflet-canvas {
  width: 100%;
  height: 320px;
  border-radius: $radius-md;
  border: 1px solid var(--border);
  z-index: $z-base;
}

.action-row {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;
}
</style>
