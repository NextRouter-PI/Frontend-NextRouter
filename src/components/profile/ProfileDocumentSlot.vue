<script setup>
import { computed, onScopeDispose, ref, useId, watch } from 'vue'
import { state } from '@/stores/state'
import { useOwnProfile } from '@/composables/useOwnProfile'
import { downloadProfileDocument } from '@/api/profile'
import { PROFILE_DOCUMENTS } from '@/profileFields'
import { sessionError } from '@/stores/session'
import BaseButton from '@/components/ui/BaseButton.vue'

const props = defineProps({ field: { type: String, required: true } })
const context = useOwnProfile()
const { ready, busy, loading, editing } = context
const part = computed(() => `asset:${props.field}`)
const isEditing = computed(() => editing.value === part.value)
const documentData = computed(() => context.profile.value?.[`${props.field}_data`] || null)
const fileId = useId()
const file = ref(null)
const error = ref('')
const downloading = ref(false)
const controller = new AbortController()
let objectUrl = null
watch(() => `${state.logged}:${state.user?.id || ''}`, () => {
  controller.abort()
  if (objectUrl) URL.revokeObjectURL(objectUrl)
}, { flush: 'sync' })

function selectFile(event) {
  const selected = event.target.files?.[0]
  file.value = null
  error.value = ''
  if (!selected) return
  if (selected.size > 10 * 1024 * 1024 || !/\.pdf$/i.test(selected.name)) {
    error.value = 'Selecione um PDF de até 10 MB. O conteúdo também será validado pelo servidor.'
    event.target.value = ''
    return
  }
  file.value = selected
}
function cancel() {
  context.cancelEdit(part.value)
  if (!busy.value) file.value = null
}
async function save() {
  if (file.value && await context.replaceAsset(props.field, file.value)) file.value = null
}
async function download() {
  if (downloading.value || !ready.value || !documentData.value?.attachment_key) return
  downloading.value = true
  error.value = ''
  try {
    const { data } = await downloadProfileDocument(documentData.value.attachment_key, { signal: controller.signal })
    if (controller.signal.aborted) return
    if (objectUrl) URL.revokeObjectURL(objectUrl)
    objectUrl = URL.createObjectURL(data)
    const link = document.createElement('a')
    link.href = objectUrl
    link.download = `${props.field}.pdf`
    document.body.append(link)
    link.click()
    link.remove()
  } catch (cause) {
    if (!controller.signal.aborted) error.value = sessionError(cause, 'Não foi possível baixar o documento autorizado. Atualize o perfil e tente novamente.')
  } finally {
    if (!controller.signal.aborted) downloading.value = false
  }
}
onScopeDispose(() => {
  controller.abort()
  if (objectUrl) URL.revokeObjectURL(objectUrl)
})
</script>

<template>
  <section class="account-section">
    <h2>{{ PROFILE_DOCUMENTS[field] }}</h2>
    <p v-if="documentData">{{ documentData.description || 'Documento cadastrado' }}</p>
    <p v-else>Nenhum documento associado.</p>
    <p class="account-hint">PDF de até 10 MB. O upload e a associação são etapas distintas; uma chave de anexo não concede permissão de download.</p>
    <p v-if="error" role="alert">{{ error }}</p>
    <div v-if="!isEditing" class="account-actions">
      <BaseButton type="button" variant="outline" :disabled="!ready || busy || loading || Boolean(editing)" @click="context.startEdit(part)">Substituir documento</BaseButton>
      <BaseButton v-if="documentData" type="button" variant="outline" :loading="downloading" :disabled="!ready || busy" @click="download">Baixar documento</BaseButton>
    </div>
    <form v-else @submit.prevent="save">
      <label :for="fileId">Novo arquivo PDF</label>
      <input :id="fileId" type="file" accept=".pdf" :disabled="busy || !ready || loading" @change="selectFile" />
      <div class="account-actions">
        <BaseButton type="submit" :disabled="!file || !ready || loading" :loading="busy">Enviar e associar</BaseButton>
        <BaseButton type="button" variant="outline" :disabled="busy" @click="cancel">Cancelar</BaseButton>
      </div>
    </form>
  </section>
</template>
