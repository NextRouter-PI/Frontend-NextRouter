<template>
  <div class="profile-container">
    <!-- Header do Perfil -->
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

      <!-- Seção Meus Endereços -->
      <div class="endereco-section">
        <div class="address-label">
          <span>Meus Endereços</span>
          <div class="action-buttons">
            <span class="icon-btn mdi mdi-pencil" @click="editarEndereco" title="Editar endereço"></span>
            <span class="icon-btn mdi mdi-plus" @click="adicionarEndereco" title="Adicionar novo endereço"></span>
          </div>
        </div>

        <!-- Endereço Selecionado (Clicável) -->
        <div
          class="endereco-item endereco-selecionado"
          @click="abrirDropdownEnderecos"
        >
          <div class="endereco-content">
            <p class="endereco-text">{{ profileData.enderecos[profileData.endereco_selecionado] }}</p>
          </div>
          <span class="dropdown-icon mdi mdi-chevron-down" :class="{ 'ativo': mostrarDropdownEnderecos }"></span>
        </div>

        <!-- Dropdown de Endereços -->
        <transition name="slide">
          <div v-if="mostrarDropdownEnderecos" class="endereco-dropdown">
            <div
              v-for="(endereco, index) in profileData.enderecos"
              :key="index"
              class="endereco-opcao"
              :class="{ 'selecionado': profileData.endereco_selecionado === index }"
              @click="selecionarEndereco(index)"
            >
              <p class="endereco-text">{{ endereco }}</p>
              <span v-if="profileData.endereco_selecionado === index" class="check-icon mdi mdi-check"></span>
            </div>
          </div>
        </transition>
      </div>

      <!-- Botão de Configurações -->
      <button class="btn-settings">Configurações</button>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from "vue";
import { useLoginState } from "@/store/useLoginState";

const { state } = useLoginState();
const mostrarSenha = ref(false);
const mostrarDropdownEnderecos = ref(false);
const fileInputRef = ref(null);

// Estado dos dados do perfil (preparado para backend)
const profileData = reactive({
  fotoPerfil: null, // URL da foto do backend
  nome: state.user?.email || "Usuário", // Nome do usuário do cadastro
  senha: "••••••••", // Senha do usuário (apenas visualizar)
  enderecos: [
    "Rua Principal, 123 - São Paulo, SP",
    "Avenida Secundária, 456 - Rio de Janeiro, RJ",
  ], // Lista de endereços do backend
  endereco_selecionado: 0, // Índice do endereço selecionado
});

// Função para abrir/fechar dropdown de endereços
const abrirDropdownEnderecos = () => {
  mostrarDropdownEnderecos.value = !mostrarDropdownEnderecos.value;
};

// Função para editar endereço
const editarEndereco = () => {
  console.log("Editar endereço:", profileData.enderecos[profileData.endereco_selecionado]);
  // Aqui será integrado com backend para editar
};

// Função para adicionar novo endereço
const adicionarEndereco = () => {
  console.log("Adicionar novo endereço");
  // Aqui será integrado com backend para adicionar
};

// Função para selecionar um endereço
const selecionarEndereco = (index) => {
  profileData.endereco_selecionado = index;
  mostrarDropdownEnderecos.value = false;
  console.log("Endereço selecionado:", profileData.enderecos[index]);
  // Aqui será integrado com backend para atualizar endereço selecionado
};

// Funções para editar foto de perfil
const abrirSeletorFoto = () => {
  fileInputRef.value?.click();
};

const atualizarFotoPerfil = (event) => {
  const arquivo = event.target.files?.[0];
  if (!arquivo) return;

  profileData.fotoPerfil = URL.createObjectURL(arquivo);
};
</script>

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

/* Seção de Endereços */
.endereco-section {
  margin-top: 30px;
  border-top: 2px solid #f48a1d;
  padding-top: 20px;
  position: relative;
}

