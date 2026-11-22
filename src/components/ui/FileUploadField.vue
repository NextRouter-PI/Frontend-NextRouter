<script setup>
import { useTemplateRef } from 'vue'

const props = defineProps({
  label: String,
  required: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  accept: { type: String, default: '.pdf,.jpg,.jpeg,.png' },
  hint: String,
  error: String,
})

const modelValue = defineModel({ type: [File, Object, String], default: null })
const fileName = defineModel('fileName', { type: String, default: '' })
const emit = defineEmits(['error'])
const inputRef = useTemplateRef('inputRef')

const MAX_SIZE = 10 * 1024 * 1024

function openSelector() {
  if (!props.disabled) inputRef.value?.click()
}

function handleFile(event) {
  const file = event.target.files?.[0]
  if (!file) return

  if (file.size > MAX_SIZE) {
    emit('error', 'Arquivo muito grande. Máximo 10MB.')
    return
  }

  modelValue.value = file
  fileName.value = file.name
}
</script>

<template>
  <div class="upload-field" :class="{ 'has-error': Boolean(error) }">
    <label v-if="label" class="upload-label">
      {{ label }} <span v-if="required" class="required">*</span>
    </label>

    <div class="upload-controls">
      <div
        class="file-display"
        :class="{ 'has-file': modelValue && typeof modelValue === 'object' }"
      >
        <BaseIcon :name="modelValue && typeof modelValue === 'object' ? 'mdi-file-pdf' : 'mdi-file'" />
        {{ modelValue && typeof modelValue === 'object' ? fileName : 'Nenhum arquivo selecionado' }}
      </div>

      <button type="button" class="btn-upload" :disabled="disabled" @click="openSelector">
        <BaseIcon name="mdi-folder-open" /> Selecionar
      </button>
    </div>

    <input
      ref="inputRef"
      type="file"
      :accept="accept"
      style="display: none"
      :disabled="disabled"
      @change="handleFile"
    />

    <small v-if="hint" class="file-hint">{{ hint }}</small>
    <div class="upload-feedback">
      <Transition name="fade-slide">
        <p v-if="error" class="field-error" role="alert">{{ error }}</p>
      </Transition>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.upload-field {
  margin-bottom: 10px;
}

.upload-label {
  display: block;
  color: var(--primary);
  font-size: 0.85rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.required {
  color: var(--danger);
}

.upload-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.file-display {
  flex: 1;
  min-height: 48px;
  border: 2px solid var(--border-primary);
  border-radius: 12px;
  background: var(--bg);
  padding: 0 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-muted);
  font-size: 0.85rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: all 0.3s ease;
}

.file-display.has-file {
  border-color: var(--primary);
  background: rgba(223, 128, 26, 0.06);
  color: var(--text);
}

.file-display .mdi {
  font-size: 20px;
  color: var(--primary);
  flex-shrink: 0;
}

.btn-upload {
  background: var(--primary);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.btn-upload:hover:not(:disabled) {
  background: var(--primary-hover);
  transform: translateY(-1px);
  box-shadow: var(--shadow);
}

.btn-upload:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.upload-field.has-error .file-display {
  border-color: var(--danger);
}

.file-hint {
  display: block;
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 6px;
}

.upload-feedback {
  min-height: 18px;
  margin-top: 4px;
}

.field-error {
  color: var(--danger);
  font-size: 0.78rem;
  line-height: 1.35;
}
</style>
