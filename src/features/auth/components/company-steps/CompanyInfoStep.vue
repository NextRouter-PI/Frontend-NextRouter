<script setup>
import BaseInput from '@/components/ui/BaseInput.vue'
import AddressCepMapField from '@/components/ui/AddressCepMapField.vue'

const form = defineModel('form', { type: Object, required: true })

defineProps({
  fieldErrors: { type: Object, required: true },
  disabled: { type: Boolean, default: false },
  helpers: { type: Object, required: true },
})
</script>

<template>
  <div>
    <h2 class="step-heading">Informações da <span class="step-accent">Empresa</span></h2>

    <BaseInput
      v-model="form.legalName"
      label="Razão Social"
      maxlength="255"
      required
      placeholder="Digite a razão social da empresa"
      :disabled="disabled"
      :error="fieldErrors.legalName"
      @input="helpers.clearFieldError('legalName')"
      @blur="helpers.validateField(form.legalName, [(v) => helpers.requiredField(v, 'Razão Social')], 'legalName')"
    />

    <BaseInput
      v-model="form.tradeName"
      label="Nome Fantasia"
      maxlength="255"
      required
      placeholder="Digite o nome fantasia da empresa"
      :disabled="disabled"
      :error="fieldErrors.tradeName"
      @input="helpers.clearFieldError('tradeName')"
      @blur="helpers.validateField(form.tradeName, [(v) => helpers.requiredField(v, 'Nome Fantasia')], 'tradeName')"
    />

    <BaseInput
      v-model="form.cnpj"
      label="CNPJ"
      required
      only-numbers
      placeholder="00.000.000/0000-00"
      maxlength="18"
      :disabled="disabled"
      :format="helpers.formatCNPJ"
      :error="fieldErrors.cnpj"
      @input="helpers.clearFieldError('cnpj')"
      @blur="helpers.validateField(form.cnpj, [(v) => helpers.requiredField(v, 'CNPJ') || helpers.isCNPJ(v)], 'cnpj')"
    />

    <BaseInput
      v-model="form.contactPhone"
      label="Telefone Comercial"
      only-numbers
      placeholder="(00) 90000-0000"
      maxlength="16"
      :disabled="disabled"
      :format="helpers.formatPhone"
      :error="fieldErrors.contactPhone"
      @input="helpers.clearFieldError('contactPhone')"
      @blur="helpers.validateField(form.contactPhone, [(v) => helpers.isPhone(v)], 'contactPhone')"
    />

    <BaseInput
      v-model="form.contactEmail"
      label="E-mail Corporativo"
      type="email"
      placeholder="contato@empresa.com"
      :disabled="disabled"
      :error="fieldErrors.contactEmail"
      @input="helpers.clearFieldError('contactEmail')"
      @blur="helpers.validateField(form.contactEmail, [(v) => helpers.isEmail(v)], 'contactEmail')"
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
      complement-placeholder="Sala, andar, galpão..."
      @cep-input="helpers.clearFieldError('cep')"
      @cep-blur="helpers.validateField(form.cep, [(v) => helpers.requiredField(v, 'CEP') || helpers.isCEP(v)], 'cep')"
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
