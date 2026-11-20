<script setup>
import { computed, onMounted, watch } from 'vue'
import { useTransportState } from '@/stores/useTransportState'
import { useToast } from '@/composables/useToast'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'

const { state, loadDriverData, registrarPresencaParticipante } = useTransportState()
const { showToast } = useToast()
const transport = computed(() => state.driver)
const isInProgress = computed(() => transport.value?.travelStatus === 'in_progress')

watch(
  () => state.notice,
  (msg) => {
    if (msg) showToast(msg, 'success')
  },
)
watch(
  () => state.error,
  (msg) => {
    if (msg) showToast(msg, 'error')
  },
)

const statusLabel = {
  allocated: 'Alocado (aguardando embarque)',
  on_board: 'Embarcado',
  dropped_off: 'Desembarcado',
  no_show: 'Ausente (no-show)',
  withdrawn: 'Desistiu antes do embarque',
}

onMounted(() => {
  loadDriverData()
})
</script>

<template>
  <div class="usuarios-list-container">
    <div class="questionario-header-block">
      <h2>Participantes e Paradas da Viagem Designada</h2>
      <p class="header-sub">
        Dados derivados das participações e paradas calculadas (`travel-participations/` e `route-stops/`), sem expor dados cadastrais privados dos passageiros.
      </p>
    </div>

    <LoadingSpinner v-if="state.loading" />

    <template v-else-if="transport">
      <div v-if="transport.travels.length" class="schedule-selector">
        <button
          v-for="t in transport.travels"
          :key="t.id"
          type="button"
          :class="['chip-btn', { active: t.id === transport.travelId }]"
          :disabled="state.busy"
          @click="loadDriverData(t.id)"
        >
          Viagem #{{ t.id }} · {{ t.date }} ({{ t.direction === 'outbound' ? 'Ida' : 'Retorno' }}) · {{ t.status }}
        </button>
      </div>

      <Transition name="fade-slide" mode="out-in">
        <div :key="transport.travelId || 'empty'" class="list-container">
          <h3 class="list-title">
            Passageiros da Viagem ({{ transport.participations.length }})
          </h3>

          <div v-if="transport.participations.length">
            <div v-for="part in transport.participations" :key="part.id" class="passenger-card">
              <div class="passenger-name">{{ part.name || `Participante #${part.id}` }}</div>
              <div class="passenger-status" :class="part.status === 'on_board' || part.status === 'dropped_off' ? 'confirmed' : 'pending'">
                Estado: {{ statusLabel[part.status] || part.status }}
              </div>

              <div v-if="isInProgress" class="action-buttons">
                <button
                  v-if="part.status === 'allocated'"
                  type="button"
                  class="btn-action primary"
                  :disabled="state.busy"
                  @click="registrarPresencaParticipante(part.id, 'boarded')"
                >
                  Registrar Embarque
                </button>
                <button
                  v-if="part.status === 'allocated'"
                  type="button"
                  class="btn-action outline"
                  :disabled="state.busy"
                  @click="registrarPresencaParticipante(part.id, 'no_show')"
                >
                  Registrar Ausência
                </button>
                <button
                  v-if="part.status === 'on_board'"
                  type="button"
                  class="btn-action primary"
                  :disabled="state.busy"
                  @click="registrarPresencaParticipante(part.id, 'dropped_off')"
                >
                  Registrar Desembarque
                </button>
              </div>
            </div>
          </div>

          <div v-else class="no-passengers">
            Nenhum participante alocado para a viagem selecionada.
          </div>
        </div>
      </Transition>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.usuarios-list-container {
  padding: 20px 20px 140px;
  min-height: 100vh;
  max-width: 680px;
  margin: 0 auto;
}

.questionario-header-block {
  background: var(--color-surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 16px;
  text-align: center;
  margin-bottom: 14px;
}

.questionario-header-block h2 {
  font-size: 1.15rem;
  font-weight: 800;
  color: var(--text);
  margin: 0 0 6px;
}

.header-sub {
  font-size: 0.82rem;
  color: var(--text-muted);
  margin: 0;
  line-height: 1.4;
}

.notice-banner {
  padding: 10px 14px;
  border-radius: 10px;
  background: rgba(5, 150, 105, 0.12);
  color: var(--success, var(--success));
  font-weight: 600;
  margin-bottom: 12px;
}

.error-banner {
  padding: 10px 14px;
  border-radius: 10px;
  background: rgba(220, 38, 38, 0.12);
  color: var(--danger, var(--danger));
  font-weight: 600;
  margin-bottom: 12px;
}

.schedule-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 14px;
}

.chip-btn {
  padding: 8px 12px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: var(--color-surface);
  color: var(--text-muted);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
}

.chip-btn.active {
  border-color: var(--primary);
  background: rgba(223, 128, 26, 0.12);
  color: var(--primary);
}

.list-container {
  background: var(--color-surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 16px;
}

.list-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text);
  margin: 0 0 10px;
}

.passenger-card {
  border: 1px solid var(--border-primary);
  border-radius: 12px;
  padding: 12px 14px;
  background: var(--bg);
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 10px;
}

.passenger-name {
  font-size: 0.96rem;
  font-weight: 700;
  color: var(--text);
}

.passenger-status {
  font-size: 0.8rem;
  font-weight: 600;
}

.passenger-status.confirmed {
  color: var(--success, #22c55e);
}

.passenger-status.pending {
  color: var(--text-muted);
}

.action-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 4px;
}

.btn-action {
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
}

.btn-action.primary {
  border: none;
  background: var(--primary);
  color: white;
}

.btn-action.outline {
  border: 1px solid var(--border);
  background: var(--color-surface);
  color: var(--text);
}

.no-passengers {
  text-align: center;
  padding: 24px;
  color: var(--text-muted);
  font-size: 0.9rem;
}
</style>
