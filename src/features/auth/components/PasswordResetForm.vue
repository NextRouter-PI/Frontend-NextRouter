<script setup>
import { watch } from 'vue'
import { ROUTE_PATHS } from '@/constants'
import { usePasswordReset } from '@/features/auth/composables/usePasswordReset'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import CodeInput from '@/components/ui/CodeInput.vue'
import ErrorMessage from '@/components/ui/ErrorMessage.vue'
import ResendCodeButton from '@/components/ui/ResendCodeButton.vue'

const props = defineProps({
  accountEmail: { type: String, default: '' },
  signal: { type: Object, default: null },
})
const emit = defineEmits(['confirmed', 'busy'])

const {
  etapa,
  email,
  emailCodigo,
  codigo,
  novaSenha,
  confirmarSenha,
  erro,
  ocupado,
  reenviando,
  cooldown,
  solicitarCodigo,
  verificarCodigo,
  redefinirSenha,
  voltarAoEmail,
  voltarAoCodigo,
} = usePasswordReset({ signal: props.signal })

email.value = props.accountEmail
watch(ocupado, (value) => emit('busy', value), { immediate: true, flush: 'sync' })
watch(etapa, (value) => {
  if (value === 4) emit('confirmed')
}, { flush: 'sync' })
</script>

<template>
  <div class="reset-password-form">
    <Transition name="fade-slide" mode="out-in">
      <form v-if="etapa === 1" key="step-1" class="reset-step" @submit.prevent="solicitarCodigo">
        <div class="step-intro">
          <BaseIcon name="mdi-email-fast-outline" class="step-icon" />
          <p>
            Digite seu e-mail para enviarmos um código de verificação. A confirmação encerra as sessões anteriores.
          </p>
        </div>

        <BaseInput
          v-model="email"
          label="E-mail"
          type="email"
          autocomplete="email"
          required
          :disabled="ocupado || Boolean(accountEmail)"
        />

        <BaseButton type="submit" block size="lg" :loading="ocupado">
          {{ ocupado ? 'Enviando...' : 'Enviar código' }}
        </BaseButton>
      </form>

      <form v-else-if="etapa === 2" key="step-2" class="reset-step" @submit.prevent="verificarCodigo">
        <p class="step-desc">
          Digite o código de verificação enviado para <strong>{{ emailCodigo }}</strong>.
        </p>

        <CodeInput v-model="codigo" :disabled="ocupado" />

        <ResendCodeButton
          :cooldown="cooldown"
          :loading="reenviando"
          :disabled="ocupado"
          @resend="solicitarCodigo"
        />

        <BaseButton
          type="submit"
          block
          size="lg"
          :loading="ocupado && !reenviando"
          :disabled="reenviando"
        >
          {{ ocupado && !reenviando ? 'Verificando...' : 'Confirmar' }}
        </BaseButton>

        <BaseButton v-if="!accountEmail" variant="outline" block :disabled="ocupado" @click="voltarAoEmail">
          Usar outro e-mail
        </BaseButton>
      </form>

      <form v-else-if="etapa === 3" key="step-3" class="reset-step" @submit.prevent="redefinirSenha">
        <p class="step-desc">Digite sua nova senha abaixo.</p>

        <BaseInput
          v-model="novaSenha"
          type="password"
          label="Nova senha"
          autocomplete="new-password"
          required
          :disabled="ocupado"
        />

        <BaseInput
          v-model="confirmarSenha"
          type="password"
          label="Confirme sua senha"
          autocomplete="new-password"
          required
          :disabled="ocupado"
        />

        <BaseButton type="submit" block size="lg" :loading="ocupado">
          {{ ocupado ? 'Salvando...' : 'Confirmar nova senha' }}
        </BaseButton>

        <BaseButton variant="outline" block :disabled="ocupado" @click="voltarAoCodigo">
          Corrigir ou reenviar código
        </BaseButton>
      </form>

      <section v-else-if="etapa === 4" key="step-4" class="reset-step reset-done" role="status">
        <BaseIcon name="mdi-check-circle-outline" class="done-icon" />
        <p class="step-desc">
          Senha redefinida com sucesso! Entre novamente com a nova senha; as sessões anteriores foram encerradas.
        </p>
        <RouterLink :to="ROUTE_PATHS.LOGIN" class="done-link">Ir para login</RouterLink>
      </section>
    </Transition>

    <ErrorMessage :message="erro" />
  </div>
</template>

<style lang="scss" scoped>
.reset-password-form {
  width: 100%;
  color: var(--text);
}

.reset-step {
  display: flex;
  flex-direction: column;
  gap: $space-3;
}

.step-intro {
  display: flex;
  align-items: flex-start;
  gap: $space-3;
  margin-bottom: $space-2;

  p {
    font-size: $text-md;
    line-height: 1.5;
    color: var(--text-muted);
  }
}

.step-icon {
  font-size: 2rem;
  color: var(--primary);
  flex-shrink: 0;
  line-height: 1;
}

.step-desc {
  font-size: $text-md;
  line-height: 1.5;
  color: var(--text-muted);
  text-align: center;

  strong {
    color: var(--text);
  }
}

.reset-done {
  align-items: center;
  padding: $space-3 0;
}

.done-icon {
  font-size: 3rem;
  color: var(--success);
}

.done-link {
  @include flex-center;
  width: 100%;
  min-height: 44px;
  padding: 10px 18px;
  border-radius: $radius-md;
  background: var(--primary);
  color: var(--color-on-primary);
  font-weight: $font-semibold;
  transition: background-color $duration-normal $ease-fluid;

  &:hover {
    background: var(--primary-hover);
  }
}
</style>
