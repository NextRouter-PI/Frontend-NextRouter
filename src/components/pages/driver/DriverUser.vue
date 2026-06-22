<script setup>
import { ref, reactive } from 'vue';
import { state } from '@/stores/state.js';
import AvatarUploader from '@/components/layout/AvatarUpload.vue';

const isEditingProfile = ref(false);
const isEditingCnh = ref(false);
const fileInput = ref(null);
const selectedFile = ref(null);
const cnhFileName = ref(state.user.cnhFileName || '');
const cnhFileSize = ref(state.user.cnhFileSize || 0);

const editForm = reactive({
  name: state.user.name,
  email: state.user.email,
  password: '',
  birthday: state.user.birthday,
  cpf: state.user.cpf,
});

function toggleEditProfile() {
  isEditingProfile.value = !isEditingProfile.value;
  if (isEditingProfile.value) {
    editForm.name = state.user.name;
    editForm.email = state.user.email;
    editForm.password = '';
    editForm.birthday = state.user.birthday;
    editForm.cpf = state.user.cpf;
  }
}

function saveChanges() {
  state.user.name = editForm.name;
  state.user.email = editForm.email;
  if (editForm.password) {
    state.user.password = editForm.password;
  }
  state.user.birthday = editForm.birthday;
  state.user.cpf = editForm.cpf;
  isEditingProfile.value = false;
  editForm.password = '';
}

function toggleEditCnh() {
  isEditingCnh.value = !isEditingCnh.value;
  if (!isEditingCnh.value) {
    selectedFile.value = null;
  }
}

function triggerFileInput() {
  fileInput.value.click();
}

function handleFileUpload(event) {
  const file = event.target.files[0];
  if (file) {
    selectedFile.value = file;
    cnhFileName.value = file.name;
    cnhFileSize.value = file.size;
  }
}

function saveCnh() {
  if (selectedFile.value) {
    state.user.cnhFile = selectedFile.value;
    state.user.cnhFileName = selectedFile.value.name;
    state.user.cnhFileSize = selectedFile.value.size;
    state.user.cnhFileType = selectedFile.value.type;
  }
  isEditingCnh.value = false;
  selectedFile.value = null;
}

