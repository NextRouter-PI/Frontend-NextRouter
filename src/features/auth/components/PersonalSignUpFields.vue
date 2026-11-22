<script setup>
import BaseInput from '@/components/ui/BaseInput.vue'
import DateInput from '@/components/ui/DateInput.vue'
import AddressCepMapField from '@/components/ui/AddressCepMapField.vue'
import { formatCEP, formatCPF, formatPhone } from '@/composables/useInputFormat'
import { isCEP, isCPF, isEmail, isPhone, isStrongPassword, passwordMatch, requiredField } from '@/utils/validators'

const form = defineModel('form', { type: Object, required: true })

defineProps({
  fieldErrors: { type: Object, required: true },
  disabled: { type: Boolean, default: false },
  days: { type: Array, required: true },
  months: { type: Array, required: true },
  years: { type: Array, required: true },
  validateField: { type: Function, required: true },
  clearFieldError: { type: Function, required: true },
  clearBirthdayErrors: { type: Function, required: true },
})
</script>

<template>
  <div class="personal-fields">
    <BaseInput
      v-model="form.name"
      label="Nome completo"
      required
      placeholder="Digite seu nome completo"
      :disabled="disabled"
      :error="fieldErrors.name"
      @input="clearFieldError('name')"
      @blur="validateField(form.name, [(v) => requiredField(v, 'Nome completo')], 'name')"
    />

    <DateInput
      v-model:day="form.day"
      v-model:month="form.month"
      v-model:year="form.year"
      :days="days"
      :months="months"
      :years="years"
      required
      :disabled="disabled"
      :day-error="fieldErrors.day"
      :month-error="fieldErrors.month"
      :year-error="fieldErrors.year"
      @update:day="clearBirthdayErrors"
      @update:month="clearBirthdayErrors"
      @update:year="clearBirthdayErrors"
    />

    <BaseInput
      v-model="form.cpf"
      label="CPF"
      required
      only-numbers
      placeholder="000.000.000-00"
      maxlength="14"
      :disabled="disabled"
      :format="formatCPF"
      :error="fieldErrors.cpf"
      @input="clearFieldError('cpf')"
      @blur="validateField(form.cpf, [(v) => requiredField(v, 'CPF') || isCPF(v)], 'cpf')"
    />

    <BaseInput
      v-model="form.email"
      label="E-mail"
      required
      type="email"
      autocomplete="email"
      placeholder="seu@email.com"
      :disabled="disabled"
      :error="fieldErrors.email"
      @input="clearFieldError('email')"
      @blur="validateField(form.email, [(v) => requiredField(v, 'Email') || isEmail(v)], 'email')"
    />

    <BaseInput
      v-model="form.phone"
      label="Telefone"
      only-numbers
      placeholder="(00) 90000-0000"
      maxlength="16"
      :disabled="disabled"
      :format="formatPhone"
      :error="fieldErrors.phone"
      @input="clearFieldError('phone')"
      @blur="validateField(form.phone, [(v) => isPhone(v)], 'phone')"
    />

    <AddressCepMapField
      v-model:cep="form.cep"
      v-model:street="form.street"
      v-model:number="form.number"
      v-model:complement="form.complement"
      v-model:neighborhood="form.neighborhood"
      v-model:city="form.city"
      v-model:state="form.state"
      v-model:latitude="form.latitude"
      v-model:longitude="form.longitude"
      :disabled="disabled"
      :cep-error="fieldErrors.cep"
      :format-cep="formatCEP"
      complement-placeholder="Bloco, condomínio, apto..."
      @cep-input="clearFieldError('cep')"
      @cep-blur="validateField(form.cep, [(v) => requiredField(v, 'CEP') || isCEP(v)], 'cep')"
    />

    <BaseInput
      v-model="form.password"
      type="password"
      label="Senha"
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
      v-model="form.confirmPassword"
      type="password"
      label="Confirmar senha"
      required
      autocomplete="new-password"
      placeholder="Digite a senha novamente"
      :disabled="disabled"
      :error="fieldErrors.confirmPassword"
      @input="clearFieldError('confirmPassword')"
      @blur="
        validateField(
          form.confirmPassword,
          [(v) => requiredField(v, 'Confirmação') || passwordMatch(v, form.password)],
          'confirmPassword',
        )
      "
    />

    <slot name="extra-fields" />
  </div>
</template>
