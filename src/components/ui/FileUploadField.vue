<script setup>
import { ref } from 'vue'

const props = defineProps({
  modelValue: { type: [File, Object, String], default: null }, // Aceita string por causa do valor inicial
  label: String,
  required: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  accept: { type: String, default: '.pdf,.jpg,.jpeg,.png' },
  fileName: { type: String, default: '' }, // Será o nome do arquivo selecionado
  hint: String,
  error: String,
})

const emit = defineEmits(['update:modelValue', 'update:fileName', 'error'])
const inputRef = ref(null)

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

  // Envia o arquivo binário para o v-model
  emit('update:modelValue', file)
  // Envia o nome do arquivo para atualizar o objeto pai
  emit('update:fileName', file.name)
}
</script>

<template>
  <div class="upload-field">
    <label v-if="label" class="upload-label">
      {{ label }} <span v-if="required" class="required">*</span>
    </label>

    <div class="upload-controls">
      <div
        class="file-display"
        :class="{ 'has-file': modelValue && typeof modelValue === 'object' }"
      >
        <span
          class="mdi"
          :class="modelValue && typeof modelValue === 'object' ? 'mdi-file-pdf' : 'mdi-file'"
        ></span>
        {{ modelValue && typeof modelValue === 'object' ? fileName : 'Nenhum arquivo selecionado' }}
      </div>

      <button type="button" class="btn-upload" :disabled="disabled" @click="openSelector">
        <span class="mdi mdi-folder-open"></span> Selecionar
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
    <p v-if="error" class="field-error">{{ error }}</p>
  </div>
</template>

<style scoped>
.upload-field {
  margin-bottom: 16px;
}

.upload-label {
  display: block;
  color: #f48a1d;
  font-size: 0.85rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.required {
  color: #e74c3c;
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
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  background: #fafafa;
  padding: 0 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #999;
  font-size: 0.85rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: all 0.3s ease;
}

.file-display.has-file {
  border-color: #f48a1d;
  background: #fff7f0;
  color: #333;
}

.file-display .mdi {
  font-size: 20px;
  color: #f48a1d;
  flex-shrink: 0;
}

.btn-upload {
  background-color: #f48a1d;
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
  background-color: #e37a0d;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(244, 138, 29, 0.3);
}

.btn-upload:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.file-hint {
  display: block;
  font-size: 11px;
  color: #999;
  margin-top: 6px;
}

.field-error {
  color: #e74c3c;
  font-size: 12px;
  margin-top: 4px;
}
</style>
