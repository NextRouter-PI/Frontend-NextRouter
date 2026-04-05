<script setup>
import { ref, reactive } from 'vue';

const form = ref({
  nomeEmpresa: '',
  email: '',
  telefone: '',
  cidade: '',
  endereco: '',
  cnpj: ''
});

const arquivos = reactive({
  contratoSocial: 'Selecione um arquivo',
  licencaOperacao: 'Selecione um arquivo',
  certidoesNegativas: 'Selecione um arquivo'
});

const handleFileChange = (event, tipo) => {
  const file = event.target.files && event.target.files[0];
  arquivos[tipo] = file ? file.name : 'Selecione um arquivo';
};

const handleSubmit = () => {
  const cadastro = {
    nomeEmpresa: form.value.nomeEmpresa.trim(),
    email: form.value.email.trim(),
    telefone: form.value.telefone.trim(),
    cidade: form.value.cidade.trim(),
    endereco: form.value.endereco.trim(),
    cnpj: form.value.cnpj.trim(),
    arquivoContratoSocial: arquivos.contratoSocial,
    arquivoLicencaOperacao: arquivos.licencaOperacao,
    arquivoCertidoesNegativas: arquivos.certidoesNegativas
  };

  console.log('Cadastro de empresa:', cadastro);
  alert('Cadastro enviado! Verifique o console para os dados.');
};
</script>

<template>
  <section class="form-container">
    <h2 class="title">Bem vindo <span class="subtitle">Empresa</span></h2>
    <form class="signup-form" @submit.prevent="handleSubmit">
      <div class="field-group">
        <label for="nomeEmpresa">Nome da empresa</label>
        <input
          id="nomeEmpresa"
          type="text"
          v-model="form.nomeEmpresa"
          placeholder="Digite o nome da empresa"
          required
        />
      </div>

      <div class="field-group">
        <label for="email">Email</label>
        <input
          id="email"
          type="email"
          v-model="form.email"
          placeholder="empresa@email.com"
          required
        />
      </div>

      <div class="field-group">
        <label for="telefone">Telefone</label>
        <input
          id="telefone"
          type="tel"
          v-model="form.telefone"
          placeholder="(00) 90000-0000"
          required
        />
      </div>

      <div class="field-group">
        <label for="cidade">Cidade</label>
        <input
          id="cidade"
          type="text"
          v-model="form.cidade"
          placeholder="Digite a cidade"
          required
        />
      </div>

      <div class="field-group">
        <label for="endereco">Endereço</label>
        <input
          id="endereco"
          type="text"
          v-model="form.endereco"
          placeholder="Digite o endereço completo"
          required
        />
      </div>

      <div class="field-group">
        <label for="cnpj">CNPJ</label>
        <input
          id="cnpj"
          type="text"
          v-model="form.cnpj"
          placeholder="00.000.000/0000-00"
          maxlength="18"
          required
        />
      </div>

      <div class="upload-group">
        <label class="upload-label">Contrato Social*</label>
        <div class="upload-controls">
          <div class="file-display">{{ arquivos.contratoSocial }}</div>
          <button type="button" class="btn-upload" @click="$refs.contratoSocialInput.click()">
            Selecionar arquivo
          </button>
          <input
            ref="contratoSocialInput"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            @change="handleFileChange($event, 'contratoSocial')"
            style="display: none"
          />
        </div>
      </div>

      <div class="upload-group">
        <label class="upload-label">Licença de Operação Estadual*</label>
        <div class="upload-controls">
          <div class="file-display">{{ arquivos.licencaOperacao }}</div>
          <button type="button" class="btn-upload" @click="$refs.licencaOperacaoInput.click()">
            Selecionar arquivo
          </button>
          <input
            ref="licencaOperacaoInput"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            @change="handleFileChange($event, 'licencaOperacao')"
            style="display: none"
          />
        </div>
      </div>

      <div class="upload-group">
        <label class="upload-label">Certidões Negativas*</label>
        <div class="upload-controls">
          <div class="file-display">{{ arquivos.certidoesNegativas }}</div>
          <button type="button" class="btn-upload" @click="$refs.certidoesNegativasInput.click()">
            Selecionar arquivo
          </button>
          <input
            ref="certidoesNegativasInput"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            @change="handleFileChange($event, 'certidoesNegativas')"
            style="display: none"
          />
        </div>
      </div>

      <button type="submit" class="btn-submit">Enviar cadastro</button>
    </form>
  </section>
