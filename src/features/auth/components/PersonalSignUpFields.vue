<script setup>
import BaseInput from '@/components/ui/BaseInput.vue'
import DateInput from '@/components/ui/DateInput.vue'
import AddressCepMapField from '@/components/ui/AddressCepMapField.vue'

const form = defineModel('form', { type: Object, required: true })

defineProps({
  fieldErrors: { type: Object, required: true },
  disabled: { type: Boolean, default: false },
  days: { type: Array, required: true },
  months: { type: Array, required: true },
  years: { type: Array, required: true },
  isPasswordVisible: { type: Boolean, default: false },
  helpers: { type: Object, required: true },
})

const emit = defineEmits(['toggle-password'])
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
      @input="helpers.clearFieldError('name')"
      @blur="helpers.validateField(form.name, [(v) => helpers.requiredField(v, 'Nome completo')], 'name')"
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
      @update:day="helpers.clearBirthdayErrors"
      @update:month="helpers.clearBirthdayErrors"
      @update:year="helpers.clearBirthdayErrors"
    />

    <BaseInput
      v-model="form.cpf"
      label="CPF"
      required
      only-numbers
      placeholder="000.000.000-00"
      maxlength="14"
      :disabled="disabled"
      :format="helpers.formatCPF"
      :error="fieldErrors.cpf"
      @input="helpers.clearFieldError('cpf')"
      @blur="helpers.validateField(form.cpf, [(v) => helpers.requiredField(v, 'CPF') || helpers.isCPF(v)], 'cpf')"
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
      @input="helpers.clearFieldError('email')"
      @blur="helpers.validateField(form.email, [(v) => helpers.requiredField(v, 'Email') || helpers.isEmail(v)], 'email')"
    />

    <BaseInput
      v-model="form.phone"
      label="Telefone"
      only-numbers
      placeholder="(00) 90000-0000"
      maxlength="16"
      :disabled="disabled"
      :format="helpers.formatPhone"
      :error="fieldErrors.phone"
      @input="helpers.clearFieldError('phone')"
      @blur="helpers.validateField(form.phone, [(v) => helpers.isPhone(v)], 'phone')"
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
      :format-cep="helpers.formatCEP"
      complement-placeholder="Bloco, condomínio, apto..."
      @cep-input="helpers.clearFieldError('cep')"
      @cep-blur="helpers.validateField(form.cep, [(v) => helpers.requiredField(v, 'CEP') || helpers.isCEP(v)], 'cep')"
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
      v-model="form.confirmPassword"
      type="password"
      label="Confirmar senha"
      required
      autocomplete="new-password"
      placeholder="Digite a senha novamente"
      :disabled="disabled"
      :error="fieldErrors.confirmPassword"
      @input="helpers.clearFieldError('confirmPassword')"
      @blur="
        helpers.validateField(
          form.confirmPassword,
          [(v) => helpers.requiredField(v, 'Confirmação') || helpers.passwordMatch(v, form.password)],
          'confirmPassword',
        )
      "
    />

    <slot name="extra-fields" />
  </div>
</template>
