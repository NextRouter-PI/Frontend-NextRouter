<script setup>
import { computed, onScopeDispose, ref, useId, watch } from 'vue'
import { state } from '@/stores/state'
import { useOwnProfile } from '@/features/profile/composables/useOwnProfile'
import { downloadProfileDocument } from '@/api/profile'
import { PROFILE_DOCUMENTS } from '@/features/profile/profileFields'
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

watch(
  () => `${state.logged}:${state.user?.id || ''}`,
  () => {
    controller.abort()
    if (objectUrl) URL.revokeObjectURL(objectUrl)
  },
  { flush: 'sync' },
)

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
  if (file.value && (await context.replaceAsset(props.field, file.value))) file.value = null
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
    if (!controller.signal.aborted) {
      error.value = sessionError(cause, 'Não foi possível baixar o documento autorizado. Atualize o perfil e tente novamente.')
    }
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
    <p class="account-hint">PDF de até 10 MB. O upload e a associação são etapas distintas.</p>

    <Transition name="fade-slide">
      <p v-if="error" class="doc-error" role="alert">{{ error }}</p>
    </Transition>

    <Transition name="fade-slide" mode="out-in">
      <div v-if="!isEditing" key="view" class="doc-bar">
        <div class="doc-info">
          <span class="mdi mdi-file-pdf-box doc-icon" aria-hidden="true"></span>
          <span class="doc-name">{{ documentData ? (documentData.description || 'Documento cadastrado') : 'Nenhum documento associado' }}</span>
        </div>
        <div class="doc-actions">
          <BaseButton
            v-if="documentData"
            type="button"
            variant="outline"
            size="sm"
            icon="mdi-download-outline"
            :loading="downloading"
            :disabled="!ready || busy"
            @click="download"
          >
            Baixar
          </BaseButton>
          <BaseButton
            type="button"
            variant="primary"
            size="sm"
            icon="mdi-file-replace-outline"
            :disabled="!ready || busy || loading || Boolean(editing)"
            @click="context.startEdit(part)"
          >
            Editar arquivo
          </BaseButton>
        </div>
      </div>

      <form v-else key="edit" class="doc-form" @submit.prevent="save">
        <label :for="fileId" class="doc-label">Novo arquivo PDF</label>
        <input
          :id="fileId"
          type="file"
          accept=".pdf"
          class="doc-input"
          :disabled="busy || !ready || loading"
          @change="selectFile"
        />
        <div class="account-actions">
          <BaseButton type="submit" size="sm" :disabled="!file || !ready || loading" :loading="busy">
            Enviar e associar
          </BaseButton>
          <BaseButton type="button" variant="outline" size="sm" :disabled="busy" @click="cancel">
            Cancelar
          </BaseButton>
        </div>
      </form>
    </Transition>
  </section>
</template>

<style scoped>
.doc-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  padding: 10px 14px;
  border-radius: 12px;
  border: 1.5px solid var(--border);
  background: var(--input-surface);
}

.doc-info {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.doc-icon {
  font-size: 1.4rem;
  color: var(--primary);
  flex-shrink: 0;
}

.doc-name {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text);
  overflow-wrap: anywhere;
}

.doc-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.doc-form {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.doc-label {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--primary);
}

.doc-input {
  padding: 10px 12px;
  border: 1.5px dashed var(--border-primary);
  border-radius: 10px;
  background: var(--input-surface);
  color: var(--text);
  font-size: 0.86rem;
}

.doc-error {
  margin: 0 0 10px;
  color: var(--danger);
  font-size: 0.84rem;
  font-weight: 600;
}
</style>
