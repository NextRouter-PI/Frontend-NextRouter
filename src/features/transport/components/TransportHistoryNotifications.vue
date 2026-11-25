<script setup>
import { computed, onMounted } from 'vue'
import { useTransportHistory } from '@/features/transport/composables/useTransportHistory'
import BaseButton from '@/components/ui/BaseButton.vue'
import StatTile from '@/components/ui/StatTile.vue'
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

const resumo = computed(() => {
  const notas = ratings.value.map((r) => Number(r.score)).filter(Number.isFinite)
  return {
    viagens: finishedTravels.value.length,
    itens: lostItems.value.length,
    devolvidos: lostItems.value.filter((i) => i.status === 'returned').length,
    avaliacoes: ratings.value.length,
    media: notas.length ? (notas.reduce((a, b) => a + b, 0) / notas.length).toFixed(1) : null,
    naoLidos: notifications.value.filter((n) => !n.read_at).length,
  }
})
</script>

<template>
  <div class="history-panel">
    <section class="stat-grid" aria-label="Resumo do histórico">
      <StatTile icon="mdi-flag-checkered" label="Viagens finalizadas" :value="loading ? null : resumo.viagens" :loading="loading" />
      <StatTile
        icon="mdi-bag-personal-outline"
        label="Itens perdidos"
        :value="loading ? null : resumo.itens"
        :loading="loading"
        tone="blue"
        :hint="`${resumo.devolvidos} devolvidos`"
      />
      <StatTile
        icon="mdi-star-outline"
        label="Avaliações"
        :value="loading ? null : resumo.avaliacoes"
        :loading="loading"
        tone="green"
        :hint="resumo.media ? `Média ${resumo.media} de 5` : 'Sem notas ainda'"
      />
      <StatTile icon="mdi-bell-ring-outline" label="Avisos não lidos" :value="loading ? null : resumo.naoLidos" :loading="loading" tone="gray" />
    </section>

    <div class="history-header">
      <div>
        <h2>Detalhes</h2>
        <p class="history-sub">Viagens finalizadas, itens perdidos, avaliações e avisos.</p>
      </div>
      <BaseButton variant="outline" size="sm" icon="mdi-refresh" :disabled="loading || busy" @click="refresh">
        Atualizar
      </BaseButton>
    </div>

    <StatusBanner variant="success" :message="notice" />
    <StatusBanner variant="danger" :message="error" />

    <Transition name="fade-slide" mode="out-in">
      <SkeletonCard v-if="loading" key="loading" :count="2" />

      <div v-else key="content" class="history-sections">
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
    </Transition>
  </div>
</template>

<style lang="scss" scoped>
.history-panel,
.history-sections {
  display: flex;
  flex-direction: column;
  gap: $space-4;
}

.history-panel {
  margin-top: $space-2;
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
