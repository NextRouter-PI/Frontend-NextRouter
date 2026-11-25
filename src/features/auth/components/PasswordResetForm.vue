<script setup>
import { watch } from 'vue'
import { ROUTE_PATHS } from '@/constants'
import { usePasswordReset } from '@/features/auth/composables/usePasswordReset'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import CodeInput from '@/components/ui/CodeInput.vue'
import ErrorMessage from '@/components/ui/ErrorMessage.vue'
import ResendCodeButton from '@/components/ui/ResendCodeButton.vue'
import PasswordStrength from '@/components/ui/PasswordStrength.vue'

const STEPS = [
  { icon: 'mdi-email-outline', label: 'E-mail' },
  { icon: 'mdi-shield-lock-outline', label: 'Código' },
  { icon: 'mdi-lock-reset', label: 'Nova senha' },
]

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
    <!-- As três etapas da recuperação, com a atual em destaque. -->
    <ol v-if="etapa < 4" class="reset-steps" aria-label="Etapas da recuperação">
      <li
        v-for="(step, i) in STEPS"
        :key="step.label"
        :class="{ active: etapa === i + 1, done: etapa > i + 1 }"
        :aria-current="etapa === i + 1 ? 'step' : undefined"
      >
        <span class="reset-step-dot"><BaseIcon :name="etapa > i + 1 ? 'mdi-check-bold' : step.icon" /></span>
        <span class="reset-step-label">{{ step.label }}</span>
      </li>
    </ol>

    <Transition name="fade-slide" mode="out-in">
      <form v-if="etapa === 1" key="step-1" class="reset-step" @submit.prevent="solicitarCodigo">
        <p class="step-desc">
          Digite seu e-mail para enviarmos um <strong>código de verificação</strong>. A confirmação encerra as
          sessões anteriores.
        </p>

        <BaseInput
          v-model="email"
          label="E-mail"
          type="email"
          autocomplete="email"
          placeholder="seu@email.com"
          required
          :disabled="ocupado || Boolean(accountEmail)"
        >
          <template #prefix><BaseIcon name="mdi-email-outline" /></template>
        </BaseInput>

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
        >
          <template #prefix><BaseIcon name="mdi-lock-outline" /></template>
        </BaseInput>
        <PasswordStrength :password="novaSenha" />

        <BaseInput
          v-model="confirmarSenha"
          type="password"
          label="Confirme sua senha"
          autocomplete="new-password"
          required
          :disabled="ocupado"
        >
          <template #prefix><BaseIcon name="mdi-lock-reset" /></template>
        </BaseInput>

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

// Indicador das etapas: ícones ligados por um risco que enche de laranja.
.reset-steps {
  display: flex;
  margin: 0 0 $space-5;
  padding: 0;
  list-style: none;

  li {
    position: relative;
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;

    &:not(:last-child)::after {
      content: '';
      position: absolute;
      top: 21px;
      left: calc(50% + 28px);
      right: calc(-50% + 28px);
      height: 3px;
      border-radius: 999px;
      background: linear-gradient(90deg, var(--primary) 50%, var(--border) 50%) 100% 0 / 200% 100%;
      transition: background-position 0.6s $ease-fluid;
    }

    &.done::after {
      background-position: 0 0;
    }
  }
}

.reset-step-dot {
  @include flex-center;
  width: 44px;
  height: 44px;
  border-radius: $radius-round;
  border: 2px solid var(--border);
  background: var(--color-surface);
  color: var(--text-muted);
  font-size: 1.2rem;
  transition:
    background-color 0.35s $ease-fluid,
    border-color 0.35s $ease-fluid,
    color 0.35s $ease-fluid,
    transform 0.45s $ease-spring;

  .active & {
    border-color: var(--primary);
    color: var(--primary);
    transform: scale(1.08);
  }

  .done & {
    border-color: var(--primary);
    background: var(--gradient-brand);
    color: #fff;
  }
}

.reset-step-label {
  font-size: $text-xs;
  font-weight: $font-semibold;
  color: var(--text-muted);

  .active &,
  .done & {
    color: var(--text);
  }
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
