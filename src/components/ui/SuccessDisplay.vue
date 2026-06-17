<script setup>
defineProps({
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' }
})
</script>

<template>
  <div class="success-container">
    <div class="icon-check">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
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
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
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

.icon-check svg {
  width: 50px;
  height: 50px;
  color: white;
  stroke-width: 3;
}

.title {
  font-size: 20px;
  font-weight: 700;
  color: #333;
  margin: 0 0 8px;
}

.subtitle {
  font-size: 14px;
  color: #666;
  margin: 0;
}
</style>
