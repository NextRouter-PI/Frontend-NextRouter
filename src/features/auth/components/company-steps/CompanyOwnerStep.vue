<script setup>
import BaseInput from '@/components/ui/BaseInput.vue'
import { formatCPF } from '@/composables/useInputFormat'
import { isCPF, isEmail, isStrongPassword, passwordMatch, requiredField } from '@/utils/validators'

const form = defineModel('form', { type: Object, required: true })

defineProps({
  fieldErrors: { type: Object, required: true },
  disabled: { type: Boolean, default: false },
  validateField: { type: Function, required: true },
  clearFieldError: { type: Function, required: true },
})
</script>

<template>
  <div>
    <h2 class="step-heading">Responsável pela <span class="step-accent">Empresa</span></h2>

    <BaseInput
      v-model="form.ceoName"
      label="Nome Completo do CEO / diretor / sócio administrador"
      required
      placeholder="Digite o nome completo"
      :disabled="disabled"
      :error="fieldErrors.ceoName"
      @input="clearFieldError('ceoName')"
      @blur="validateField(form.ceoName, [(v) => requiredField(v, 'Nome')], 'ceoName')"
    />

    <BaseInput
      v-model="form.ceoCpf"
      label="CPF"
      required
      only-numbers
      placeholder="000.000.000-00"
      maxlength="14"
      :disabled="disabled"
      :format="formatCPF"
      :error="fieldErrors.ceoCpf"
      @input="clearFieldError('ceoCpf')"
      @blur="validateField(form.ceoCpf, [(v) => requiredField(v, 'CPF') || isCPF(v)], 'ceoCpf')"
    />

    <BaseInput
      v-model="form.loginEmail"
      label="E-mail de Login"
      type="email"
      required
      autocomplete="email"
      placeholder="empresa@login.com"
      :disabled="disabled"
      :error="fieldErrors.loginEmail"
      @input="clearFieldError('loginEmail')"
      @blur="
        validateField(
          form.loginEmail,
          [(v) => requiredField(v, 'Email de login') || isEmail(v)],
          'loginEmail',
        )
      "
    />

    <BaseInput
      v-model="form.password"
      type="password"
      label="Defina uma senha"
      required
      autocomplete="new-password"
      placeholder="Mínimo 8 caracteres, não só números"
      :disabled="disabled"
      :error="fieldErrors.password"
      @input="clearFieldError('password')"
      @blur="
        validateField(
          form.password,
          [(v) => requiredField(v, 'Senha') || isStrongPassword(v)],
          'password',
        )
      "
    />

    <BaseInput
      v-model="form.passwordConfirm"
      type="password"
      label="Confirmar senha"
      required
      autocomplete="new-password"
      placeholder="Digite a senha novamente"
      :disabled="disabled"
      :error="fieldErrors.passwordConfirm"
      @input="clearFieldError('passwordConfirm')"
      @blur="
        validateField(
          form.passwordConfirm,
          [(v) => requiredField(v, 'Confirmação') || passwordMatch(v, form.password)],
          'passwordConfirm',
        )
      "
    />
  </div>
</template>

<style lang="scss" scoped>
.step-heading {
  font-size: 1.25rem;
  font-weight: $font-bold;
  text-align: center;
  margin-bottom: $space-4;
}

.step-accent {
  color: var(--primary);
}
</style>
