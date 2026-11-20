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
  padding: 20px 20px 140px;
  background: var(--bg);
  min-height: 100vh;
  max-width: 720px;
  margin: 0 auto;
}
</style>
