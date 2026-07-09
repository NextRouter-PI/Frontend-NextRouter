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
  <div class="avatar-edit-wrapper" @click="openSelector">
    <div class="avatar-circle">
      <img
        v-if="modelValue"
        :src="modelValue"
        alt="Foto de perfil"
        class="avatar-image"
      />
      <div v-else class="avatar-placeholder">
        <span class="mdi mdi-camera-plus-outline"></span>
      </div>
    </div>
    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      class="file-input-hidden"
      @change="handleFile"
    />
  </div>
</template>

<style scoped>
.avatar-edit-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
}

.avatar-circle {
  width: 150px;
  height: 150px;
  border-radius: 50%;
  overflow: hidden;
  position: relative;
  background: #c4c4c4;
  border: 4px solid #df801a;
  transition: filter 0.2s, transform 0.2s;
}

.avatar-circle:hover {
  filter: brightness(0.85);
  transform: scale(1.03);
}

.avatar-circle:active {
  transform: scale(0.97);
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255,255,255,0.7);
  font-size: 2rem;
}

.file-input-hidden {
  display: none;
}
</style>
