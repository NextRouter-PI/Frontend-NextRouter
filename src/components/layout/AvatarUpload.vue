<script setup>
import { ref, shallowRef } from 'vue'
import AvatarCropModal from '@/components/layout/AvatarCropModal.vue'

const props = defineProps({
  modelValue: { type: String, default: null },
  disabled: { type: Boolean, default: false },
})
const emit = defineEmits(['file-select', 'error'])
const fileInput = ref(null)
const pendingCropFile = shallowRef(null)

function openSelector() {
  if (!props.disabled) fileInput.value?.click()
}

function handleFile(event) {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file || props.disabled) return
  if (file.size > 5 * 1024 * 1024 || !/\.(jpe?g|png)$/i.test(file.name)) {
    emit('error', 'Selecione uma imagem JPG ou PNG de até 5 MB. O servidor também valida o conteúdo.')
    return
  }
  pendingCropFile.value = file
}

function handleCropConfirm(croppedFile) {
  pendingCropFile.value = null
  if (croppedFile.size > 5 * 1024 * 1024) {
    emit('error', 'A imagem recortada excedeu 5 MB. Tente outra foto.')
    return
  }
  // A foto exibida continua sendo a confirmada no servidor; sem preview falso ou URL vazada.
  emit('file-select', croppedFile)
}

function handleCropCancel() {
  pendingCropFile.value = null
}
</script>

<template>
  <div class="avatar-edit-wrapper">
    <button type="button" class="avatar-button" :disabled="disabled" aria-label="Alterar foto de perfil" @click="openSelector">
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
    </button>
    <input
      ref="fileInput"
      type="file"
      accept=".jpg,.jpeg,.png"
      :disabled="disabled"
      class="file-input-hidden"
      @change="handleFile"
    />
    <AvatarCropModal
      :file="pendingCropFile"
      @confirm="handleCropConfirm"
      @cancel="handleCropCancel"
      @error="emit('error', $event)"
    />
  </div>
</template>

<style lang="scss" scoped>
.avatar-edit-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
}

.avatar-button { padding: 0; background: none; border: 0; border-radius: 50%; cursor: pointer; }
.avatar-button:disabled { opacity: 0.65; cursor: not-allowed; }
.avatar-button:focus-visible { outline: 3px solid var(--text); outline-offset: 4px; }

.avatar-circle {
  width: 106px;
  height: 106px;
  border-radius: 50%;
  overflow: hidden;
  position: relative;
  background: #c4c4c4;
  border: 2px solid var(--primary);
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