function cancelCnhEdit() {
  isEditingCnh.value = false;
  selectedFile.value = null;
  cnhFileName.value = state.user.cnhFileName || '';
  cnhFileSize.value = state.user.cnhFileSize || 0;
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
</script>

<template>
  <div class="profile-page">
    <header class="header-user">
      <div class="icon-perfil">
        <AvatarUploader />
      </div>
      <div class="header-content">
        <h1>Olá, {{ state.user.name }}</h1>
        <button class="edit-profile-btn" @click="toggleEditProfile">
          Editar Perfil <span class="mdi mdi-pencil-outline"></span>
        </button>
      </div>
    </header>

    <section class="profile-info" v-if="!isEditingProfile">
      <div class="info">
        <label>Nome:</label>
        <input :value="state.user.name" disabled />
      </div>
      <div class="info">
        <label>Email:</label>
        <input :value="state.user.email" disabled />
      </div>
      <div class="info">
        <label>Senha:</label>
        <input value="**********" disabled />
      </div>
      <div class="person-infos">
        <div class="info">
          <label>Data de Nascimento:</label>
          <input :value="state.user.birthday" disabled />
        </div>
        <div class="info">
          <label>CPF:</label>
          <input :value="state.user.cpf" disabled />
        </div>
      </div>
    </section>

    <section class="profile-info edit-mode" v-if="isEditingProfile">
      <div class="info">
        <label>Nome:</label>
        <input v-model="editForm.name" />
      </div>
      <div class="info">
        <label>Email:</label>
        <input v-model="editForm.email" />
      </div>
      <div class="info">
        <label>Senha:</label>
        <input v-model="editForm.password" placeholder="Nova senha" />
      </div>
      <div class="person-infos">
        <div class="info">
          <label>Data de Nascimento:</label>
          <input v-model="editForm.birthday" type="date" />
        </div>
        <div class="info">
          <label>CPF:</label>
          <input v-model="editForm.cpf" />
        </div>
      </div>
      <button class="save-btn" @click="saveChanges">Salvar alterações</button>
    </section>

    <section class="cnh">
      <h2>Minha CNH:</h2>
      <div class="cnh-card">
        <div class="cnh-info">
          <span class="cnh-filename">{{ cnhFileName || 'Nenhum arquivo selecionado' }}</span>
          <span v-if="cnhFileSize" class="cnh-filesize">{{ formatFileSize(cnhFileSize) }}</span>
        </div>
        <button @click="toggleEditCnh" class="edit-cnh-btn">
          <span class="mdi mdi-pencil-outline"></span>
        </button>
      </div>
      <div class="cnh-edit" v-if="isEditingCnh">
        <div class="file-input-wrapper">
          <input
            type="file"
            ref="fileInput"
            @change="handleFileUpload"
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            class="file-input"
          />
          <button @click="triggerFileInput" class="file-select-btn">
            <span class="mdi mdi-file-upload-outline"></span>
            Selecionar Arquivo
          </button>
          <span v-if="selectedFile" class="selected-file-name">{{ selectedFile.name }}</span>
        </div>
        <div class="cnh-actions">
          <button @click="saveCnh" class="save-cnh-btn" :disabled="!selectedFile && !cnhFileName">
            Salvar
          </button>
          <button @click="cancelCnhEdit" class="cancel-btn">Cancelar</button>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.profile-page {
  font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  background: var(--bg);
  color: var(--text);
  min-height: 100vh;
  padding: 0 16px 32px;
  max-width: 480px;
  margin: 0 auto;
}

.header-user {
  position: sticky;
  top: 0;
  z-index: 10;
  background: var(--bg);
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 0 14px;
  border-bottom: 1px solid var(--border-primary);
  margin-bottom: 20px;
}

.icon-perfil {
  flex-shrink: 0;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  overflow: hidden;
  background: var(--superfice);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow);
}

.header-content {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 6px 10px;
}

.header-content h1 {
  font-size: 1.15rem;
  font-weight: 600;
  color: var(--text);
  letter-spacing: -0.3px;
  margin: 0;
  white-space: nowrap;
}

.edit-profile-btn {
  background: transparent;
  border: none;
  color: var(--primary);
  font-weight: 500;
  font-size: 0.85rem;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: var(--border-radius);
  transition: 0.2s;
  cursor: pointer;
  white-space: nowrap;
}

.edit-profile-btn:hover {
  background: var(--gradient-primary-hover);
  color: var(--primary-hover);
}

.edit-profile-btn .mdi {
  font-size: 1.1rem;
}

.profile-info {
  background: var(--bg-white);
  border-radius: var(--border-radius);
  padding: 20px 16px;
  margin-bottom: 20px;
  box-shadow: var(--shadow);
}

.info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-bottom: 16px;
}

.info:last-child {
  margin-bottom: 0;
}

.info label {
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  color: var(--text-muted);
}

.info input {
  border: none;
  border-bottom: 1px solid var(--border-primary);
  padding: 6px 0;
  font-size: 0.95rem;
  background: transparent;
  color: var(--text);
  outline: none;
  transition: border-color 0.2s;
  width: 100%;
}

.info input:focus {
  border-bottom-color: var(--primary);
}

.info input:disabled {
  color: var(--text);
  opacity: 0.9;
  background: transparent;
}

.person-infos {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px 16px;
  margin-top: 4px;
}

.person-infos .info {
  margin-bottom: 0;
}

.edit-mode .info input {
  border-bottom: 2px solid var(--primary);
  background: var(--bg-white);
  padding: 6px 10px;
  border-radius: var(--border-radius) var(--border-radius) 0 0;
}

