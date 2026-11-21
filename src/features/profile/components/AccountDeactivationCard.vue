<script setup>
import { shallowRef } from 'vue'
import { deactivateAccount } from '@/api/account'
import { sessionError } from '@/stores/session'
import { formatApiError } from '@/utils/apiErrors'
import BaseButton from '@/components/ui/BaseButton.vue'
import ErrorMessage from '@/components/ui/ErrorMessage.vue'

const props = defineProps({
  accountEmail: { type: String, required: true },
  scope: { type: Object, required: true },
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits(['deactivated', 'deactivating'])

const confirming = shallowRef(false)
const confirmEmail = shallowRef('')
const deactivating = shallowRef(false)
const error = shallowRef('')

function toggleConfirm() {
  if (props.disabled || deactivating.value) return
  confirming.value = !confirming.value
  confirmEmail.value = ''
  error.value = ''
}

function reset() {
  confirming.value = false
  confirmEmail.value = ''
  error.value = ''
}

defineExpose({ reset })

async function handleDeactivate() {
  if (!props.scope.current() || props.disabled || deactivating.value) return
  if (confirmEmail.value.trim().toLowerCase() !== props.accountEmail.trim().toLowerCase()) {
    error.value = 'Digite exatamente o e-mail da sua conta para confirmar a desativação.'
    return
  }
  deactivating.value = true
  emit('deactivating', true)
  error.value = ''
  try {
    await deactivateAccount({ signal: props.scope.signal })
    if (props.scope.current()) emit('deactivated')
  } catch (cause) {
    if (props.scope.current()) {
      error.value = sessionError(cause, formatApiError(cause, 'Não foi possível desativar sua conta.'))
    }
  } finally {
    if (props.scope.current()) {
      deactivating.value = false
      emit('deactivating', false)
    }
  }
}
</script>

<template>
  <section class="account-section danger-section">
    <h2>Desativar conta</h2>
    <p class="account-hint">
      Desativar sua conta revoga imediatamente todas as sessões ativas e impede novos acessos.
      A ação não é permitida durante participação operacional em andamento.
    </p>
    <div v-if="!confirming" class="account-actions">
      <button
        type="button"
        class="logout-action-btn"
        :disabled="disabled || deactivating"
        @click="toggleConfirm"
      >
        <span class="mdi mdi-account-off-outline" aria-hidden="true"></span>
        <span>Desativar minha conta</span>
      </button>
    </div>
    <form v-else class="deactivate-form" @submit.prevent="handleDeactivate">
      <label class="deactivate-label" for="deactivate-confirm-email">
        Digite <strong>{{ accountEmail }}</strong> para confirmar a desativação:
      </label>
      <input
        id="deactivate-confirm-email"
        v-model="confirmEmail"
        type="email"
        class="deactivate-input"
        autocomplete="off"
        :placeholder="accountEmail"
        :disabled="deactivating"
        required
      />
      <div role="alert"><ErrorMessage :message="error" /></div>
      <div class="account-actions">
        <BaseButton
          type="button"
          variant="outline"
          :disabled="deactivating"
          @click="toggleConfirm"
        >
          Cancelar
        </BaseButton>
        <button type="submit" class="deactivate-submit-btn" :disabled="deactivating">
          {{ deactivating ? 'Desativando...' : 'Confirmar desativação' }}
        </button>
      </div>
    </form>
  </section>
</template>

<style lang="scss" scoped>
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

  &:hover:not(:disabled) {
    background: var(--danger, var(--danger));
    color: var(--color-on-primary);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}
</style>
