<script setup>
import { watch } from 'vue'
import { useEmailChange } from '@/features/profile/composables/useEmailChange'
import BaseInput from '@/components/ui/BaseInput.vue'
import CodeInput from '@/components/ui/CodeInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import ErrorMessage from '@/components/ui/ErrorMessage.vue'

const emit = defineEmits(['confirmed', 'busy'])
const {
  step,
  newEmail,
  requestedEmail,
  code,
  password,
  busy,
  blocked,
  error,
  cooldown,
  request,
  verify,
  confirm,
  back,
} = useEmailChange()

watch(busy, (value) => emit('busy', value), { immediate: true, flush: 'sync' })
watch(step, (value) => {
  if (value === 4) emit('confirmed')
}, { flush: 'sync' })
</script>

<template>
  <div>
    <p>A troca exige acesso ao novo e-mail e sua senha atual. A confirmação revoga todas as sessões.</p>
    <form v-if="step === 1" @submit.prevent="request">
      <BaseInput v-model="newEmail" label="Novo e-mail de acesso" type="email" required :disabled="busy" />
      <BaseButton type="submit" :loading="busy">Solicitar código</BaseButton>
    </form>
    <form v-else-if="step === 2" @submit.prevent="verify">
      <p>
        Se o endereço {{ requestedEmail }} for elegível, você receberá um código. A solicitação não confirma disponibilidade.
      </p>
      <CodeInput v-model="code" :disabled="busy" />
      <p v-if="cooldown > 0">Reenvio em {{ cooldown }}s</p>
      <div class="account-actions">
        <BaseButton type="submit" :loading="busy">Verificar código</BaseButton>
        <BaseButton variant="outline" :disabled="busy || cooldown > 0" @click="request">Reenviar</BaseButton>
      </div>
    </form>
    <form v-else-if="step === 3" @submit.prevent="confirm">
      <p>
        Confirme somente com o código da solicitação mais recente iniciada aqui para {{ requestedEmail }}. Se solicitou outra troca em outra aba ou dispositivo, reinicie este fluxo.
      </p>
      <BaseInput
        v-model="password"
        type="password"
        label="Senha atual"
        autocomplete="current-password"
        required
        :disabled="busy || blocked"
      />
      <BaseButton type="submit" :loading="busy" :disabled="blocked">
        Confirmar novo e-mail e encerrar sessões
      </BaseButton>
    </form>
    <BaseButton v-if="step === 2 || step === 3" variant="outline" :disabled="busy || blocked" @click="back">
      Corrigir endereço ou código
    </BaseButton>
    <div role="alert"><ErrorMessage :message="error" /></div>
  </div>
</template>
