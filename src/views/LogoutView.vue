<script setup>
import { computed, onMounted, shallowRef } from 'vue'
import { useRouter } from 'vue-router'
import { ROUTE_NAMES, ROUTE_PATHS } from '@/constants'
import { useLoginState } from '@/stores/useLoginState'
import { state } from '@/stores/state'
import LoadingScreen from '@/components/ui/LoadingScreen.vue'
import BaseButton from '@/components/ui/BaseButton.vue'

const router = useRouter()
const { logout } = useLoginState()

const status = shallowRef('leaving')

const loadingTitle = computed(() =>
  status.value === 'redirecting' ? 'Redirecionando para o login...' : 'Encerrando sessão...',
)
const loadingSubtitle = computed(() =>
  status.value === 'redirecting'
    ? 'Sessão encerrada com segurança'
    : 'Limpando suas credenciais e desconectando sua conta',
)

async function leave() {
  status.value = 'leaving'
  if (await logout()) {
    status.value = 'redirecting'
    window.location.replace(router.resolve({ name: ROUTE_NAMES.LOGIN }).href)
    return
  }
  status.value = 'error'
}

onMounted(leave)
</script>

<template>
  <Transition name="fade-scale" mode="out-in">
    <LoadingScreen
      v-if="status !== 'error'"
      key="loading"
      fullscreen
      :title="loadingTitle"
      :subtitle="loadingSubtitle"
    />

    <section v-else key="error" class="logout-container">
      <div class="logout-error-card">
        <BaseIcon name="mdi-alert-circle-outline" class="logout-error-icon" />
        <h1 class="logout-error-title">Não foi possível sair</h1>
        <p class="logout-error-message" role="alert">
          {{ state.error || 'Ocorreu um erro ao encerrar sua sessão. Tente novamente.' }}
        </p>
        <div class="logout-error-actions">
          <BaseButton block size="lg" :loading="state.loading" @click="leave">
            Tentar sair novamente
          </BaseButton>
          <RouterLink :to="ROUTE_PATHS.HOME" class="logout-back-link">Voltar ao início</RouterLink>
        </div>
      </div>
    </section>
  </Transition>
</template>

<style lang="scss" scoped>
.logout-container {
  @include flex-center;
  min-height: 80vh;
  padding: $space-6;
  color: var(--text);
}

.logout-error-card {
  width: 100%;
  max-width: 380px;
  background: var(--color-surface);
  border: 1px solid var(--border);
  border-radius: $radius-xl;
  padding: $space-8 $space-6;
  box-shadow: var(--shadow);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: $space-3;
}

.logout-error-icon {
  font-size: 2.75rem;
  color: var(--danger);
}

.logout-error-title {
  margin: 0;
  font-size: $text-xl;
  font-weight: $font-bold;
  color: var(--text);
}

.logout-error-message {
  margin: 0;
  font-size: $text-md;
  color: var(--text-muted);
  line-height: 1.5;
}

.logout-error-actions {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: $space-3;
  margin-top: $space-3;
}

.logout-back-link {
  color: var(--primary);
  font-size: $text-md;
  font-weight: $font-semibold;
  padding: $space-2;

  &:hover {
    text-decoration: underline;
  }
}
</style>
