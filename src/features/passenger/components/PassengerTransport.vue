<script setup>
import PageHeader from '@/components/ui/PageHeader.vue'
import TransportHistoryNotifications from '@/features/transport/components/TransportHistoryNotifications.vue'
</script>

<template>
  <div class="history-container">
    <PageHeader
      title="Suas viagens"
      highlight="viagens"
      eyebrow="Histórico"
      icon="mdi-history"
      subtitle="Viagens finalizadas, itens perdidos, avaliações e avisos da sua empresa."
    />
    <TransportHistoryNotifications />
  </div>
</template>

<style lang="scss" scoped>
.history-container {
  --page-max: 1040px;
  @include section-container(140px);
  display: block;
  background: var(--bg);
}
</style>