.address-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #f48a1d;
  font-weight: bold;
  font-size: 1.1rem;
  margin-bottom: 15px;
}

.action-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 15px;
}

.icon-btn {
  color: #f48a1d;
  font-size: 24px;
  cursor: pointer;
  transition: transform 0.2s, color 0.2s;
}

.icon-btn:hover {
  transform: scale(1.2);
  color: #d3730e;
}

/* Endereço Selecionado (Clicável) */
.endereco-selecionado {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px;
  border: 2px solid #f48a1d;
  border-radius: 8px;
  background-color: #fff8f0;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 10px;
}

.endereco-selecionado:hover {
  box-shadow: 0 4px 12px rgba(244, 138, 29, 0.2);
}

.endereco-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px;
  border: 2px solid #ddd;
  border-radius: 8px;
  background-color: white;
}

.endereco-content {
  flex: 1;
}

.endereco-text {
  margin: 0;
  color: #333;
  font-size: 0.95rem;
  line-height: 1.4;
}

.dropdown-icon {
  color: #f48a1d;
  font-size: 24px;
  transition: transform 0.3s ease;
  margin-left: 10px;
}

.dropdown-icon.ativo {
  transform: rotate(180deg);
}

/* Dropdown de Endereços */
.endereco-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 2px solid #f48a1d;
  border-top: none;
  border-radius: 0 0 8px 8px;
  z-index: 10;
  margin-top: -10px;
  padding: 10px 0;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.endereco-opcao {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 15px;
  cursor: pointer;
  transition: background-color 0.2s;
  border-left: 4px solid transparent;
}

.endereco-opcao:hover {
  background-color: #fff8f0;
}

.endereco-opcao.selecionado {
  background-color: #fff8f0;
  border-left-color: #f48a1d;
}

.endereco-opcao .endereco-text {
  font-size: 0.9rem;
}

.check-icon {
  color: #4caf50;
  font-size: 20px;
  margin-left: 12px;
}

/* Botão de Configurações */
.btn-settings {
  background-color: #d3730e;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  width: 100%;
  margin-top: 30px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.btn-settings:hover {
  background-color: #b85f0b;
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
}

.btn-settings:active {
  transform: translateY(0);
}

/* Transição do Dropdown */
.slide-enter-active, .slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from, .slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>

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

/* Seção de Endereços */
.endereco-section {
  margin-top: 30px;
  border-top: 2px solid #f48a1d;
  padding-top: 20px;
}

.address-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #f48a1d;
  font-weight: bold;
  font-size: 1.1rem;
  margin-bottom: 15px;
}

.action-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 15px;
}

.icon-btn {
  color: #f48a1d;
  font-size: 24px;
  cursor: pointer;
  transition: transform 0.2s, color 0.2s;
}

.icon-btn:hover {
  transform: scale(1.2);
  color: #d3730e;
}

/* Lista de Endereços */
.endereco-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 30px;
}

.endereco-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px;
  border: 2px solid #ddd;
  border-radius: 8px;
  background-color: white;
  cursor: pointer;
  transition: all 0.3s ease;
}

.endereco-item:hover {
  border-color: #f48a1d;
  background-color: #fff8f0;
}

.endereco-item.selecionado {
  border-color: #f48a1d;
  background-color: #fff8f0;
  box-shadow: 0 2px 8px rgba(244, 138, 29, 0.2);
}

.endereco-content {
  flex: 1;
}

.endereco-text {
  margin: 0;
  color: #333;
  font-size: 0.95rem;
  line-height: 1.4;
}

.check-icon {
  color: #4caf50;
  font-size: 24px;
  margin-left: 12px;
}

/* Botão de Configurações */
.btn-settings {
  background-color: #d3730e;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  width: 100%;
  transition: all 0.3s ease;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.btn-settings:hover {
  background-color: #b85f0b;
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
}

.btn-settings:active {
  transform: translateY(0);
}
</style>

