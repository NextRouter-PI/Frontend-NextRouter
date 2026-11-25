<script setup>
import BaseInput from '@/components/ui/BaseInput.vue'
import DateInput from '@/components/ui/DateInput.vue'
import AddressCepMapField from '@/components/ui/AddressCepMapField.vue'
import PasswordStrength from '@/components/ui/PasswordStrength.vue'
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
  // personal | location | access: qual parte do formulário mostrar nesta etapa.
  section: { type: String, default: 'personal' },
})

const SECTIONS = {
  personal: { n: '01', icon: 'mdi-account-outline', title: 'Sobre você', text: 'Seus dados básicos de identificação.' },
  location: { n: '02', icon: 'mdi-map-marker-radius', title: 'Onde você mora', text: 'Digite o CEP: rua, bairro e cidade aparecem sozinhos.' },
  access: { n: '03', icon: 'mdi-shield-lock-outline', title: 'Seu acesso', text: 'E-mail e senha que você vai usar para entrar.' },
}
</script>

<template>
  <div class="personal-fields">
    <header class="section-head">
      <span class="section-number" aria-hidden="true">{{ SECTIONS[section].n }}</span>
      <span class="section-copy">
        <strong><BaseIcon :name="SECTIONS[section].icon" /> {{ SECTIONS[section].title }}</strong>
        <small>{{ SECTIONS[section].text }}</small>
      </span>
    </header>

    <template v-if="section === 'personal'">
      <BaseInput
        v-model="form.name"
        label="Nome completo"
        required
        placeholder="Digite seu nome completo"
        :disabled="disabled"
        :error="fieldErrors.name"
        @input="clearFieldError('name')"
        @blur="validateField(form.name, [(v) => requiredField(v, 'Nome completo')], 'name')"
      >
        <template #prefix><BaseIcon name="mdi-account-outline" /></template>
      </BaseInput>

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

      <div class="field-row">
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
        >
          <template #prefix><BaseIcon name="mdi-card-account-details-outline" /></template>
        </BaseInput>
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
        >
          <template #prefix><BaseIcon name="mdi-phone-outline" /></template>
        </BaseInput>
      </div>
      <slot name="extra-fields" />
    </template>

    <template v-else-if="section === 'location'">
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
        :show-map="false"
        :cep-error="fieldErrors.cep"
        :format-cep="formatCEP"
        complement-placeholder="Bloco, condomínio, apto..."
        @cep-input="clearFieldError('cep')"
        @cep-blur="validateField(form.cep, [(v) => requiredField(v, 'CEP') || isCEP(v)], 'cep')"
      />
    </template>

    <template v-else>
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
      >
        <template #prefix><BaseIcon name="mdi-email-outline" /></template>
      </BaseInput>
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
      >
        <template #prefix><BaseIcon name="mdi-lock-outline" /></template>
      </BaseInput>
      <PasswordStrength :password="form.password" />

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
      >
        <template #prefix><BaseIcon name="mdi-lock-reset" /></template>
      </BaseInput>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.personal-fields {
  display: flex;
  flex-direction: column;
  gap: $space-3;
}

// Cabeçalho da etapa: número grande em contorno + título com ícone.
.section-head {
  display: flex;
  align-items: center;
  gap: $space-4;
  margin-bottom: $space-2;
  animation: rise-in $duration-reveal $ease-fluid backwards;
}

.section-number {
  font-size: 3.2rem;
  font-weight: $font-extrabold;
  line-height: 0.9;
  letter-spacing: -0.04em;
  color: transparent;
  -webkit-text-stroke: 2px var(--primary);
  animation: number-in 0.6s $ease-spring backwards;
}

@keyframes number-in {
  from {
    opacity: 0;
    transform: translateY(12px) scale(0.85);
  }
}

.section-copy {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding-left: $space-4;
  border-left: 2px solid var(--border);

  strong {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: $text-lg;

    :deep(.base-icon) {
      color: var(--primary);
    }
  }

  small {
    color: var(--text-muted);
    font-size: $text-sm;
    line-height: 1.4;
  }
}

.field-row {
  display: grid;
  gap: $space-3;

  @include from($bp-md) {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
