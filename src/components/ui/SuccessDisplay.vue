<script setup>
defineProps({
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' }
})
</script>

<template>
  <div class="success-container">
    <div class="icon-check">
      <span class="mdi mdi-check-circle"></span>
    </div>
    <p v-if="title" class="title">{{ title }}</p>
    <p v-if="subtitle" class="subtitle">{{ subtitle }}</p>
    <slot />
  </div>
</template>

<style scoped>
.success-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 40px 20px;
}

.icon-check {
  width: 72px;
  height: 72px;
  background: linear-gradient(135deg, var(--success) 0%, #1e8449 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
  animation: bounce 0.5s ease;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.icon-check .mdi {
  font-size: 2.4rem;
  color: white;
}

.title {
  font-size: 20px;
  font-weight: 700;
  color: var(--text);
  margin: 0 0 8px;
}

.subtitle {
  font-size: 14px;
  color: var(--text-muted);
  margin: 0;
}
</style>
