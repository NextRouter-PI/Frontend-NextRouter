<script setup>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useRegisterState } from '@/store/useRegisterState';

const router = useRouter();
const registerState = useRegisterState();

const form = ref({
  nomeEmpresa: '',
  email: '',
  telefone: '',
  cidade: '',
  endereco: '',
  cnpj: ''
});

const arquivos = reactive({
  contratoSocial: null,
  licencaOperacao: null,
  certidoesNegativas: null
});

const arquivosNomes = reactive({
  contratoSocial: 'Nenhum arquivo selecionado',
  licencaOperacao: 'Nenhum arquivo selecionado',
  certidoesNegativas: 'Nenhum arquivo selecionado'
});

const loading = ref(false);
const errorMessage = ref('');

const handleFileChange = (event, tipo) => {
  const file = event.target.files && event.target.files[0];
  if (file) {
    arquivos[tipo] = file;
    arquivosNomes[tipo] = file.name;
  } else {
    arquivos[tipo] = null;
    arquivosNomes[tipo] = 'Nenhum arquivo selecionado';
  }
};

const handleSubmit = async () => {
  errorMessage.value = '';
  
  if (!form.value.nomeEmpresa || form.value.nomeEmpresa.trim() === '') {
    errorMessage.value = 'Nome da empresa é obrigatório';
    return;
  }
  
  if (!form.value.email || form.value.email.trim() === '') {
    errorMessage.value = 'Email é obrigatório';
    return;
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(form.value.email)) {
    errorMessage.value = 'Email inválido';
    return;
  }
  
  if (!form.value.telefone || form.value.telefone.trim() === '') {
    errorMessage.value = 'Telefone é obrigatório';
    return;
  }
  
  if (!form.value.cnpj || form.value.cnpj.trim() === '') {
    errorMessage.value = 'CNPJ é obrigatório';
    return;
  }
  
  const cnpjLimpo = form.value.cnpj.replace(/[^\d]/g, '');
  if (cnpjLimpo.length !== 14) {
    errorMessage.value = 'CNPJ inválido';
    return;
  }
  
  if (!arquivos.contratoSocial) {
    errorMessage.value = 'Contrato Social é obrigatório';
    return;
  }
  
  if (!arquivos.licencaOperacao) {
    errorMessage.value = 'Licença de Operação é obrigatória';
    return;
  }
  
  if (!arquivos.certidoesNegativas) {
    errorMessage.value = 'Certidões Negativas são obrigatórias';
    return;
  }
  
  loading.value = true;
  
  try {
    const userData = {
      nome: form.value.nomeEmpresa.trim(),
      email: form.value.email.trim().toLowerCase(),
      telefone: form.value.telefone.trim(),
      tipo: 'empresa',
      endereco: form.value.endereco?.trim() || '',
      cidade: form.value.cidade?.trim() || '',
      cnpj: form.value.cnpj.trim(),
    };
    sessionStorage.setItem('tempRegisterData', JSON.stringify({
      ...userData,
      documentos: {
        contratoSocial: arquivosNomes.contratoSocial,
        licencaOperacao: arquivosNomes.licencaOperacao,
        certidoesNegativas: arquivosNomes.certidoesNegativas
      }
    }));
    
    router.push({
      path: '/signup/criar-senha',
      query: { 
        tipo: 'empresa', 
        email: form.value.email.trim().toLowerCase(),
        nome: form.value.nomeEmpresa.trim()
      }
    });
    
  } catch (error) {
    console.error('Erro no cadastro:', error);
    errorMessage.value = error.message || 'Erro ao processar cadastro';
  } finally {
    loading.value = false;
  }
};

const limparErro = () => {
  errorMessage.value = '';
};