.edit-mode .info input:focus {
  border-bottom-color: var(--primary-hover);
  box-shadow: 0 2px 8px rgba(223, 128, 26, 0.15);
}

.save-btn {
  background: var(--gradient-primary);
  color: #ffffff;
  border: none;
  font-weight: 600;
  font-size: 0.95rem;
  padding: 12px 16px;
  border-radius: var(--border-radius);
  width: 100%;
  margin-top: 18px;
  cursor: pointer;
  transition: 0.2s;
  box-shadow: var(--shadow-primary);
}

.save-btn:hover {
  background: var(--primary-hover);
  transform: scale(0.98);
  box-shadow: 0 4px 16px rgba(223, 128, 26, 0.5);
}

.cnh {
  background: var(--bg-white);
  border-radius: var(--border-radius);
  padding: 18px 16px 16px;
  box-shadow: var(--shadow);
}

.cnh h2 {
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-muted);
  margin-bottom: 8px;
}

.cnh-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--bg);
  padding: 12px 14px;
  border-radius: var(--border-radius);
  border: 1px solid var(--border-primary);
}

.cnh-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
}

.cnh-filename {
  font-size: 0.95rem;
  color: var(--text);
  font-weight: 500;
}

.cnh-filesize {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.edit-cnh-btn {
  background: transparent;
  border: none;
  color: var(--primary);
  font-size: 1.2rem;
  padding: 0 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: color 0.2s;
}

.edit-cnh-btn:hover {
  color: var(--primary-hover);
}

.cnh-edit {
  margin-top: 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.file-input-wrapper {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

.file-input {
  display: none;
}

.file-select-btn {
  background: var(--bg);
  border: 2px solid var(--border-primary);
  color: var(--text);
  padding: 10px 16px;
  border-radius: var(--border-radius);
  font-weight: 500;
  font-size: 0.85rem;
  cursor: pointer;
  transition: 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}

.file-select-btn:hover {
  background: var(--gradient-primary-hover);
  border-color: var(--primary);
}

.file-select-btn .mdi {
  font-size: 1.1rem;
}

.selected-file-name {
  font-size: 0.9rem;
  color: var(--text);
  word-break: break-all;
}

.cnh-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.save-cnh-btn {
  background: var(--gradient-primary);
  color: #ffffff;
  border: none;
  padding: 10px 20px;
  border-radius: var(--border-radius);
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  transition: 0.2s;
  box-shadow: var(--shadow-primary);
  flex: 1;
}

.save-cnh-btn:hover:not(:disabled) {
  background: var(--primary-hover);
  transform: scale(0.96);
}

.save-cnh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.cancel-btn {
  background: transparent;
  border: 2px solid var(--border-primary);
  color: var(--text-muted);
  padding: 10px 18px;
  border-radius: var(--border-radius);
  font-weight: 500;
  font-size: 0.85rem;
  cursor: pointer;
  transition: 0.2s;
  flex: 1;
}

.cancel-btn:hover {
  background: var(--gradient-primary-hover);
  color: var(--text);
  border-color: var(--primary);
}

.mdi {
  font-family: 'Material Design Icons';
  display: inline-block;
}

@media (max-width: 400px) {
  .person-infos {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .header-content h1 {
    font-size: 1rem;
  }

  .edit-profile-btn {
    font-size: 0.75rem;
  }

  .file-input-wrapper {
    flex-direction: column;
    align-items: stretch;
  }

  .file-select-btn {
    justify-content: center;
  }

  .cnh-actions {
    flex-direction: column;
  }

  .save-cnh-btn,
  .cancel-btn {
    width: 100%;
    text-align: center;
    justify-content: center;
  }
}

.dark .profile-info,
.dark .cnh {
  background: var(--superfice);
}

.dark .edit-mode .info input {
  background: var(--bg);
}

.dark .cnh-card {
  background: var(--bg);
}

.dark .file-select-btn {
  background: var(--bg);
}

.dark .info input:disabled {
  opacity: 0.8;
}
</style>
