<script setup>
import { computed, reactive } from 'vue'
import { useOwnProfile } from '@/features/profile/composables/useOwnProfile'
import { PROFILE_SECTIONS } from '@/features/profile/profileFields'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import { useAuthStore } from '@/stores/useAuthStore'
import { USER_ROLES } from '@/constants'
import { formatCnpjDisplay, formatDateBr } from '@/utils/formatters'

const props = defineProps({ part: { type: String, required: true } })
const context = useOwnProfile()
const { busy, ready, loading, editing } = context
const section = computed(() => PROFILE_SECTIONS[props.part])
const source = computed(() => (section.value.target === 'user' ? context.user.value : context.profile.value))
const isEditing = computed(() => editing.value === props.part)
const draft = reactive({})
const auth = useAuthStore()
// Na conta empresarial, os dados pessoais são os do responsável pela empresa.
const ICONS = {
  personal: 'mdi-account-outline',
  personalAddress: 'mdi-map-marker-outline',
  company: 'mdi-domain',
  companyAddress: 'mdi-office-building-outline',
}
const title = computed(() =>
  props.part === 'personal' && auth.role === USER_ROLES.COMPANY ? 'Dados do responsável' : section.value.title,
)

function display(field, value) {
  if (!value) return 'Não informado'
  if (field.key === 'cpf') {
    const digits = String(value).replace(/\D/g, '')
    return digits.length === 11 ? digits.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4') : value
  }
  if (field.key === 'cnpj') return formatCnpjDisplay(value)
  if (field.type === 'date') return formatDateBr(value, value)
  return value
}

function begin() {
  if (!context.startEdit(props.part)) return
  for (const field of section.value.fields) {
    if (!field.readonly) draft[field.key] = source.value?.[field.key] ?? ''
  }
}

function cancel() {
  context.cancelEdit(props.part)
  if (!busy.value) for (const key of Object.keys(draft)) delete draft[key]
}

async function save() {
  if (await context.save(props.part, { ...draft })) {
    for (const key of Object.keys(draft)) delete draft[key]
  }
}
</script>

<template>
  <section class="account-section">
    <div class="account-section-header">
      <h2><BaseIcon :name="ICONS[part]" class="section-icon" /> {{ title }}</h2>
      <BaseButton
        v-if="!isEditing"
        type="button"
        variant="outline"
        size="sm"
        icon="mdi-pencil-outline"
        :disabled="!ready || busy || loading || Boolean(editing)"
        @click="begin"
      >
        Editar
      </BaseButton>
    </div>

    <p v-if="part === 'personal'" class="account-hint">
      CPF não é editável. E-mail de acesso e senha usam a aba Segurança.
    </p>
    <p v-if="part.endsWith('Address')" class="account-hint">
      Endereço cadastral não define ponto operacional de transporte.
    </p>

    <Transition name="fade-slide" mode="out-in">
      <dl v-if="!isEditing" key="view" class="account-grid">
        <div v-for="field in section.fields" :key="field.key">
          <dt>{{ field.label }}</dt>
          <dd :class="{ 'is-empty': !source?.[field.key] }">{{ display(field, source?.[field.key]) }}</dd>
        </div>
      </dl>

      <form v-else key="edit" class="account-form" @submit.prevent="save">
        <template v-for="field in section.fields" :key="field.key">
          <BaseInput
            v-if="!field.readonly"
            v-model="draft[field.key]"
            :label="field.label"
            :type="field.type || 'text'"
            :required="field.required"
            :maxlength="field.maxlength"
            :disabled="!ready || busy || loading"
          />
        </template>
        <div class="account-actions">
          <BaseButton type="submit" :loading="busy" :disabled="!ready || loading">
            Salvar alterações
          </BaseButton>
          <BaseButton type="button" variant="outline" :disabled="busy" @click="cancel">
            Cancelar
          </BaseButton>
        </div>
      </form>
    </Transition>
  </section>
</template>
