<script setup>
import { ref } from 'vue'

const props = defineProps({
  modelValue: { type: File, default: null },
  label: String,
  required: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  accept: { type: String, default: '.pdf,.jpg,.jpeg,.png' },
  fileName: { type: String, default: 'Nenhum arquivo selecionado' },
  hint: String
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

  emit('update:modelValue', file)
  emit('update:fileName', file.name)
}
</script>

<template>
  <div class="upload-field">
    <label v-if="label" class="upload-label">
      {{ label }} <span v-if="required" class="required">*</span>
    </label>

    <div class="upload-controls" @click="openSelector">
      <div class="file-display" :class="{ 'has-file': modelValue }">
        <span class="mdi" :class="modelValue ? 'mdi-file-pdf' : 'mdi-file'"></span>
        {{ fileName }}
      </div>
      <button
        type="button"
        class="btn-upload"
        :disabled="disabled"
        @click.stop="openSelector"
      >
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

.required { color: #e74c3c; }

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

.btn-upload:disabled { opacity: 0.6; cursor: not-allowed; }

.file-hint {
  display: block;
  font-size: 11px;
  color: #999;
  margin-top: 6px;
}
</style>
