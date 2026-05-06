<script setup>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useRegisterState } from '@/store/useRegisterState';
import api from '@/api/api';

const router = useRouter();
const registerState = useRegisterState();

const currentPage = ref(1);
const loading = ref(false);
const errorMessage = ref('');

const page1Form = ref({
  razaoSocial: '',
  nomeFantasia: '',
  cnpj: '',
  telefoneComercial: '',
  emailCorporativo: '',
  cidade: '',
  estado: '',
  endereco: '',
  inscricaoEstadual: ''
});

const page3Form = ref({
  ceoNome: '',
  ceoCpf: '',
  senha: '',
  confirmarSenha: ''
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

const handleFileChange = (event, tipo) => {
  const file = event.target.files && event.target.files[0];
  if (file) {
    if (file.size > 10 * 1024 * 1024) {
      errorMessage.value = `Arquivo muito grande. Máximo 10MB. ${tipo}`;
      return;
    }
    arquivos[tipo] = file;
    arquivosNomes[tipo] = file.name;
  } else {
    arquivos[tipo] = null;
    arquivosNomes[tipo] = 'Nenhum arquivo selecionado';
  }
};

const validatePage1 = () => {
  if (!page1Form.value.razaoSocial.trim()) {
    errorMessage.value = 'Razão Social é obrigatória';
    return false;
  }
  if (!page1Form.value.nomeFantasia.trim()) {
    errorMessage.value = 'Nome Fantasia é obrigatório';
    return false;
  }
  if (!page1Form.value.cnpj.trim()) {
    errorMessage.value = 'CNPJ é obrigatório';
    return false;
  }

  const cnpjLimpo = page1Form.value.cnpj.replace(/[^\d]/g, '');
  if (cnpjLimpo.length !== 14) {
    errorMessage.value = 'CNPJ inválido';
    return false;
  }

  if (!page1Form.value.telefoneComercial.trim()) {
    errorMessage.value = 'Telefone Comercial é obrigatório';
    return false;
  }

  if (!page1Form.value.emailCorporativo.trim()) {
    errorMessage.value = 'E-mail Corporativo é obrigatório';
    return false;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(page1Form.value.emailCorporativo)) {
    errorMessage.value = 'E-mail Corporativo inválido';
    return false;
  }

  if (!page1Form.value.cidade.trim()) {
    errorMessage.value = 'Cidade é obrigatória';
    return false;
  }

  if (!page1Form.value.estado.trim()) {
    errorMessage.value = 'Estado é obrigatório';
    return false;
  }

  if (!page1Form.value.endereco.trim()) {
    errorMessage.value = 'Endereço é obrigatório';
    return false;
  }

  return true;
};

const validatePage2 = () => {
  if (!arquivos.contratoSocial) {
    errorMessage.value = 'Contrato Social é obrigatório';
    return false;
  }
  if (!arquivos.licencaOperacao) {
    errorMessage.value = 'Licença de Operação é obrigatória';
    return false;
  }
  if (!arquivos.certidoesNegativas) {
    errorMessage.value = 'Certidões Negativas são obrigatórias';
    return false;
  }
  return true;
};

const validatePage3 = () => {
  if (!page3Form.value.ceoNome.trim()) {
    errorMessage.value = 'Nome completo do CEO/diretor/sócio administrador é obrigatório';
    return false;
  }
  if (!page3Form.value.ceoCpf.trim()) {
    errorMessage.value = 'CPF é obrigatório';
    return false;
  }
  const cpfLimpo = page3Form.value.ceoCpf.replace(/[^\d]/g, '');
  if (cpfLimpo.length !== 11) {
    errorMessage.value = 'CPF inválido';
    return false;
  }
  if (!page3Form.value.senha.trim()) {
    errorMessage.value = 'Defina uma senha';
    return false;
  }
  if (page3Form.value.senha.length < 6) {
    errorMessage.value = 'A senha deve ter no mínimo 6 caracteres';
    return false;
  }
  if (!page3Form.value.confirmarSenha.trim()) {
    errorMessage.value = 'Confirme sua senha';
    return false;
  }
  if (page3Form.value.senha !== page3Form.value.confirmarSenha) {
    errorMessage.value = 'As senhas não coincidem';
    return false;
  }
  return true;
};

const goToNextPage = () => {
  errorMessage.value = '';

  if (currentPage.value === 1) {
    if (validatePage1()) {
      currentPage.value = 2;
    }
  } else if (currentPage.value === 2) {
    if (validatePage2()) {
      currentPage.value = 3;
    }
  } else if (currentPage.value === 3) {
    if (validatePage3()) {
      currentPage.value = 4;
    }
  }
};

const goToPreviousPage = () => {
  errorMessage.value = '';
  if (currentPage.value > 1) {
    currentPage.value -= 1;
  }
};

const handleSubmit = async () => {
  errorMessage.value = '';

  if (!validatePage2() || !validatePage3()) {
    return;
  }

  loading.value = true;

  try {
    const formData = new FormData();


    formData.append('razao_social', page1Form.value.razaoSocial.trim());
    formData.append('nome_fantasia', page1Form.value.nomeFantasia.trim());
    formData.append('cnpj', page1Form.value.cnpj.replace(/[^\d]/g, ''));
    formData.append('telefone', page1Form.value.telefoneComercial.trim());
    formData.append('email', page1Form.value.emailCorporativo.trim().toLowerCase());
    formData.append('cidade', page1Form.value.cidade.trim());
    formData.append('estado', page1Form.value.estado.trim());
    formData.append('endereco', page1Form.value.endereco.trim());
    formData.append('inscricao_estadual', page1Form.value.inscricaoEstadual?.trim() || '');
    formData.append('tipo', 'empresa');
    formData.append('nome_ceo', page3Form.value.ceoNome.trim());
    formData.append('cpf_ceo', page3Form.value.ceoCpf.replace(/[^\d]/g, ''));
    formData.append('senha', page3Form.value.senha);

    if (arquivos.contratoSocial) {
      formData.append('contrato_social', arquivos.contratoSocial);
    }
    if (arquivos.licencaOperacao) {
      formData.append('licenca_operacao', arquivos.licencaOperacao);
    }
    if (arquivos.certidoesNegativas) {
      formData.append('certidoes_negativas', arquivos.certidoesNegativas);
    }

    await api.post('/empresas/cadastro', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    sessionStorage.setItem('tempRegisterData', JSON.stringify({
      ...page1Form.value,
      ...page3Form.value,
      tipo: 'empresa',
    }));

    router.push({
      path: '/signup/criar-senha',
      query: {
        tipo: 'empresa',
        email: page1Form.value.emailCorporativo.trim().toLowerCase(),
        nome: page1Form.value.razaoSocial.trim()
      }
    });

  } catch (error) {
    console.error('Erro no cadastro:', error);
    errorMessage.value = error.response?.data?.message || error.message || 'Erro ao processar cadastro';
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

  page1Form.value.cnpj = value;
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

  page1Form.value.telefoneComercial = value;
};

const formatarCPF = (event) => {
  let value = event.target.value.replace(/[^\d]/g, '');

  if (value.length <= 3) {
    value = value.replace(/^(\d{0,3})/, '$1');
  } else if (value.length <= 6) {
    value = value.replace(/^(\d{3})(\d{0,3})/, '$1.$2');
  } else if (value.length <= 9) {
    value = value.replace(/^(\d{3})(\d{3})(\d{0,3})/, '$1.$2.$3');
  } else {
    value = value.replace(/^(\d{3})(\d{3})(\d{3})(\d{0,2})/, '$1.$2.$3-$4');
  }

  page3Form.value.ceoCpf = value;
};
</script>

<template>
  <section class="form-container">
    <div class="form-header-image">
      <img v-if="currentPage === 1" src="@/assets/WhatsApp Image 2026-04-29 at 23.21.32(1).jpeg" alt="Banner Empresa" class="header-image" />
      <img v-else-if="currentPage === 2" src="@/assets/WhatsApp Image 2026-04-29 at 23.21.32(2).jpeg" alt="Banner Documentação" class="header-image" />
      <img v-else src="@/assets/WhatsApp Image 2026-04-29 at 23.21.32.jpeg" alt="Banner Empresa" class="header-image" />
    </div>

    <div v-if="currentPage !== 4" class="stepper-container">
      <div class="step-circle" :class="{ active: currentPage >= 1, completed: currentPage > 1 }">
        <span v-if="currentPage > 1" class="mdi mdi-check"></span>
        <span v-else>1</span>
      </div>
      <div class="step-circle" :class="{ active: currentPage >= 2, completed: currentPage > 2 }">
        <span v-if="currentPage > 2" class="mdi mdi-check"></span>
        <span v-else>2</span>
      </div>
      <div class="step-circle" :class="{ active: currentPage >= 3 }">
        3
      </div>
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
      <div v-if="currentPage === 1" class="page-container">
        <h2 class="page-title">Informações da <span class="highlight-orange">Empresa</span></h2>

        <div class="form-group">
          <label for="razaoSocial">Razão Social *</label>
          <input
            id="razaoSocial"
            v-model="page1Form.razaoSocial"
            type="text"
            placeholder="Digite a razão social da empresa"
            :disabled="loading"
            @input="limparErro"
          />
        </div>

        <div class="form-group">
          <label for="nomeFantasia">Nome Fantasia *</label>
          <input
            id="nomeFantasia"
            v-model="page1Form.nomeFantasia"
            type="text"
            placeholder="Digite o nome fantasia da empresa"
            :disabled="loading"
            @input="limparErro"
          />
        </div>

        <div class="form-group">
          <label for="cnpj">CNPJ *</label>
          <input
            id="cnpj"
            v-model="page1Form.cnpj"
            type="text"
            placeholder="00.000.000/0000-00"
            maxlength="18"
            :disabled="loading"
            @input="formatarCNPJ"
          />
        </div>

        <div class="form-group">
          <label for="telefoneComercial">Telefone Comercial *</label>
          <input
            id="telefoneComercial"
            v-model="page1Form.telefoneComercial"
            type="tel"
            placeholder="(00) 90000-0000"
            maxlength="16"
            :disabled="loading"
            @input="formatarTelefone"
          />
        </div>

        <div class="form-group">
          <label for="emailCorporativo">E-mail Corporativo *</label>
          <input
            id="emailCorporativo"
            v-model="page1Form.emailCorporativo"
            type="email"
            placeholder="contato@empresa.com"
            :disabled="loading"
            @input="limparErro"
          />
        </div>

        <div class="row-group">
          <div class="input-wrapper city-field">
            <div class="form-group">
              <label for="cidade">Cidade *</label>
              <input
                id="cidade"
                v-model="page1Form.cidade"
                type="text"
                placeholder="Digite a cidade"
                :disabled="loading"
                @input="limparErro"
              />
            </div>
          </div>
          <div class="input-wrapper state-field">
            <div class="form-group">
              <label for="estado">Estado *</label>
              <input
                id="estado"
                v-model="page1Form.estado"
                type="text"
                placeholder="UF"
                maxlength="2"
                :disabled="loading"
                @input="limparErro"
              />
            </div>
          </div>
        </div>

        <div class="form-group">
          <label for="endereco">Endereço (Rua, Número) *</label>
          <input
            id="endereco"
            v-model="page1Form.endereco"
            type="text"
            placeholder="Rua, número e complemento"
            :disabled="loading"
            @input="limparErro"
          />
        </div>
      </div>

      <div v-if="currentPage === 2" class="page-container">
        <h2 class="page-title">Documentação da <span class="highlight-orange">Empresa</span></h2>

        <div class="form-group">
          <label for="inscricaoEstadual">Inscrição Estadual</label>
          <input
            id="inscricaoEstadual"
            v-model="page1Form.inscricaoEstadual"
            type="text"
            placeholder="Digite a inscrição estadual"
            :disabled="loading"
            @input="limparErro"
          />
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
              :disabled="loading"
            >
              <span class="mdi mdi-folder-open"></span> Selecionar
            </button>
            <input
              ref="contratoSocialInput"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              @change="handleFileChange($event, 'contratoSocial')"
              style="display: none"
              :disabled="loading"
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
              :disabled="loading"
            >
              <span class="mdi mdi-folder-open"></span> Selecionar
            </button>
            <input
              ref="licencaOperacaoInput"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              @change="handleFileChange($event, 'licencaOperacao')"
              style="display: none"
              :disabled="loading"
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
              :disabled="loading"
            >
              <span class="mdi mdi-folder-open"></span> Selecionar
            </button>
            <input
              ref="certidoesNegativasInput"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              @change="handleFileChange($event, 'certidoesNegativas')"
              style="display: none"
              :disabled="loading"
            />
          </div>
          <small class="file-hint">Formatos aceitos: PDF, JPG, JPEG, PNG (máx. 10MB)</small>
        </div>

        <div class="info-box">
          <span class="mdi mdi-information-outline"></span>
          <p>Os documentos enviados serão analisados pela nossa equipe. O processo pode levar até 48 horas úteis.</p>
        </div>
      </div>

      <div v-if="currentPage === 3" class="page-container">
        <h2 class="page-title">Responsável pela <span class="highlight-orange">Empresa</span></h2>

        <div class="form-group">
          <label for="ceoNome">Nome Completo do CEO / diretor / sócio administrador *</label>
          <input
            id="ceoNome"
            v-model="page3Form.ceoNome"
            type="text"
            placeholder="Digite o nome completo"
            :disabled="loading"
            @input="limparErro"
          />
        </div>

        <div class="form-group">
          <label for="ceoCpf">CPF *</label>
          <input
            id="ceoCpf"
            v-model="page3Form.ceoCpf"
            type="text"
            placeholder="000.000.000-00"
            maxlength="14"
            :disabled="loading"
            @input="formatarCPF"
          />
        </div>

        <div class="form-group">
          <label for="senha">Defina uma senha *</label>
          <input
            id="senha"
            v-model="page3Form.senha"
            type="password"
            placeholder="Digite uma senha segura"
            :disabled="loading"
            @input="limparErro"
          />
        </div>

        <div class="form-group">
          <label for="confirmarSenha">Confirmar uma senha *</label>
          <input
            id="confirmarSenha"
            v-model="page3Form.confirmarSenha"
            type="password"
            placeholder="Digite a senha novamente"
            :disabled="loading"
            @input="limparErro"
          />
        </div>
      </div>

      <div v-if="currentPage === 4" class="page-container">
        <h2 class="page-title">Revisão do <span class="highlight-orange">Cadastro</span></h2>

        <div class="review-section">
          <h3>Informações da Empresa</h3>
          <div class="review-item">
            <span class="label">Razão Social:</span>
            <span class="value">{{ page1Form.razaoSocial }}</span>
          </div>
          <div class="review-item">
            <span class="label">Nome Fantasia:</span>
            <span class="value">{{ page1Form.nomeFantasia }}</span>
          </div>
          <div class="review-item">
            <span class="label">CNPJ:</span>
            <span class="value">{{ page1Form.cnpj }}</span>
          </div>
          <div class="review-item">
            <span class="label">Telefone:</span>
            <span class="value">{{ page1Form.telefoneComercial }}</span>
          </div>
          <div class="review-item">
            <span class="label">E-mail:</span>
            <span class="value">{{ page1Form.emailCorporativo }}</span>
          </div>
          <div class="review-item">
            <span class="label">Localização:</span>
            <span class="value">{{ page1Form.cidade }}, {{ page1Form.estado }} - {{ page1Form.endereco }}</span>
          </div>
        </div>

        <div class="review-section">
          <h3>Informações do Responsável</h3>
          <div class="review-item">
            <span class="label">Nome do CEO/Diretor/Sócio:</span>
            <span class="value">{{ page3Form.ceoNome }}</span>
          </div>
          <div class="review-item">
            <span class="label">CPF:</span>
            <span class="value">{{ page3Form.ceoCpf }}</span>
          </div>
          <div class="review-item">
            <span class="label">Senha:</span>
            <span class="value">••••••••</span>
          </div>
        </div>

        <div class="review-section">
          <h3>Documentos</h3>
          <div class="review-item">
            <span class="label">Contrato Social:</span>
            <span class="value">✓ {{ arquivosNomes.contratoSocial }}</span>
          </div>
          <div class="review-item">
            <span class="label">Licença de Operação:</span>
            <span class="value">✓ {{ arquivosNomes.licencaOperacao }}</span>
          </div>
          <div class="review-item">
            <span class="label">Certidões Negativas:</span>
            <span class="value">✓ {{ arquivosNomes.certidoesNegativas }}</span>
          </div>
        </div>

        <div class="info-box">
          <span class="mdi mdi-information-outline"></span>
          <p>Por favor, revise todas as informações antes de enviar. Você não poderá alterá-las após a submissão.</p>
        </div>
      </div>

      <p v-if="errorMessage" class="error-message">
        <span class="mdi mdi-alert-circle"></span> {{ errorMessage }}
      </p>
      <p v-if="registerState.state.error" class="error-message">
        <span class="mdi mdi-alert-circle"></span> {{ registerState.state.error }}
      </p>

      <div class="button-group">
        <button
          v-if="currentPage > 1"
          type="button"
          class="btn-back"
          @click="goToPreviousPage"
          :disabled="loading"
        >
          <span class="mdi mdi-arrow-left"></span> Voltar
        </button>

        <button
          v-if="currentPage < 4"
          type="button"
          class="btn-next"
          :class="{ 'btn-center': currentPage === 1 }"
          @click="goToNextPage"
          :disabled="loading"
        >
          Próximo <span class="mdi mdi-arrow-right"></span>
        </button>

        <button
          v-if="currentPage === 4"
          type="submit"
          class="btn-submit"
          :disabled="loading"
        >
          <span v-if="loading" class="mdi mdi-loading mdi-spin"></span>
          {{ loading ? "Enviando cadastro..." : "Enviar Cadastro" }}
        </button>
      </div>
    </form>
  </section>
</template>

<style scoped>
/* Estilos Gerais */
.form-container {
  max-width: 700px;
  margin: 3rem auto;
  padding: 2rem;
  background: #ffffff;
  border-radius: 20px;
  box-shadow: 0 20px 35px -8px rgba(0, 0, 0, 0.1);
}

/* Imagem do Header */
.form-header-image {
  width: 100%;
  margin: -2rem -2rem 2rem 1rem;
  border-radius: 20px 20px 0 0;
  overflow: hidden;
}

.header-image {
  width: 100%;
  height: 250px;
  object-fit: cover;
  display: block;
}

/* Stepper/Barra de Progresso */
.stepper-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  margin: 30px 0;
  padding: 0 20px;
}

/* A linha cinza/laranja atrás dos números */
.stepper-container::before {
  content: "";
  position: absolute;
  top: 50%;
  left: 40px;
  right: 40px;
  height: 2px;
  background-color: #ccc;
  z-index: 1;
}

.step-circle {
  width: 40px;
  height: 40px;
  background-color: #ccc;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  z-index: 2;
  color: white;
  font-size: 1rem;
  transition: all 0.3s ease;
}

/* Estilo para o passo atual */
.step-circle.active {
  background-color: #f48a1d;
  border: 3px solid white;
  box-shadow: 0 2px 8px rgba(244, 138, 29, 0.4);
}

/* Estilo para passos completados */
.step-circle.completed {
  background-color: #22c55e;
  box-shadow: 0 2px 8px rgba(34, 197, 94, 0.3);
}

/* Título da Página */
.page-title {
  font-size: 1.4rem;
  font-weight: bold;
  margin-bottom: 1.5rem;
  color: #333;
}

.highlight-orange {
  color: #f48a1d;
}

/* Formulário */
.signup-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.page-container {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Grupos de Formulário */
.form-group {
  text-align: left;
  margin-bottom: 15px;
}

.form-group label {
  color: #f48a1d;
  font-weight: bold;
  display: block;
  margin-bottom: 5px;
  font-size: 0.9rem;
}

.form-group input {
  width: 100%;
  padding: 10px;
  border: 1px solid #666;
  border-radius: 6px;
  box-sizing: border-box;
  font-size: 1rem;
  transition: all 0.3s ease;
  background: #fafafa;
}

.form-group input:focus {
  outline: none;
  border-color: #f48a1d;
  background: #ffffff;
  box-shadow: 0 0 0 3px rgba(244, 138, 29, 0.1);
}

.form-group input:disabled {
  background: #f5f5f5;
  cursor: not-allowed;
  opacity: 0.6;
}

.form-group input::placeholder {
  color: #ccc;
  font-size: 0.85rem;
}

/* Layout em Linhas (Cidade ao lado de Estado) */
.row-group {
  display: flex;
  gap: 15px;
  width: 100%;
}

.row-group .input-wrapper {
  flex: 1;
}

.city-field {
  flex: 2;
}

.state-field {
  flex: 1;
}

/* Uploads */
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
  flex-wrap: wrap;
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
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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
  flex-shrink: 0;
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
  flex-shrink: 0;
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

/* Info Box */
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

/* Seção de Revisão */
.review-section {
  background: #f9f9f9;
  padding: 1.5rem;
  border-radius: 12px;
  margin-bottom: 1.5rem;
  border-left: 4px solid #f48a1d;
}

.review-section h3 {
  color: #f48a1d;
  margin-top: 0;
  margin-bottom: 1rem;
  font-size: 1rem;
}

.review-item {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem 0;
  border-bottom: 1px solid #eee;
}

.review-item:last-child {
  border-bottom: none;
}

.review-item .label {
  font-weight: 600;
  color: #666;
}

.review-item .value {
  color: #333;
  text-align: right;
  flex: 1;
  margin-left: 1rem;
}

/* Mensagens de Erro */
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

/* Sucesso */
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

/* Botões de Navegação */
.button-group {
  display: flex;
  gap: 12px;
  margin-top: 2rem;
  justify-content: center;
}

.btn-back,
.btn-next,
.btn-submit {
  padding: 12px 24px;
  border-radius: 8px;
  border: none;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1rem;
}

.btn-back {
  background-color: #e0e0e0;
  color: #333;
  flex: 1;
}

.btn-back:hover:not(:disabled) {
  background-color: #d0d0d0;
  transform: translateY(-2px);
}

.btn-next {
  background-color: #f48a1d;
  color: white;
  flex: 1;
}

.btn-next:hover:not(:disabled) {
  background-color: #e37a0d;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(244, 138, 29, 0.3);
}

.btn-next.btn-center {
  width: auto;
  margin: 0 auto;
}

.btn-submit {
  background: linear-gradient(135deg, #f48a1d 0%, #e37a0d 100%);
  color: white;
  width: 100%;
  justify-content: center;
}

.btn-submit:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(244, 138, 29, 0.3);
}

.btn-back:disabled,
.btn-next:disabled,
.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Animação de Spin */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Responsivo */
@media (max-width: 768px) {
  .form-container {
    margin: 1rem;
    padding: 1.5rem;
  }

  .header-image {
    height: 180px;
  }

  .stepper-container {
    padding: 0 10px;
  }

  .stepper-container::before {
    left: 20px;
    right: 20px;
  }

  .step-circle {
    width: 35px;
    height: 35px;
    font-size: 0.9rem;
  }

  .row-group {
    flex-direction: column;
  }

  .city-field,
  .state-field {
    flex: 1;
  }

  .upload-controls {
    flex-wrap: wrap;
  }

  .button-group {
    flex-direction: column;
  }

  .btn-back,
  .btn-next {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .form-container {
    margin: 0.5rem;
    padding: 1rem;
  }

  .form-header-image {
    margin: -1rem -1rem 1rem -1rem;
  }

  .header-image {
    height: 150px;
  }

  .stepper-container {
    padding: 0 5px;
    margin: 20px 0;
  }

  .step-circle {
    width: 30px;
    height: 30px;
    font-size: 0.8rem;
  }

  .page-title {
    font-size: 1.1rem;
    margin-bottom: 1rem;
  }

  .button-group {
    gap: 10px;
  }

  .btn-back,
  .btn-next,
  .btn-submit {
    padding: 10px 16px;
    font-size: 0.9rem;
  }

  .review-item {
    flex-direction: column;
    align-items: flex-start;
  }

  .review-item .value {
    text-align: left;
    margin-left: 0;
    margin-top: 0.25rem;
  }
}
</style>
