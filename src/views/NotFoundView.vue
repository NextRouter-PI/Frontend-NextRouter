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
    <RouterLink :to="primaryTarget" class="brand-mark" aria-label="NextRouter">
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 20c-4.42 0-8-1.34-8-3 0-1.08 1.54-2.03 3.85-2.56l.68 1.36C6.95 16.17 5.8 16.69 5.8 17c0 .77 2.55 1.7 6.2 1.7s6.2-.93 6.2-1.7c0-.31-1.15-.83-2.73-1.2l.68-1.36C18.46 14.97 20 15.92 20 17c0 1.66-3.58 3-8 3z" />
        <path d="M12 2C8.69 2 6 4.69 6 8c0 4.5 6 9.5 6 9.5s6-5 6-9.5c0-3.31-2.69-6-6-6zm0 8.2a2.2 2.2 0 1 1 0-4.4 2.2 2.2 0 0 1 0 4.4z" />
      </svg>
      <span><span class="brand-accent">NEXT</span>ROUTER</span>
    </RouterLink>

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
  min-height: 100dvh;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
  padding: 24px 16px;
  background: var(--bg);
}

.brand-mark {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  font-size: 1.1rem;
  font-weight: $font-extrabold;
  letter-spacing: 0.06em;
  color: var(--text);

  svg {
    width: 24px;
    height: 24px;
    color: var(--primary);
  }
}

.brand-accent {
  color: var(--primary);
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
  @include action-button;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 18px;
  font-size: 0.92rem;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
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

@include status-page-skin;
</style>
