<script setup>
import CodeInput from '@/components/ui/CodeInput.vue'

const code = defineModel({ type: Array, required: true })

defineProps({
  email: { type: String, required: true },
  cooldown: { type: Number, default: 0 },
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits(['resend'])
</script>

<template>
  <div class="verification-step">
    <h2 class="step-title">
      Verificação de <span class="step-highlight">E-mail</span>
    </h2>
    <p class="step-description">
      Se o e-mail puder ser usado no cadastro, você receberá um código em
      <strong>{{ email }}</strong>. Digite os seis dígitos abaixo.
    </p>

    <CodeInput v-model="code" :disabled="disabled" />

    <p class="resend-row">
      <template v-if="cooldown > 0">Reenviar código em {{ cooldown }}s</template>
      <template v-else>
        Não recebeu?
        <button type="button" class="resend-btn" :disabled="disabled" @click="emit('resend')">
          Enviar novo código
        </button>
      </template>
    </p>
  </div>
</template>

<style lang="scss" scoped>
.verification-step {
  display: flex;
  flex-direction: column;
  gap: $space-4;
  text-align: center;
}

.step-title {
  font-size: 1.25rem;
  font-weight: $font-bold;
  color: var(--text);
}

.step-highlight {
  color: var(--primary);
}

.step-description {
  color: var(--text-muted);
  font-size: $text-md;
  line-height: 1.5;

  strong {
    color: var(--text);
  }
}

.resend-row {
  color: var(--text-muted);
  font-size: $text-sm;
}

.resend-btn {
  color: var(--primary);
  font-weight: $font-semibold;
  padding: 0 $space-1;

  &:hover:not(:disabled) {
    text-decoration: underline;
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
}
</style>
