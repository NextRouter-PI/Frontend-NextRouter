<script setup>
import TransportHistoryNotifications from '@/features/transport/components/TransportHistoryNotifications.vue'
</script>

<template>
  <div class="history-container">
    <TransportHistoryNotifications />
  </div>
</template>

<style lang="scss" scoped>
.history-container {
  @include section-container(140px);
  display: block;
  background: var(--bg);
}
</style>
