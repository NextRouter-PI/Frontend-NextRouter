<template>
  <div class="profile-container">
    <div class="profile-header">
      <AvatarUpload v-model="profileData.fotoPerfil" />
    </div>

    <div class="profile-info">
      <div class="form-group">
        <label>Nome</label>
        <input
          type="text"
          :value="profileData.nome"
          class="input-field"
          disabled
        >
      </div>

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

      <AddressSection
        :addresses="profileData.enderecos"
        :selected-index="profileData.endereco_selecionado"
        @update:selected-index="profileData.endereco_selecionado = $event"
        @edit="editarEndereco"
        @add="adicionarEndereco"
      />

      <!-- Botão de Configurações -->
      <button class="btn-settings">Configurações</button>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from "vue";
import { useLoginState } from "@/store/useLoginState";
import AvatarUpload from "@/components/ui/layout/AvatarUpload.vue";
import AddressSection from "@/components/sections/AddressSection.vue";

const { state } = useLoginState();
const mostrarSenha = ref(false);

const profileData = reactive({
  fotoPerfil: null,
  nome: state.user?.email || "Usuário", 
  senha: "••••••••", 
  enderecos: [
    "Rua Principal, 123 - São Paulo, SP",
    "Avenida Secundária, 456 - Rio de Janeiro, RJ",
  ],
  endereco_selecionado: 0, 
});

const editarEndereco = () => {
  console.log("Editar endereço:", profileData.enderecos[profileData.endereco_selecionado]);
};

const adicionarEndereco = () => {
  console.log("Adicionar novo endereço");
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

