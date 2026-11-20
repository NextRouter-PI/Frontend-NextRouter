<script setup>
import { watch } from 'vue'
import { usePasswordReset } from '@/composables/usePasswordReset'
import FloatingInput from '@/components/ui/FloatingInput.vue'
import PasswordField from '@/components/ui/PasswordField.vue'
import CodeInput from '@/components/ui/CodeInput.vue'

const props = defineProps({
  accountEmail: { type: String, default: '' },
  signal: { type: Object, default: null },
})
const emit = defineEmits(['confirmed', 'busy'])
const {
  etapa, email, emailCodigo, codigo, novaSenha, confirmarSenha, erro, ocupado, cooldown,
  solicitarCodigo, verificarCodigo, redefinirSenha, voltarAoEmail, voltarAoCodigo,
} = usePasswordReset({ signal: props.signal })
email.value = props.accountEmail
watch(ocupado, (value) => emit('busy', value), { immediate: true, flush: 'sync' })
watch(etapa, (value) => { if (value === 4) emit('confirmed') }, { flush: 'sync' })
</script>

<template>
  <div class="reset-password-form">
    <Transition name="fade-slide" mode="out-in">
      <form v-if="etapa === 1" key="step-1" class="reset-step" @submit.prevent="solicitarCodigo">
        <div class="step-intro">
          <span class="mdi mdi-email-fast-outline step-icon" aria-hidden="true"></span>
          <p>Digite seu e-mail para enviarmos um código de verificação. A confirmação encerra as sessões anteriores.</p>
        </div>
        <FloatingInput
          v-model="email"
          label="E-mail"
          type="email"
          autocomplete="email"
          :disabled="ocupado || Boolean(accountEmail)"
        />
        <button type="submit" class="btn-primary-step" :disabled="ocupado">
          {{ ocupado ? 'Enviando...' : 'Enviar código' }}
        </button>
      </form>

      <form v-else-if="etapa === 2" key="step-2" class="reset-step" @submit.prevent="verificarCodigo">
        <p class="step-desc">
          Digite o código de verificação enviado para <strong>{{ emailCodigo }}</strong>.
        </p>
        <CodeInput v-model="codigo" :disabled="ocupado" />
        <p v-if="cooldown > 0" class="resend-row">Reenviar código em {{ cooldown }}s</p>
        <p v-else class="resend-row">
          Não recebeu?
          <button type="button" class="link-btn" :disabled="ocupado" @click="solicitarCodigo">
            Enviar novo código
          </button>
        </p>
        <button type="submit" class="btn-primary-step" :disabled="ocupado">
          {{ ocupado ? 'Verificando...' : 'Confirmar' }}
        </button>
        <button
          v-if="!accountEmail"
          type="button"
          class="btn-outline-step"
          :disabled="ocupado"
          @click="voltarAoEmail"
        >
          Usar outro e-mail
        </button>
      </form>

      <form v-else-if="etapa === 3" key="step-3" class="reset-step" @submit.prevent="redefinirSenha">
        <p class="step-desc">Digite sua nova senha abaixo.</p>
        <PasswordField v-model="novaSenha" label="Nova senha" autocomplete="new-password" :disabled="ocupado" />
        <PasswordField v-model="confirmarSenha" label="Confirme sua senha" autocomplete="new-password" :disabled="ocupado" />
        <button type="submit" class="btn-primary-step" :disabled="ocupado">
          {{ ocupado ? 'Salvando...' : 'Confirmar nova senha' }}
        </button>
        <button type="button" class="btn-outline-step" :disabled="ocupado" @click="voltarAoCodigo">
          Corrigir ou reenviar código
        </button>
      </form>

      <section v-else-if="etapa === 4" key="step-4" class="reset-step reset-done" role="status">
        <span class="mdi mdi-check-circle-outline done-icon" aria-hidden="true"></span>
        <p class="step-desc">Senha redefinida com sucesso! Entre novamente com a nova senha; as sessões anteriores foram encerradas.</p>
        <RouterLink to="/login" class="btn-primary-step done-link">Ir para login</RouterLink>
      </section>
    </Transition>

    <Transition name="fade-slide">
      <p v-if="erro" class="reset-error" role="alert">{{ erro }}</p>
    </Transition>
  </div>
</template>

<style scoped>
.reset-password-form {
  width: 100%;
  color: var(--text);
}

.reset-step {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.step-intro {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 6px;
}

.step-icon {
  font-size: 2rem;
  color: var(--primary);
  flex-shrink: 0;
  line-height: 1;
}

.step-intro p,
.step-desc {
  margin: 0 0 8px;
  font-size: 0.92rem;
  line-height: 1.5;
  color: var(--text-muted);
  text-align: center;
}

.step-intro p {
  text-align: left;
  margin-bottom: 0;
}

.step-desc strong {
  color: var(--text);
}

.resend-row {
  margin: 4px 0 8px;
  font-size: 0.84rem;
  color: var(--text-muted);
  text-align: center;
}

.link-btn {
  border: none;
  background: transparent;
  color: var(--primary);
  font-weight: 600;
  font-size: 0.84rem;
  cursor: pointer;
  padding: 0 4px;
}

.btn-primary-step {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 44px;
  padding: 10px 18px;
  border: none;
  border-radius: 10px;
  background: var(--primary);
  color: #ffffff;
  font-size: 0.94rem;
  font-weight: 700;
  text-decoration: none;
  cursor: pointer;
  transition: background-color 0.2s var(--ease-fluid), transform 0.16s var(--ease-fluid),
    box-shadow 0.2s var(--ease-fluid);
}

.btn-primary-step:hover:not(:disabled) {
  background: var(--primary-hover);
  box-shadow: var(--shadow-primary);
}

.btn-primary-step:active:not(:disabled) {
  transform: scale(0.98);
}

.btn-primary-step:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-outline-step {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 42px;
  padding: 9px 16px;
  border: 1.5px solid var(--border);
  border-radius: 10px;
  background: transparent;
  color: var(--text);
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  transition: border-color 0.2s var(--ease-fluid), color 0.2s var(--ease-fluid);
}

.btn-outline-step:hover:not(:disabled) {
  border-color: var(--primary);
  color: var(--primary);
}

.reset-done {
  align-items: center;
  text-align: center;
}

.done-icon {
  font-size: 3rem;
  color: var(--success);
}

.reset-error {
  margin: 12px 0 0;
  font-size: 0.86rem;
  font-weight: 500;
  color: var(--danger);
  text-align: center;
  white-space: pre-line;
}
</style>
