<script setup>
import { ref } from 'vue'

const modelValue = defineModel({ type: [String, null], default: null })
const emit = defineEmits(['file-select'])
const fileInput = ref(null)

function openSelector() {
  fileInput.value?.click()
}

function handleFile(event) {
  const file = event.target.files?.[0]
  if (file) {
    modelValue.value = URL.createObjectURL(file)
    emit('file-select', file)
  }
}
</script>

<template>
  <div class="avatar-edit-wrapper">
    <div class="avatar-circle">
      <img
        v-if="modelValue"
        :src="modelValue"
        alt="Foto de perfil"
        class="avatar-image"
      />
    </div>
    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      class="file-input-hidden"
      @change="handleFile"
    />
    <button class="btn-change-photo" type="button" @click="openSelector">
      Alterar foto
    </button>
  </div>
</template>

<style scoped>
.avatar-edit-wrapper {
  align-items: center;
  gap: 12px;
}

.avatar-circle {
  width: 150px;
  height: 150px;
  background-color: #222;
  border-radius: 50%;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  position: relative;
  border: 4px solid #f48a1d;
  box-shadow: 0 4px 12px rgba(244, 138, 29, 0.3);
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.file-input-hidden {
  display: none;
}

.btn-change-photo {
  background-color: transparent;
  border: 1px solid #f48a1d;
  color: #d3730e;
  border-radius: 999px;
  padding: 8px 16px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-change-photo:hover {
  background-color: rgba(244, 138, 29, 0.1);
}
</style>
