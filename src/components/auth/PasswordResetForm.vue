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
    <form v-if="etapa === 1" @submit.prevent="solicitarCodigo">
      <p>Solicite um código de verificação para definir uma nova senha. A confirmação encerra as sessões anteriores.</p>
      <FloatingInput v-model="email" label="E-mail" type="email" autocomplete="email" :disabled="ocupado || Boolean(accountEmail)" />
      <button type="submit" :disabled="ocupado">{{ ocupado ? 'Solicitando...' : 'Enviar código' }}</button>
    </form>
    <form v-if="etapa === 2" @submit.prevent="verificarCodigo">
      <p>Se houver uma conta elegível para <strong>{{ emailCodigo }}</strong>, você receberá um código. Digite os seis dígitos abaixo.</p>
      <CodeInput v-model="codigo" :disabled="ocupado" />
      <p v-if="cooldown > 0">Reenviar código em {{ cooldown }}s</p>
      <button v-else type="button" :disabled="ocupado" @click="solicitarCodigo">Enviar novo código</button>
      <button type="submit" :disabled="ocupado">{{ ocupado ? 'Verificando...' : 'Confirmar código' }}</button>
      <button v-if="!accountEmail" type="button" :disabled="ocupado" @click="voltarAoEmail">Usar outro e-mail</button>
    </form>
    <form v-if="etapa === 3" @submit.prevent="redefinirSenha">
      <p>Digite sua nova senha.</p>
      <PasswordField v-model="novaSenha" label="Nova senha" autocomplete="new-password" :disabled="ocupado" />
      <PasswordField v-model="confirmarSenha" label="Confirme sua senha" autocomplete="new-password" :disabled="ocupado" />
      <button type="submit" :disabled="ocupado">{{ ocupado ? 'Enviando...' : 'Redefinir senha e encerrar sessões' }}</button>
      <button type="button" :disabled="ocupado" @click="voltarAoCodigo">Corrigir ou reenviar código</button>
    </form>
    <section v-if="etapa === 4" role="status">
      <p>Senha redefinida. Entre novamente com a nova senha; as sessões anteriores foram encerradas.</p>
      <RouterLink to="/login">Ir para login</RouterLink>
    </section>
    <p v-if="erro" class="reset-error" role="alert">{{ erro }}</p>
  </div>
</template>

<style scoped>
.reset-password-form { width: 100%; color: var(--text); }
.reset-password-form p { margin-bottom: 20px; line-height: 1.6; }
.reset-password-form button {
  display: block; width: 100%; padding: 10px; margin: 10px 0;
  border: none; border-radius: 8px; background: var(--primary); color: white;
  font-weight: 600; cursor: pointer;
}
.reset-password-form button:disabled { opacity: 0.6; cursor: not-allowed; }
.reset-error { color: var(--danger); white-space: pre-line; }
</style>
