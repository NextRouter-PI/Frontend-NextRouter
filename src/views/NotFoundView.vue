<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { state } from '@/stores/state'

const router = useRouter()
const primaryTarget = computed(() => (state.logged ? '/' : '/login'))
const primaryLabel = computed(() => (state.logged ? 'Voltar ao início' : 'Ir para o login'))
</script>

<template>
  <div class="status-page">
    <div class="status-card">
      <div class="icon-wrap">
        <BaseIcon name="mdi-map-marker-question-outline" />
      </div>
      <p class="status-code">404</p>
      <h1>Página não encontrada</h1>
      <p class="status-desc">
        O endereço acessado não existe ou foi movido. Verifique a URL ou retorne à tela principal.
      </p>
      <div class="status-actions">
        <RouterLink :to="primaryTarget" class="btn-primary">
          <BaseIcon name="mdi-home-outline" />
          {{ primaryLabel }}
        </RouterLink>
        <button type="button" class="btn-outline" @click="router.back()">
          <BaseIcon name="mdi-arrow-left" />
          Voltar
        </button>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.status-page {
  min-height: 100vh;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
  background: var(--bg);
}

.status-card {
  width: 100%;
  max-width: 440px;
  background: var(--color-surface);
  border: 1px solid var(--border);
  border-radius: 20px;
  padding: 36px 28px;
  text-align: center;
  box-shadow: var(--shadow);
}

.icon-wrap {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: rgba(223, 128, 26, 0.12);
  color: var(--primary);
  margin-bottom: 16px;
}

.icon-wrap .mdi {
  font-size: 2.4rem;
}

.status-code {
  margin: 0 0 6px;
  font-size: 0.9rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: var(--primary);
}

h1 {
  margin: 0 0 12px;
  font-size: 1.5rem;
  color: var(--text);
}

.status-desc {
  margin: 0 0 24px;
  font-size: 0.95rem;
  line-height: 1.5;
  color: var(--text-muted);
}

.status-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
}

.btn-primary,
.btn-outline {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 18px;
  border-radius: 10px;
  font-size: 0.92rem;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  transition: opacity 0.15s ease, background 0.15s ease;
}

.btn-primary {
  background: var(--primary);
  color: var(--color-on-primary);
  border: 1px solid var(--primary);
}

.btn-primary:hover {
  background: var(--primary-hover);
}

.btn-outline {
  background: transparent;
  color: var(--text);
  border: 1px solid var(--border);
}

.btn-outline:hover {
  background: var(--altbg);
}
</style>
