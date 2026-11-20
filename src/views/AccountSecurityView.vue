<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { state } from '@/stores/state'
import { http } from '@/api/client'
import { deactivateAccount, readAccount } from '@/api/account'
import { publishAccountSnapshot } from '@/stores/profileSnapshot'
import { sessionError } from '@/stores/session'
import { formatApiError } from '@/utils/apiErrors'
import { useAccountScope } from '@/composables/useAccountScope'
import PasswordResetForm from '@/features/auth/components/PasswordResetForm.vue'
import EmailChangeForm from '@/features/profile/components/EmailChangeForm.vue'
import AccountSessions from '@/features/profile/components/AccountSessions.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import ErrorMessage from '@/components/ui/ErrorMessage.vue'
import SkeletonCard from '@/components/ui/SkeletonCard.vue'

const router = useRouter()
const scope = useAccountScope()
const account = ref(null)
const loading = ref(false)
const busy = ref(false)
const error = ref('')
const mode = ref('password')
const confirmingDeactivate = ref(false)
const deactivateEmail = ref('')
const deactivating = ref(false)
const deactivateError = ref('')

async function refresh() {
  if (!scope.current() || busy.value || loading.value || deactivating.value) return
  loading.value = true
  account.value = null
  error.value = ''
  confirmingDeactivate.value = false
  deactivateEmail.value = ''
  deactivateError.value = ''
  try {
    const data = await readAccount({ signal: scope.signal })
    if (scope.current() && publishAccountSnapshot(scope.ownerId, data)) account.value = data
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

function toggleDeactivateConfirm() {
  if (busy.value || deactivating.value) return
  confirmingDeactivate.value = !confirmingDeactivate.value
  deactivateEmail.value = ''
  deactivateError.value = ''
}

async function handleDeactivate() {
  if (!scope.current() || busy.value || deactivating.value || !account.value) return
  if (deactivateEmail.value.trim().toLowerCase() !== account.value.email.trim().toLowerCase()) {
    deactivateError.value = 'Digite exatamente o e-mail da sua conta para confirmar a desativação.'
    return
  }
  deactivating.value = true
  deactivateError.value = ''
  try {
    await deactivateAccount({ signal: scope.signal })
    if (scope.current()) http.confirmSessionRevocation()
  } catch (cause) {
    if (scope.current()) {
      deactivateError.value = sessionError(
        cause,
        formatApiError(cause, 'Não foi possível desativar sua conta.'),
      )
    }
  } finally {
    if (scope.current()) deactivating.value = false
  }
}

onMounted(refresh)
</script>

<template>
  <div class="security-tab">
    <h1>Segurança da conta</h1>
    <p>Trocar senha, confirmar e-mail ou revogar todas as sessões exige entrar novamente. Nada será repetido automaticamente.</p>
    <div class="account-actions">
      <BaseButton type="button" variant="outline" :disabled="busy || loading" @click="refresh">Atualizar conta e reiniciar o fluxo aberto</BaseButton>
    </div>
    <SkeletonCard v-if="loading" :count="1" :lines="4" />
    <div role="alert"><ErrorMessage :message="error" /></div>
    <template v-if="account && state.logged && account.id === state.user?.id">
      <p>{{ account.email }}</p>
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
          <span class="mdi mdi-logout" aria-hidden="true"></span>
          <span>Sair da conta</span>
        </button>
      </div>
    </section>

    <section
      v-if="account && state.logged && account.id === state.user?.id"
      class="account-section danger-section"
    >
      <h2>Desativar conta</h2>
      <p class="account-hint">
        Desativar sua conta revoga imediatamente todas as sessões ativas e impede novos acessos.
        A ação não é permitida durante participação operacional em andamento.
      </p>
      <div v-if="!confirmingDeactivate" class="account-actions">
        <button
          type="button"
          class="logout-action-btn"
          :disabled="busy || deactivating"
          @click="toggleDeactivateConfirm"
        >
          <span class="mdi mdi-account-off-outline" aria-hidden="true"></span>
          <span>Desativar minha conta</span>
        </button>
      </div>
      <form v-else class="deactivate-form" @submit.prevent="handleDeactivate">
        <label class="deactivate-label" for="deactivate-confirm-email">
          Digite <strong>{{ account.email }}</strong> para confirmar a desativação:
        </label>
        <input
          id="deactivate-confirm-email"
          v-model="deactivateEmail"
          type="email"
          class="deactivate-input"
          autocomplete="off"
          :placeholder="account.email"
          :disabled="deactivating"
          required
        />
        <div role="alert"><ErrorMessage :message="deactivateError" /></div>
        <div class="account-actions">
          <BaseButton
            type="button"
            variant="outline"
            :disabled="deactivating"
            @click="toggleDeactivateConfirm"
          >
            Cancelar
          </BaseButton>
          <button type="submit" class="deactivate-submit-btn" :disabled="deactivating">
            {{ deactivating ? 'Desativando...' : 'Confirmar desativação' }}
          </button>
        </div>
      </form>
    </section>
  </div>
</template>

<style lang="scss" scoped>
.logout-section,
.danger-section {
  border-color: rgba(239, 68, 68, 0.35);
}

.deactivate-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 12px;
}

.deactivate-label {
  font-size: 0.9rem;
  color: var(--text);
}

.deactivate-input {
  width: 100%;
  max-width: 380px;
  padding: 10px 14px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--bg);
  color: var(--text);
  font-size: 0.94rem;
}

.deactivate-submit-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 18px;
  border-radius: 10px;
  border: 1px solid var(--danger, var(--danger));
  background: var(--danger, var(--danger));
  color: var(--color-on-primary);
  font-size: 0.94rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s ease;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
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
