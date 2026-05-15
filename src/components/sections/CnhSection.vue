<script setup>
import { ref } from 'vue'

const props = defineProps({
  fileName: { type: String, default: 'Nenhum arquivo selecionado' },
  fileUrl: { type: String, default: '' },
  localUrl: { type: String, default: '' },
  loading: { type: Boolean, default: false }
})

const emit = defineEmits(['change', 'view'])
const inputRef = ref(null)

function openSelector() {
  inputRef.value?.click()
}

function handleFile(event) {
  const file = event.target.files?.[0]
  if (file) emit('change', file)
}

function viewFile() {
  emit('view')
}
</script>

<template>
  <div class="cnh-section">
    <label>Documento CNH</label>
    <p class="cnh-file-name">{{ fileName }}</p>

    <input
      ref="inputRef"
      type="file"
      accept=".pdf,image/*"
      class="file-input-hidden"
      @change="handleFile"
    />

    <div class="cnh-actions">
      <button
        class="btn-cnh btn-cnh-view"
        type="button"
        :disabled="!fileUrl && !localUrl"
        @click="viewFile"
      >
        Ver CNH
      </button>
      <button
        class="btn-cnh btn-cnh-change"
        type="button"
        :disabled="loading"
        @click="openSelector"
      >
        Alterar arquivo
      </button>
    </div>
    <p v-if="loading" class="cnh-status">Enviando CNH...</p>
  </div>
</template>

<style scoped>
.cnh-section {
  margin-top: 24px;
  padding: 16px;
  border: 1px solid #f1c18c;
  border-radius: 10px;
  background-color: #fffaf4;
}

.cnh-section label {
  display: block;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
  font-size: 0.95rem;
}

.cnh-file-name {
  margin: 0 0 12px;
  color: #666;
  font-size: 0.9rem;
}

.cnh-actions {
  display: flex;
  gap: 10px;
}

.btn-cnh {
  border: none;
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-cnh-view {
  background-color: #f3f3f3;
  color: #444;
}

.btn-cnh-view:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.btn-cnh-change {
  background-color: #d3730e;
  color: #fff;
}

.btn-cnh-change:hover {
  background-color: #b85f0b;
}

.btn-cnh-change:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.cnh-status {
  margin: 10px 0 0;
  font-size: 0.85rem;
  color: #8a4f10;
}

.file-input-hidden { display: none; }
</style>
