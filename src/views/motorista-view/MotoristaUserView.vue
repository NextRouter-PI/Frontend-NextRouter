<script setup>
import { reactive, ref } from "vue";
import { useLoginState } from "@/store/useLoginState";

const { state } = useLoginState();
const mostrarSenha = ref(false);
const fileInputRef = ref(null);
const cnhInputRef = ref(null);
const cnhCarregando = ref(false);

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

const abrirSeletorFoto = () => {
  fileInputRef.value?.click();
};

const atualizarFotoPerfil = (event) => {
  const arquivo = event.target.files?.[0];
  if (!arquivo) return;

  profileData.fotoPerfil = URL.createObjectURL(arquivo);
};

const abrirSeletorCNH = () => {
  cnhInputRef.value?.click();
};

const uploadCNHBackend = async (arquivo) => {
  // Ponto de integração com Django.
  // Exemplo esperado de retorno:
  // { id: 10, nome_arquivo: "cnh.pdf", arquivo_url: "https://api.../media/cnh.pdf" }
  // Substituir por chamada real (fetch/axios) quando endpoint existir.
  return Promise.resolve({
    id: profileData.cnhId,
    nome_arquivo: arquivo.name,
    arquivo_url: profileData.cnhArquivoLocal,
  });
};

const atualizarArquivoCNH = async (event) => {
  const arquivo = event.target.files?.[0];
  if (!arquivo) return;

  const urlLocal = URL.createObjectURL(arquivo);
  profileData.cnhArquivoLocal = urlLocal;
  profileData.cnhNomeArquivo = arquivo.name;
  cnhCarregando.value = true;

  try {
    const resposta = await uploadCNHBackend(arquivo);
    profileData.cnhId = resposta.id ?? profileData.cnhId;
    profileData.cnhNomeArquivo = resposta.nome_arquivo || arquivo.name;
    profileData.cnhArquivo = resposta.arquivo_url || null;
  } catch (error) {
    console.error("Erro ao enviar CNH para backend:", error);
  } finally {
    cnhCarregando.value = false;
  }
};

const visualizarCNH = () => {
  const urlDocumento = profileData.cnhArquivo || profileData.cnhArquivoLocal;
  if (!urlDocumento) return;
  window.open(urlDocumento, "_blank");
};
</script>

<template>
  <div class="profile-container">
      <div class="profile-header">
      <div class="avatar-edit-wrapper">
        <div class="avatar-circle">
          <img
            v-if="profileData.fotoPerfil"
            :src="profileData.fotoPerfil"
            alt="Foto de perfil"
            class="avatar-image"
          >
        </div>
        <input
          ref="fileInputRef"
          type="file"
          accept="image/*"
          class="file-input-hidden"
          @change="atualizarFotoPerfil"
        >
        <button class="btn-change-photo" type="button" @click="abrirSeletorFoto">
          Alterar foto
        </button>
      </div>
    </div>

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

      <div class="cnh-section">
        <label>Documento CNH</label>
        <p class="cnh-file-name">{{ profileData.cnhNomeArquivo }}</p>

        <input
          ref="cnhInputRef"
          type="file"
          accept=".pdf,image/*"
          class="file-input-hidden"
          @change="atualizarArquivoCNH"
        >

        <div class="cnh-actions">
          <button
            class="btn-cnh btn-cnh-view"
            type="button"
            :disabled="!profileData.cnhArquivo && !profileData.cnhArquivoLocal"
            @click="visualizarCNH"
          >
            Ver CNH
          </button>
          <button
            class="btn-cnh btn-cnh-change"
            type="button"
            :disabled="cnhCarregando"
            @click="abrirSeletorCNH"
          >
            Alterar arquivo
          </button>
        </div>
        <p v-if="cnhCarregando" class="cnh-status">Enviando CNH...</p>
      </div>
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
</style>