const formatarCNPJ = (event) => {
  let value = event.target.value.replace(/[^\d]/g, '');
  
  if (value.length <= 2) {
    value = value.replace(/^(\d{0,2})/, '$1');
  } else if (value.length <= 5) {
    value = value.replace(/^(\d{2})(\d{0,3})/, '$1.$2');
  } else if (value.length <= 8) {
    value = value.replace(/^(\d{2})(\d{3})(\d{0,3})/, '$1.$2.$3');
  } else if (value.length <= 12) {
    value = value.replace(/^(\d{2})(\d{3})(\d{3})(\d{0,4})/, '$1.$2.$3/$4');
  } else {
    value = value.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{0,2})/, '$1.$2.$3/$4-$5');
  }
  
  form.value.cnpj = value;
};

const formatarTelefone = (event) => {
  let value = event.target.value.replace(/[^\d]/g, '');
  
  if (value.length <= 2) {
    value = value.replace(/^(\d{0,2})/, '($1');
  } else if (value.length <= 6) {
    value = value.replace(/^(\d{2})(\d{0,4})/, '($1) $2');
  } else if (value.length <= 10) {
    value = value.replace(/^(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
  } else {
    value = value.replace(/^(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
  }
  
  form.value.telefone = value;
};
</script>

<template>
  <section class="form-container">
    <div class="header">
      <span class="mdi mdi-domain"></span>
      <h2>Bem vindo</h2>
      <h1><span>EMPRESA</span></h1>
    </div>
    
    <div v-if="registerState.state.success" class="success-message">
      <span class="mdi mdi-check-circle-circle"></span>
      <p class="success-title">Cadastro enviado com sucesso!</p>
      <p>Sua empresa será verificada pela nossa equipe.</p>
      <p>Você receberá um email em breve com o resultado da análise.</p>
      <div class="loading-spinner">
        <span class="mdi mdi-loading mdi-spin"></span> Redirecionando...
      </div>
    </div>
    
    <form v-else class="signup-form" @submit.prevent="handleSubmit">
      <div class="field-group">
        <label for="nomeEmpresa">Nome da empresa *</label>
        <input
          id="nomeEmpresa"
          type="text"
          v-model="form.nomeEmpresa"
          placeholder="Digite o nome da empresa"
          :disabled="loading || registerState.state.loading"
          required
          @input="limparErro"
        />
      </div>

      <div class="field-group">
        <label for="email">Email *</label>
        <input
          id="email"
          type="email"
          v-model="form.email"
          placeholder="contato@empresa.com"
          :disabled="loading || registerState.state.loading"
          required
          @input="limparErro"
        />
      </div>

      <div class="field-group">
        <label for="telefone">Telefone *</label>
        <input
          id="telefone"
          type="tel"
          v-model="form.telefone"
          placeholder="(00) 90000-0000"
          maxlength="16"
          :disabled="loading || registerState.state.loading"
          required
          @input="formatarTelefone"
        />
      </div>

      <div class="field-group">
        <label for="cnpj">CNPJ *</label>
        <input
          id="cnpj"
          type="text"
          v-model="form.cnpj"
          placeholder="00.000.000/0000-00"
          maxlength="18"
          :disabled="loading || registerState.state.loading"
          required
          @input="formatarCNPJ"
        />
      </div>

      <div class="field-group">
        <label for="cidade">Cidade</label>
        <input
          id="cidade"
          type="text"
          v-model="form.cidade"
          placeholder="Digite a cidade"
          :disabled="loading || registerState.state.loading"
          @input="limparErro"
        />
      </div>

      <div class="field-group">
        <label for="endereco">Endereço</label>
        <input
          id="endereco"
          type="text"
          v-model="form.endereco"
          placeholder="Rua, número, bairro"
          :disabled="loading || registerState.state.loading"
          @input="limparErro"
        />
      </div>

      <div class="divider">
        <span>Documentação</span>
      </div>

      <div class="upload-group">
        <label class="upload-label">Contrato Social *</label>
        <div class="upload-controls">
          <div class="file-display" :class="{ 'has-file': arquivos.contratoSocial }">
            <span class="mdi" :class="arquivos.contratoSocial ? 'mdi-file-pdf' : 'mdi-file'"></span>
            {{ arquivosNomes.contratoSocial }}
          </div>
          <button 
            type="button" 
            class="btn-upload" 
            @click="$refs.contratoSocialInput.click()" 
            :disabled="loading || registerState.state.loading"
          >
            <span class="mdi mdi-folder-open"></span> Selecionar
          </button>
          <input
            ref="contratoSocialInput"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            @change="handleFileChange($event, 'contratoSocial')"
            style="display: none"
            :disabled="loading || registerState.state.loading"
          />
        </div>
        <small class="file-hint">Formatos aceitos: PDF, JPG, JPEG, PNG (máx. 10MB)</small>
      </div>

      <div class="upload-group">
        <label class="upload-label">Licença de Operação Estadual *</label>
        <div class="upload-controls">
          <div class="file-display" :class="{ 'has-file': arquivos.licencaOperacao }">
            <span class="mdi" :class="arquivos.licencaOperacao ? 'mdi-file-pdf' : 'mdi-file'"></span>
            {{ arquivosNomes.licencaOperacao }}
          </div>
          <button 
            type="button" 
            class="btn-upload" 
            @click="$refs.licencaOperacaoInput.click()" 
            :disabled="loading || registerState.state.loading"
          >
            <span class="mdi mdi-folder-open"></span> Selecionar
          </button>
          <input
            ref="licencaOperacaoInput"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            @change="handleFileChange($event, 'licencaOperacao')"
            style="display: none"
            :disabled="loading || registerState.state.loading"
          />
        </div>
        <small class="file-hint">Formatos aceitos: PDF, JPG, JPEG, PNG (máx. 10MB)</small>
      </div>

      <div class="upload-group">
        <label class="upload-label">Certidões Negativas *</label>
        <div class="upload-controls">
          <div class="file-display" :class="{ 'has-file': arquivos.certidoesNegativas }">
            <span class="mdi" :class="arquivos.certidoesNegativas ? 'mdi-file-pdf' : 'mdi-file'"></span>
            {{ arquivosNomes.certidoesNegativas }}
          </div>
          <button 
            type="button" 
            class="btn-upload" 
            @click="$refs.certidoesNegativasInput.click()" 
            :disabled="loading || registerState.state.loading"
          >
            <span class="mdi mdi-folder-open"></span> Selecionar
          </button>
          <input
            ref="certidoesNegativasInput"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            @change="handleFileChange($event, 'certidoesNegativas')"
            style="display: none"
            :disabled="loading || registerState.state.loading"
          />
        </div>
        <small class="file-hint">Formatos aceitos: PDF, JPG, JPEG, PNG (máx. 10MB)</small>
      </div>

      <div class="info-box">
        <span class="mdi mdi-information-outline"></span>
        <p>Os documentos enviados serão analisados pela nossa equipe. O processo pode levar até 48 horas úteis.</p>
      </div>

      <p v-if="errorMessage" class="error-message">
        <span class="mdi mdi-alert-circle"></span> {{ errorMessage }}
      </p>
      <p v-if="registerState.state.error" class="error-message">
        <span class="mdi mdi-alert-circle"></span> {{ registerState.state.error }}
      </p>

      <button type="submit" class="btn-submit" :disabled="loading || registerState.state.loading">
        <span v-if="loading || registerState.state.loading" class="mdi mdi-loading mdi-spin"></span>
        {{ loading || registerState.state.loading ? "Enviando cadastro..." : "Enviar cadastro" }}
      </button>
    </form>
  </section>
</template>

<style scoped>
.form-container {
  max-width: 600px;
  margin: 3rem auto;
  padding: 2rem;
  background: #ffffff;
  border-radius: 20px;
  box-shadow: 0 20px 35px -8px rgba(0, 0, 0, 0.1);
}

.header {
  text-align: center;
  margin-bottom: 2rem;
}

.header .mdi-domain {
  font-size: 48px;
  color: #f48a1d;
}

.header h2 {
  font-size: 1.5rem;
  color: #666;
  margin: 0.5rem 0 0;
  font-weight: normal;
}

.header h1 {
  font-size: 2rem;
  margin: 0;
  font-weight: bold;
}

.header h1 span {
  color: #f48a1d;
}

.signup-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.field-group {
  display: flex;
  flex-direction: column;
}

.field-group label {
  color: #f48a1d;
  font-weight: 600;
  font-size: 0.85rem;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.field-group input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  font-size: 1rem;
  transition: all 0.3s ease;
  background: #fafafa;
}

.field-group input:focus {
  outline: none;
  border-color: #f48a1d;
  background: #ffffff;
  box-shadow: 0 0 0 3px rgba(244, 138, 29, 0.1);
}

.field-group input:disabled {
  background: #f5f5f5;
  cursor: not-allowed;
}

.divider {
  display: flex;
  align-items: center;
  text-align: center;
  margin: 0.5rem 0;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  border-bottom: 1px solid #e0e0e0;
}

.divider span {
  margin: 0 1rem;
  color: #f48a1d;
  font-weight: 600;
  font-size: 0.85rem;
  text-transform: uppercase;
}

.upload-group {
  margin-bottom: 0.25rem;
}

.upload-label {
  display: block;
  color: #f48a1d;
  font-size: 0.85rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.upload-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.file-display {
  flex: 1;
  min-height: 48px;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  background: #fafafa;
  padding: 0 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #999;
  font-size: 0.85rem;
  overflow-x: auto;
  transition: all 0.3s ease;
}

.file-display.has-file {
  border-color: #f48a1d;
  background: #fff7f0;
  color: #333;
}

.file-display .mdi {
  font-size: 20px;
  color: #f48a1d;
}

.btn-upload {
  background-color: #f48a1d;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-upload:hover:not(:disabled) {
  background-color: #e37a0d;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(244, 138, 29, 0.3);
}

.btn-upload:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.file-hint {
  display: block;
  font-size: 11px;
  color: #999;
  margin-top: 6px;
}

.info-box {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background: #fff7f0;
  border-radius: 12px;
  border-left: 4px solid #f48a1d;
  margin-top: 0.5rem;
}

.info-box .mdi {
  font-size: 20px;
  color: #f48a1d;
  flex-shrink: 0;
}

.info-box p {
  margin: 0;
  font-size: 0.8rem;
  color: #666;
  line-height: 1.4;
}

.btn-submit {
  width: 100%;
  background: linear-gradient(135deg, #f48a1d 0%, #e37a0d 100%);
  color: white;
  border: none;
  padding: 14px;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  margin-top: 1rem;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-submit:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(244, 138, 29, 0.3);
}

.btn-submit:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.error-message {
  color: #dc2626;
  font-size: 0.85rem;
  text-align: center;
  margin: 0.5rem 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px;
  background: #fee2e2;
  border-radius: 10px;
}

.success-message {
  text-align: center;
  padding: 2rem;
}

.success-message .mdi-check-circle-circle {
  font-size: 64px;
  color: #22c55e;
}

.success-title {
  font-size: 1.5rem;
  font-weight: bold;
  color: #22c55e;
  margin: 1rem 0 0.5rem;
}

.success-message p {
  color: #666;
  margin: 0.5rem 0;
}

.loading-spinner {
  margin-top: 1.5rem;
  color: #f48a1d;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.mdi-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@media (max-width: 640px) {
  .form-container {
    margin: 1rem;
    padding: 1.5rem;
  }
  
  .upload-controls {
    flex-direction: column;
  }
  
  .btn-upload {
    width: 100%;
    justify-content: center;
  }
  
  .header h2 {
    font-size: 1.2rem;
  }
  
  .header h1 {
    font-size: 1.5rem;
  }
}
</style>