</template>

<style scoped>
.form-container {
  max-width: 520px;
  margin: 5rem auto 2rem;
  padding: 1.5rem;
  background: var(--bg-white, #ffffff);
  border-radius: 16px;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.08);
}

.title {
  margin-bottom: 0.5rem;
  font-size: 1.8rem;
  font-weight: 800;
  text-align: center;
  color: var(--text-black, #000000);
}

.subtitle {
  display: block;
  color: var(--primary-orange, #f48a1d);
  font-size: 2rem;
}

.signup-form {
  display: grid;
  gap: 1rem;
}

.field-group {
  display: flex;
  flex-direction: column;
}

.field-group label {
  display: block;
  color: var(--primary-orange, #f48a1d);
  font-weight: bold;
  font-size: 0.9rem;
  margin-bottom: 0.4rem;
}

.field-group input,
.field-group select {
  width: 100%;
  padding: 10px;
  border: 1px solid var(--input-border, #f48a1d);
  border-radius: var(--border-radius, 8px);
  box-sizing: border-box;
  font-size: 0.95rem;
}

.field-group input:focus,
.field-group select:focus {
  outline: none;
  border-color: var(--primary-orange, #f48a1d);
  box-shadow: 0 0 0 3px rgba(244, 138, 29, 0.12);
}

.file-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.file-upload {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 12px;
  border: 1px solid var(--input-border, #f48a1d);
  border-radius: var(--border-radius, 8px);
  background: #fff;
}

.file-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 12px 16px;
  background: var(--primary-orange, #f48a1d);
  color: #fff;
  border-radius: 8px;
  font-weight: 700;
  cursor: pointer;
  text-align: center;
}

.file-name {
  color: #333;
  font-size: 0.95rem;
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-upload input[type="file"] {
  display: none;
}

.upload-group {
  margin-bottom: 15px;
  text-align: left;
}

.upload-label {
  display: block;
  color: #f48a1d;
  font-size: 0.9rem;
  font-weight: bold;
  margin-bottom: 6px;
}

.upload-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.file-display {
  flex: 1;
  min-height: 40px;
  border: 2px solid #f48a1d;
  border-radius: 8px;
  background-color: white;
  padding: 0 10px;
  display: flex;
  align-items: center;
  color: #999;
  font-size: 0.8rem;
  overflow-x: auto;
  overflow-y: hidden;
}

.btn-upload {
  background-color: #f48a1d;
  color: #333;
  border: 1px solid #000;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  flex-shrink: 0;
}

.btn-upload:hover,
.btn-upload:active {
  background-color: #e37a0d;
}

@media (min-width: 768px) {
  .form-container {
    padding: 2rem;
  }

  .title {
    font-size: 2rem;
  }

  .subtitle {
    font-size: 2.2rem;
  }

  .field-group label {
    font-size: 0.95rem;
    margin-bottom: 0.6rem;
  }

  .field-group input,
  .field-group select {
    padding: 12px;
    font-size: 1rem;
  }

  .signup-form {
    gap: 1.25rem;
  }

  .upload-label {
    font-size: 1rem;
  }

  .file-display {
    min-height: 45px;
    font-size: 0.85rem;
  }

  .btn-upload {
    font-size: 13px;
    padding: 10px 14px;
  }
}

.btn-submit {
  width: 100%;
  background-color: var(--primary-orange, #f48a1d);
  color: #fff;
  border: none;
  padding: 12px;
  border-radius: var(--border-radius, 8px);
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  margin-top: 0.5rem;
  transition: opacity 0.2s;
}

.btn-submit:hover {
  opacity: 0.9;
}
</style>
