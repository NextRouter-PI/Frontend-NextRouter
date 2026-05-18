<script setup>
import { reactive, ref } from "vue";
import { useLoginState } from "@/store/useLoginState";
import { useUploadImage } from "@/store/useUploadImage";
import AvatarUpload from "@/components/ui/layout/AvatarUpload.vue";
import CnhSection from "@/components/sections/CnhSection.vue";

const { state } = useLoginState();
const { state: uploadState, upload } = useUploadImage();
const mostrarSenha = ref(false);
const cnhCarregando = ref(false);
const fotoCarregando = ref(false);

// Estado dos dados do perfil (preparado para backend)
const profileData = reactive({
  fotoPerfil: null, // URL da foto do backend
  cnhArquivo: null, // URL pública da CNH no backend
  cnhNomeArquivo: "Nenhum arquivo selecionado",
  cnhArquivoLocal: null, // Preview local antes/depois de salvar no backend
  cnhId: null, // id do documento no backend (se existir)
  nome: state.user?.email || "Usuário", // Nome do usuário do cadastro
  senha: "••••••••", // Senha do usuário (apenas visualizar)
  enderecos: [
    "Rua Principal, 123 - São Paulo, SP",
    "Avenida Secundária, 456 - Rio de Janeiro, RJ",
  ], // Lista de endereços do backend
  endereco_selecionado: 0, // Índice do endereço selecionado
});

function onFotoChange(file) {
  if (!file) return;
  fotoCarregando.value = true;

  upload(file, 'Foto de perfil').then(resposta => {
    profileData.fotoPerfil = resposta.arquivo_url || resposta.url || resposta.imagem_url || null;
  }).catch(error => {
    console.error("Erro ao enviar foto de perfil:", error);
  }).finally(() => {
    fotoCarregando.value = false;
  });
}

function onCnhChange(file) {
  if (!file) return;

  const urlLocal = URL.createObjectURL(file);
  profileData.cnhArquivoLocal = urlLocal;
  profileData.cnhNomeArquivo = file.name;
  cnhCarregando.value = true;

  upload(file, 'CNH').then(resposta => {
    profileData.cnhId = resposta.id ?? profileData.cnhId;
    profileData.cnhNomeArquivo = resposta.nome_arquivo || file.name;
    profileData.cnhArquivo = resposta.arquivo_url || resposta.url || null;
  }).catch(error => {
    console.error("Erro ao enviar CNH para backend:", error);
  }).finally(() => {
    cnhCarregando.value = false;
  });
}

const visualizarCNH = () => {
  const urlDocumento = profileData.cnhArquivo || profileData.cnhArquivoLocal;
  if (!urlDocumento) return;
  window.open(urlDocumento, "_blank");
};
</script>

<template>
  <div class="profile-container">
      <div class="profile-header">
      <AvatarUpload v-model="profileData.fotoPerfil" @file-select="onFotoChange" />
      <p v-if="fotoCarregando" class="upload-status">Enviando foto...</p>
    </div>

    <p v-if="uploadState.error" class="upload-error">{{ uploadState.error }}</p>

    <!-- Informações do Perfil -->
    <div class="profile-info">
      <!-- Campo Nome (Não Alterável) -->
      <div class="form-group">
        <label>Nome</label>
        <input
          type="text"
          :value="profileData.nome"
          class="input-field"
          disabled
        >
      </div>

      <!-- Campo Senha (Não Alterável - Apenas Visualizar) -->
      <div class="form-group">
        <label>Senha</label>
        <div class="password-wrapper">
          <input
            :type="mostrarSenha ? 'text' : 'password'"
            :value="profileData.senha"
            class="input-field"
            disabled
          >
          <span
            class="eye-icon mdi"
            :class="mostrarSenha ? 'mdi-eye-off' : 'mdi-eye'"
            @click="mostrarSenha = !mostrarSenha"
          ></span>
        </div>
      </div>

      <CnhSection
        :file-name="profileData.cnhNomeArquivo"
        :file-url="profileData.cnhArquivo"
        :local-url="profileData.cnhArquivoLocal"
        :loading="cnhCarregando"
        @change="onCnhChange"
        @view="visualizarCNH"
      />
    </div>
  </div>

</template>



<style scoped>
.profile-container {
  padding: 100px 20px 20px;
  max-width: 500px;
  margin: 0 auto;
  min-height: 100vh;
  width: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* Header do Perfil */
.profile-header {
  display: flex;
  justify-content: center;
  margin-bottom: 30px;
  margin-top: 20px;
}

.avatar-edit-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.avatar-circle {
  width: 150px;
  height: 150px;
  background-color: #222;
  border-radius: 50%;
  display: flex;
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

.avatar-icon {
  color: #f48a1d;
  font-size: 80px;
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

/* Informações do Perfil */
.profile-info {
  width: 100%;
  max-width: 500px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
  font-size: 0.95rem;
}

.input-field {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: white;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.input-field:focus {
  outline: none;
  border-color: #f48a1d;
  box-shadow: 0 0 4px rgba(244, 138, 29, 0.2);
}

.input-field:disabled {
  background-color: #f5f5f5;
  color: #666;
  cursor: not-allowed;
}

/* Password Wrapper */
.password-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.password-wrapper .input-field {
  margin-bottom: 0;
  padding-right: 40px;
}

.eye-icon {
  position: absolute;
  right: 12px;
  color: #f48a1d;
  cursor: pointer;
  font-size: 20px;
  transition: color 0.2s;
}

.eye-icon:hover {
  color: #d3730e;
}

.cnh-section {
  margin-top: 24px;
  padding: 16px;
  border: 1px solid #f1c18c;
  border-radius: 10px;
  background-color: #fffaf4;
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

.upload-status {
  text-align: center;
  color: #8a4f10;
  font-size: 0.85rem;
  margin: 4px 0 0;
}

.upload-error {
  text-align: center;
  color: #d32f2f;
  font-size: 0.85rem;
  margin: 4px 0 16px;
  background: #ffebee;
  padding: 8px 12px;
  border-radius: 6px;
}
</style>
