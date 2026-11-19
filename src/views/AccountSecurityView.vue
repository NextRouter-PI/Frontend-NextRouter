<script setup>
import { onMounted, ref } from 'vue'
import { state } from '@/stores/state'
import { http } from '@/api/client'
import { readAccount } from '@/api/account'
import { publishAccountSnapshot } from '@/stores/profileSnapshot'
import { sessionError } from '@/stores/session'
import { formatApiError } from '@/utils/apiErrors'
import { useAccountScope } from '@/composables/useAccountScope'
import PasswordResetForm from '@/components/auth/PasswordResetForm.vue'
import EmailChangeForm from '@/components/account/EmailChangeForm.vue'
import AccountSessions from '@/components/account/AccountSessions.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import ErrorMessage from '@/components/ui/ErrorMessage.vue'
import '@/assets/css/profile.css'

const scope = useAccountScope()
const account = ref(null)
const loading = ref(false)
const busy = ref(false)
const error = ref('')
const mode = ref('password')
async function refresh() {
  if (!scope.current() || busy.value || loading.value) return
  loading.value = true
  account.value = null
  error.value = ''
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
onMounted(refresh)
</script>

<template>
  <div class="account-workspace" :class="{ authenticated: state.logged }">
    <div class="account-content">
      <h1>Segurança da conta</h1>
      <p>Trocar senha, confirmar e-mail ou revogar todas as sessões exige entrar novamente. Nada será repetido automaticamente.</p>
      <div class="account-actions">
        <RouterLink to="/usuario">Voltar ao perfil</RouterLink>
        <BaseButton type="button" variant="outline" :disabled="busy || loading" @click="refresh">Atualizar conta e reiniciar o fluxo aberto</BaseButton>
      </div>
      <p v-if="loading" role="status">Consultando conta...</p>
      <div role="alert"><ErrorMessage :message="error" /></div>
      <template v-if="account && state.logged && account.id === state.user?.id">
        <p>{{ account.email }}</p>
        <div class="account-actions" aria-label="Operação de segurança">
          <BaseButton type="button" :variant="mode === 'password' ? 'primary' : 'outline'" :disabled="busy" @click="mode = 'password'">Senha</BaseButton>
          <BaseButton type="button" :variant="mode === 'email' ? 'primary' : 'outline'" :disabled="busy" @click="mode = 'email'">E-mail</BaseButton>
          <BaseButton type="button" :variant="mode === 'sessions' ? 'primary' : 'outline'" :disabled="busy" @click="mode = 'sessions'">Sessões</BaseButton>
        </div>
        <section class="account-section">
          <PasswordResetForm v-if="mode === 'password'" :key="`${account.id}:${account.email}:password`" :account-email="account.email" :signal="scope.signal" @busy="busy = $event" @confirmed="confirmed" />
          <EmailChangeForm v-else-if="mode === 'email'" :key="`${account.id}:email`" @busy="busy = $event" @confirmed="confirmed" />
          <AccountSessions v-else :key="`${account.id}:sessions`" @busy="busy = $event" @confirmed="confirmed" />
        </section>
      </template>
    </div>
  </div>
</template>
