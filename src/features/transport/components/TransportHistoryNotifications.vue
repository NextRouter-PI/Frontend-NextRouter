<script setup>
import { onMounted } from 'vue'
import { useTransportHistory } from '@/features/transport/composables/useTransportHistory'
import BaseButton from '@/components/ui/BaseButton.vue'
import StatusBanner from '@/components/ui/StatusBanner.vue'
import SkeletonCard from '@/components/ui/SkeletonCard.vue'
import LostItemsSection from './history/LostItemsSection.vue'
import DriverRatingsSection from './history/DriverRatingsSection.vue'
import NotificationsSection from './history/NotificationsSection.vue'

const {
  role,
  loading,
  busy,
  error,
  notice,
  notifications,
  ratings,
  lostItems,
  finishedTravels,
  participationsByTravel,
  droppedOffTravelIds,
  rateableTravels,
  reportableTravels,
  refresh,
  readNotification,
  handleSubmitRating,
  handleSubmitLostItem,
  handleAdvanceLostItem,
} = useTransportHistory()

onMounted(refresh)
</script>

<template>
  <div class="history-panel">
    <div class="history-header">
      <div>
        <h2>Histórico de Viagens e Itens Perdidos</h2>
        <p class="history-sub">
          Visualize suas viagens finalizadas, registre itens perdidos e acompanhe avaliações e avisos.
        </p>
      </div>
      <BaseButton variant="outline" size="sm" :disabled="loading || busy" @click="refresh">
        Atualizar
      </BaseButton>
    </div>

    <StatusBanner variant="success" :message="notice" />
    <StatusBanner variant="danger" :message="error" />
    <SkeletonCard v-if="loading" :count="2" />

    <LostItemsSection
      :role="role"
      :finished-travels="finishedTravels"
      :reportable-travels="reportableTravels"
      :lost-items="lostItems"
      :participations-by-travel="participationsByTravel"
      :dropped-off-travel-ids="droppedOffTravelIds"
      :loading="loading"
      :busy="busy"
      @submit-lost-item="handleSubmitLostItem"
      @advance-lost-item="handleAdvanceLostItem"
    />

    <DriverRatingsSection
      :role="role"
      :ratings="ratings"
      :rateable-travels="rateableTravels"
      :loading="loading"
      :busy="busy"
      @submit-rating="handleSubmitRating"
    />

    <NotificationsSection
      :notifications="notifications"
      :loading="loading"
      :busy="busy"
      @mark-read="readNotification"
    />
  </div>
</template>

<style lang="scss" scoped>
.history-panel {
  margin-top: $space-2;
  display: flex;
  flex-direction: column;
  gap: $space-4;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: $space-3;

  h2 {
    font-size: $text-lg;
    font-weight: $font-bold;
  }
}

.history-sub {
  font-size: $text-sm;
  color: var(--text-muted);
  margin-top: $space-1;
}
</style>
