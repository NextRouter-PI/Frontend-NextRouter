<script setup>
import { computed, reactive } from 'vue'
import { useOwnProfile } from '@/composables/useOwnProfile'
import { PROFILE_SECTIONS } from '@/profileFields'
import FormField from '@/components/ui/FormField.vue'
import BaseButton from '@/components/ui/BaseButton.vue'

const props = defineProps({ part: { type: String, required: true } })
const context = useOwnProfile()
const { busy, ready, loading, editing } = context
const section = computed(() => PROFILE_SECTIONS[props.part])
const source = computed(() => section.value.target === 'user' ? context.user.value : context.profile.value)
const isEditing = computed(() => editing.value === props.part)
const draft = reactive({})

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
    <h2>{{ section.title }}</h2>
    <p v-if="part === 'personal'" class="account-hint">CPF não é editável. E-mail de acesso e senha usam os fluxos de segurança separados.</p>
    <p v-if="part.endsWith('Address')" class="account-hint">
      Endereço cadastral não define ponto operacional de transporte.
      Consulta automática de CEP adiada; preencha os campos manualmente.
    </p>
    <template v-if="!isEditing">
      <dl class="account-grid">
        <div v-for="field in section.fields" :key="field.key">
          <dt>{{ field.label }}</dt><dd>{{ source?.[field.key] || 'Não informado' }}</dd>
        </div>
      </dl>
      <BaseButton type="button" variant="outline" :disabled="!ready || busy || loading || Boolean(editing)" @click="begin">Editar</BaseButton>
    </template>
    <form v-else class="account-form" @submit.prevent="save">
      <template v-for="field in section.fields" :key="field.key">
        <FormField v-if="!field.readonly" v-model="draft[field.key]" :label="field.label"
          :type="field.type || 'text'" :required="field.required" :maxlength="field.maxlength"
          :disabled="!ready || busy || loading" />
      </template>
      <div class="account-actions">
        <BaseButton type="submit" :loading="busy" :disabled="!ready || loading">Salvar alterações</BaseButton>
        <BaseButton type="button" variant="outline" :disabled="busy" @click="cancel">Cancelar edição</BaseButton>
      </div>
    </form>
  </section>
</template>
