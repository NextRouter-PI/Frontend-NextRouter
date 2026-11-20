<script setup>
import BaseInput from '@/components/ui/BaseInput.vue'

const form = defineModel('form', { type: Object, required: true })

defineProps({
  fieldErrors: { type: Object, required: true },
  disabled: { type: Boolean, default: false },
  isPasswordVisible: { type: Boolean, default: false },
  helpers: { type: Object, required: true },
})

const emit = defineEmits(['toggle-password'])
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
      @input="helpers.clearFieldError('ceoName')"
      @blur="helpers.validateField(form.ceoName, [(v) => helpers.requiredField(v, 'Nome')], 'ceoName')"
    />

    <BaseInput
      v-model="form.ceoCpf"
      label="CPF"
      required
      only-numbers
      placeholder="000.000.000-00"
      maxlength="14"
      :disabled="disabled"
      :format="helpers.formatCPF"
      :error="fieldErrors.ceoCpf"
      @input="helpers.clearFieldError('ceoCpf')"
      @blur="helpers.validateField(form.ceoCpf, [(v) => helpers.requiredField(v, 'CPF') || helpers.isCPF(v)], 'ceoCpf')"
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
      @input="helpers.clearFieldError('loginEmail')"
      @blur="
        helpers.validateField(
          form.loginEmail,
          [(v) => helpers.requiredField(v, 'Email de login') || helpers.isEmail(v)],
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
      :show-password="isPasswordVisible"
      :error="fieldErrors.password"
      @update:show-password="emit('toggle-password')"
      @input="helpers.clearFieldError('password')"
      @blur="
        helpers.validateField(
          form.password,
          [(v) => helpers.requiredField(v, 'Senha') || helpers.isStrongPassword(v)],
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
      :show-password="isPasswordVisible"
      :error="fieldErrors.passwordConfirm"
      @update:show-password="emit('toggle-password')"
      @input="helpers.clearFieldError('passwordConfirm')"
      @blur="
        helpers.validateField(
          form.passwordConfirm,
          [(v) => helpers.requiredField(v, 'Confirmação') || helpers.passwordMatch(v, form.password)],
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
