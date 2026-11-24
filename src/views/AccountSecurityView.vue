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
import PageHeader from '@/components/ui/PageHeader.vue'
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

async function handleLogout() {
  await router.push({ name: 'logout' })
}

onMounted(refresh)
</script>

<template>
  <div class="security-tab">
    <PageHeader
      title="Segurança da conta"
      subtitle="Trocar senha, confirmar e-mail ou revogar todas as sessões exige entrar novamente. Nada será repetido automaticamente."
    >
      <template #actions>
        <BaseButton type="button" variant="outline" size="sm" :disabled="busy || loading" @click="refresh">
          <BaseIcon name="mdi-refresh" /> Recarregar
        </BaseButton>
      </template>
    </PageHeader>
    <SkeletonCard v-if="loading" :count="1" :lines="4" />
    <div role="alert"><ErrorMessage :message="error" /></div>
    <template v-if="account && auth.logged && account.id === auth.user?.id">
      <p class="account-email"><BaseIcon name="mdi-email-fast-outline" /> {{ account.email }}</p>
      <div class="account-actions" aria-label="Operação de segurança">
        <BaseButton type="button" :variant="mode === 'password' ? 'primary' : 'outline'" :disabled="busy" @click="mode = 'password'">Senha</BaseButton>
        <BaseButton type="button" :variant="mode === 'email' ? 'primary' : 'outline'" :disabled="busy" @click="mode = 'email'">E-mail</BaseButton>
        <BaseButton type="button" :variant="mode === 'sessions' ? 'primary' : 'outline'" :disabled="busy" @click="mode = 'sessions'">Sessões</BaseButton>
      </div>
      <section class="account-section">
        <Transition name="fade-slide" mode="out-in">
          <PasswordResetForm v-if="mode === 'password'" :key="`${account.id}:${account.email}:password`" :account-email="account.email" :signal="scope.signal" @busy="busy = $event" @confirmed="confirmed" />
          <EmailChangeForm v-else-if="mode === 'email'" :key="`${account.id}:email`" @busy="busy = $event" @confirmed="confirmed" />
          <AccountSessions v-else :key="`${account.id}:sessions`" @busy="busy = $event" @confirmed="confirmed" />
        </Transition>
      </section>
    </template>

    <section class="account-section logout-section">
      <h2>Encerrar sessão</h2>
      <p class="account-hint">Saia da sua conta neste dispositivo quando terminar de usar o NextRouter.</p>
      <div class="account-actions">
        <button type="button" class="logout-action-btn" :disabled="busy || deactivating" @click="handleLogout">
          <BaseIcon name="mdi-logout" />
          <span>Sair da conta</span>
        </button>
      </div>
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
</template>

<style lang="scss" scoped>
.logout-section {
  border-color: rgba(239, 68, 68, 0.35);
}

.logout-action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 18px;
  border-radius: 10px;
  border: 1px solid var(--danger, var(--danger));
  background: transparent;
  color: var(--danger, var(--danger));
  font-size: 0.94rem;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  transition: background-color 0.2s ease, color 0.2s ease;
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
