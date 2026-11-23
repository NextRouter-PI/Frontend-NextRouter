<script setup>
import { onMounted, ref, watch } from 'vue'
import { readSessions, revokeOtherSession, revokeAllSessions } from '@/api/account'
import { useAccountScope } from '@/composables/useAccountScope'
import { sessionError } from '@/stores/session'
import { formatApiError } from '@/utils/apiErrors'
import BaseButton from '@/components/ui/BaseButton.vue'
import ErrorMessage from '@/components/ui/ErrorMessage.vue'

const emit = defineEmits(['confirmed', 'busy'])
const scope = useAccountScope()
const sessions = ref([])
const busy = ref(false)
const ready = ref(false)
const error = ref('')
const notice = ref('')
const selection = ref(null)
watch(busy, (value) => emit('busy', value), { immediate: true, flush: 'sync' })

async function read() {
  ready.value = false
  selection.value = null
  sessions.value = []
  try {
    const data = await readSessions({ signal: scope.signal })
    if (!scope.current()) return
    sessions.value = data
    ready.value = true
  } catch (cause) {
    if (scope.current()) error.value = sessionError(cause, formatApiError(cause, 'Não foi possível consultar as sessões.'))
  }
}
async function refresh() {
  if (!scope.current() || busy.value) return
  busy.value = true
  error.value = ''
  try { await read() } finally { if (scope.current()) busy.value = false }
}
async function revoke() {
  if (!scope.current() || busy.value || !ready.value || !selection.value) return
  const target = selection.value
  if (target !== 'all' && !sessions.value.some((session) => session.id === target && !session.current)) return
  busy.value = true
  ready.value = false
  error.value = ''
  notice.value = ''
  try {
    if (target === 'all') {
      await revokeAllSessions({ signal: scope.signal })
      if (scope.current()) emit('confirmed')
    } else {
      await revokeOtherSession(target, { signal: scope.signal })
      if (!scope.current()) return
      notice.value = 'Revogação confirmada pelo servidor.'
      await read()
    }
  } catch (cause) {
    if (scope.current()) {
      error.value = sessionError(cause, formatApiError(cause, 'Não foi possível confirmar a revogação.'))
      if (!cause.response || cause.response.status >= 500) error.value += ' O resultado é incerto.'
      error.value += ' A operação não foi repetida. Atualize a consulta antes de tentar novamente.'
    }
  } finally {
    if (scope.current()) busy.value = false
  }
}
onMounted(refresh)
</script>

<template>
  <div>
    <BaseButton type="button" variant="outline" :disabled="busy" @click="refresh">Atualizar sessões</BaseButton>
    <p v-if="busy" role="status">Consultando ou alterando sessões...</p>
    <p v-if="notice" class="account-notice" role="status">{{ notice }}</p>
    <div role="alert"><ErrorMessage :message="error" /></div>
    <template v-if="ready">
      <p v-if="!sessions.length">Nenhuma sessão retornada pelo servidor.</p>
      <section v-for="session in sessions" :key="session.id" class="account-section">
        <h3>{{ session.device }}</h3>
        <p>{{ session.current ? 'Sessão atual' : 'Outro dispositivo' }} · IP {{ session.ip || 'não informado' }}</p>
        <p>Iniciada em {{ new Date(session.created_at).toLocaleString('pt-BR') }}</p>
        <BaseButton v-if="!session.current" type="button" variant="outline" :disabled="busy" @click="selection = session.id">Revogar esta sessão</BaseButton>
        <RouterLink v-else class="account-link" to="/logout">Sair desta sessão</RouterLink>
      </section>
      <BaseButton type="button" variant="outline" :disabled="busy" @click="selection = 'all'">Revogar todas as sessões</BaseButton>
    </template>
    <form v-if="selection && ready" class="account-section" @submit.prevent="revoke">
      <p>{{ selection === 'all' ? 'Encerrar todas as sessões, inclusive esta? Você precisará entrar novamente.' : 'Revogar o acesso do dispositivo selecionado?' }}</p>
      <div class="account-actions">
        <BaseButton type="submit" :loading="busy">Confirmar revogação</BaseButton>
        <BaseButton type="button" variant="outline" :disabled="busy" @click="selection = null">Cancelar</BaseButton>
      </div>
    </form>
  </div>
</template>
