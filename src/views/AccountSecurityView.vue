<script setup>
import { onMounted, ref, shallowRef, useTemplateRef } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/useAuthStore'
import { http } from '@/api/client'
import { readAccount } from '@/api/account'
import { sessionError } from '@/stores/session'
import { formatApiError } from '@/utils/apiErrors'
import { useAccountScope } from '@/composables/useAccountScope'
import PasswordResetForm from '@/features/auth/components/PasswordResetForm.vue'
import EmailChangeForm from '@/features/profile/components/EmailChangeForm.vue'
import AccountSessions from '@/features/profile/components/AccountSessions.vue'
import AccountDeactivationCard from '@/features/profile/components/AccountDeactivationCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import ErrorMessage from '@/components/ui/ErrorMessage.vue'
import SkeletonCard from '@/components/ui/SkeletonCard.vue'

const router = useRouter()
const auth = useAuthStore()
const scope = useAccountScope()
const deactivationCard = useTemplateRef('deactivationCard')

const account = ref(null)
const loading = shallowRef(false)
const busy = shallowRef(false)
const deactivating = shallowRef(false)
const error = shallowRef('')
const mode = shallowRef('password')

async function refresh() {
  if (!scope.current() || busy.value || loading.value || deactivating.value) return
  loading.value = true
  account.value = null
  error.value = ''
  deactivationCard.value?.reset()
  try {
    const data = await readAccount({ signal: scope.signal })
    if (scope.current() && auth.publishAccountSnapshot(scope.ownerId, data)) account.value = data
  } catch (cause) {
    if (scope.current()) error.value = sessionError(cause, formatApiError(cause, 'Não foi possível consultar sua conta.'))
  } finally {
    if (scope.current()) loading.value = false
  }
}

function confirmed() {
  if (scope.current()) http.confirmSessionRevocation()
}

// Menu lateral da segurança: cada opção com ícone e uma linha explicando.
const OPTIONS = [
  { value: 'password', icon: 'mdi-lock-reset', title: 'Senha', text: 'Trocar a senha com um código no e-mail' },
  { value: 'email', icon: 'mdi-email-outline', title: 'E-mail', text: 'Mudar o e-mail de acesso' },
  { value: 'sessions', icon: 'mdi-shield-lock-outline', title: 'Sessões', text: 'Ver e encerrar acessos ativos' },
]

async function handleLogout() {
  await router.push({ name: 'logout' })
}

onMounted(refresh)
</script>

<template>
  <div class="security-tab">
    <SkeletonCard v-if="loading" :count="1" :lines="4" />
    <div role="alert"><ErrorMessage :message="error" /></div>

    <div class="security-layout">
      <aside class="security-aside">
        <div class="security-intro">
          <span class="security-badge"><BaseIcon name="mdi-shield-lock-outline" /></span>
          <h2>Segurança da conta</h2>
          <p v-if="account" class="security-email"><BaseIcon name="mdi-email-outline" /> {{ account.email }}</p>
          <small>Trocar senha, e-mail ou encerrar sessões pede para entrar de novo.</small>
        </div>

        <nav v-if="account && auth.logged && account.id === auth.user?.id" class="security-menu" aria-label="Operação de segurança">
          <button
            v-for="option in OPTIONS"
            :key="option.value"
            type="button"
            class="security-option"
            :class="{ active: mode === option.value }"
            :aria-pressed="mode === option.value"
            :disabled="busy"
            @click="mode = option.value"
          >
            <span class="option-icon"><BaseIcon :name="option.icon" /></span>
            <span class="option-text">
              <strong>{{ option.title }}</strong>
              <small>{{ option.text }}</small>
            </span>
            <BaseIcon name="mdi-chevron-right" class="option-arrow" />
          </button>
        </nav>

        <BaseButton type="button" variant="ghost" size="sm" icon="mdi-refresh" class="security-refresh" :disabled="busy || loading" @click="refresh">
          Recarregar
        </BaseButton>
      </aside>

      <div class="security-main">
        <section v-if="account && auth.logged && account.id === auth.user?.id" class="account-section">
          <Transition name="fade-slide" mode="out-in">
            <PasswordResetForm v-if="mode === 'password'" :key="`${account.id}:${account.email}:password`" :account-email="account.email" :signal="scope.signal" @busy="busy = $event" @confirmed="confirmed" />
            <EmailChangeForm v-else-if="mode === 'email'" :key="`${account.id}:email`" @busy="busy = $event" @confirmed="confirmed" />
            <AccountSessions v-else :key="`${account.id}:sessions`" @busy="busy = $event" @confirmed="confirmed" />
          </Transition>
        </section>

        <div class="danger-grid">
          <section class="account-section logout-section">
            <h2><BaseIcon name="mdi-logout" class="section-icon" /> Encerrar sessão</h2>
            <p class="account-hint">Saia da sua conta neste dispositivo quando terminar de usar o NextRouter.</p>
            <button type="button" class="logout-action-btn" :disabled="busy || deactivating" @click="handleLogout">
              <BaseIcon name="mdi-logout" />
              <span>Sair da conta</span>
            </button>
          </section>

          <AccountDeactivationCard
            v-if="account && auth.logged && account.id === auth.user?.id"
            ref="deactivationCard"
            :account-email="account.email"
            :scope="scope"
            :disabled="busy"
            @deactivating="deactivating = $event"
            @deactivated="confirmed"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
