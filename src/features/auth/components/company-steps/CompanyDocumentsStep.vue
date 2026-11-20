<script setup>
import BaseInput from '@/components/ui/BaseInput.vue'
import FileUploadField from '@/components/ui/FileUploadField.vue'
import StatusBanner from '@/components/ui/StatusBanner.vue'

const form = defineModel('form', { type: Object, required: true })
const files = defineModel('files', { type: Object, required: true })

defineProps({
  fieldErrors: { type: Object, required: true },
  disabled: { type: Boolean, default: false },
  helpers: { type: Object, required: true },
})

const emit = defineEmits(['file-error'])
</script>

<template>
  <div>
    <h2 class="step-heading">Documentação da <span class="step-accent">Empresa</span></h2>

    <BaseInput
      v-model="form.stateRegistration"
      label="Inscrição Estadual"
      required
      placeholder="Digite a inscrição estadual"
      :disabled="disabled"
      :error="fieldErrors.stateRegistration"
      @input="helpers.clearFieldError('stateRegistration')"
      @blur="
        helpers.validateField(
          form.stateRegistration,
          [(v) => helpers.requiredField(v, 'Inscrição Estadual')],
          'stateRegistration',
        )
      "
    />

    <FileUploadField
      v-model="files.articlesOfAssociation.file"
      :file-name="files.articlesOfAssociation.name"
      label="Contrato Social"
      required
      accept=".pdf"
      :disabled="disabled"
      :error="fieldErrors.articlesOfAssociation"
      hint="Formato aceito: PDF"
      @update:file-name="files.articlesOfAssociation.name = $event"
      @error="emit('file-error', $event)"
    />

    <FileUploadField
      v-model="files.stateOperatingLicense.file"
      :file-name="files.stateOperatingLicense.name"
      label="Licença de Operação Estadual"
      required
      accept=".pdf"
      :disabled="disabled"
      :error="fieldErrors.stateOperatingLicense"
      hint="Formato aceito: PDF"
      @update:file-name="files.stateOperatingLicense.name = $event"
      @error="emit('file-error', $event)"
    />

    <FileUploadField
      v-model="files.certificateOfGoodStading.file"
      :file-name="files.certificateOfGoodStading.name"
      label="Certidões Negativas"
      required
      accept=".pdf"
      :disabled="disabled"
      :error="fieldErrors.certificateOfGoodStading"
      hint="Formato aceito: PDF"
      @update:file-name="files.certificateOfGoodStading.name = $event"
      @error="emit('file-error', $event)"
    />

    <StatusBanner
      variant="info"
      icon="mdi-information-outline"
      message="Os documentos fazem parte da moderação cadastral da empresa. Não há prazo de análise garantido."
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