// Mesma estrutura do perfil: coluna com o menu à esquerda e o conteúdo à direita.
.security-layout {
  display: grid;
  gap: $space-5;

  @include from(1100px) {
    grid-template-columns: 300px minmax(0, 1fr);
    align-items: start;
  }
}

.security-aside {
  display: flex;
  flex-direction: column;
  gap: $space-3;

  @include from(1100px) {
    position: sticky;
    top: $space-5;
  }
}

.security-intro {
  @include surface-card($space-5, $radius-xl);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;

  h2 {
    margin: $space-2 0 0;
    font-size: 1.2rem;
    font-weight: $font-extrabold;
  }

  small {
    color: var(--text-muted);
    font-size: $text-xs;
    line-height: 1.45;
  }
}

.security-badge {
  @include flex-center;
  width: 48px;
  height: 48px;
  border-radius: $radius-lg;
  background: var(--gradient-brand);
  color: #fff;
  font-size: 1.5rem;
}

.security-email {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--primary-text);
  font-size: $text-sm;
  font-weight: $font-semibold;
  word-break: break-all;
}

.security-menu {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: $space-2;
  border-radius: $radius-lg;
  background: var(--color-surface);
  outline: 1px solid var(--border);
  outline-offset: -1px;
}

.security-option {
  display: flex;
  align-items: center;
  gap: $space-3;
  padding: 10px;
  border-radius: $radius-md;
  text-align: left;
  color: var(--text);
  transition:
    background-color $duration-normal $ease-fluid,
    transform $duration-normal $ease-fluid;

  &:hover:not(:disabled) {
    background: var(--altbg);

    .option-arrow {
      transform: translateX(3px);
    }
  }

  &.active {
    background: var(--color-primary-soft);

    .option-icon {
      background: var(--gradient-brand);
      color: #fff;
    }

    strong {
      color: var(--primary-text);
    }
  }
}

.option-icon {
  @include flex-center;
  flex-shrink: 0;
  width: 38px;
  height: 38px;
  border-radius: $radius-md;
  background: var(--altbg);
  color: var(--primary);
  font-size: 1.2rem;
  transition: background-color $duration-normal $ease-fluid;
}

.option-text {
  display: flex;
  flex-direction: column;
  min-width: 0;

  strong {
    font-size: $text-sm;
  }

  small {
    color: var(--text-muted);
    font-size: $text-xs;
  }
}

.option-arrow {
  margin-left: auto;
  color: var(--text-muted);
  transition: transform $duration-normal $ease-fluid;
}

.security-refresh {
  align-self: flex-start;
}

.security-main {
  min-width: 0;

  > .account-section:first-child {
    margin-top: 0;
  }
}

// Sair e desativar lado a lado no computador.
.danger-grid {
  display: grid;
  gap: $space-4;

  @include from($bp-md) {
    grid-template-columns: 1fr 1fr;
  }

  :deep(.account-section) {
    margin: 0;
  }
}

.logout-section {
  border-color: rgba(239, 68, 68, 0.35);
}

.logout-action-btn {
  @include action-button;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 18px;
  border: 1px solid var(--danger, var(--danger));
  background: transparent;
  color: var(--danger, var(--danger));
  font-size: 0.94rem;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
}

.logout-action-btn:hover:not(:disabled) {
  background: var(--danger, var(--danger));
  color: var(--color-on-primary);
}

.logout-action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
