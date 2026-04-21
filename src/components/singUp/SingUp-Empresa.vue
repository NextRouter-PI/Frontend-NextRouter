<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useRegisterState } from '@/store/useRegisterState'

const router = useRouter()
const registerState = useRegisterState()

const arquivos = reactive({
  contratoSocial: null,
  licencaOperacao: null,
  certidoesNegativas: null,
})

const loading = ref(false)
const errorMessage = ref('')

const handleFileChange = (event, tipo) => {
  const file = event.target.files && event.target.files[0]
  if (file) {
    arquivos[tipo] = file
  } else {
    arquivos[tipo] = null
  }
}

const handleSubmit = async (event) => {
  const formElement = event.target
  const form = new FormData(formElement)
  errorMessage.value = ''

  // Pega os dados de dentro do formulário
  const company = form.get('company')?.trim()
  const email = form.get('email')?.trim()
  const phone = form.get('phone')?.replace(/\D/g, '') // Limpa o formato do telefone também
  const cnpj = form.get('cnpj')?.replace(/\D/g, '') // Limpa o formato do cnpj também

  if (!company) return (errorMessage.value = 'Nome da empresa é obrigatório')
  if (!email) return (errorMessage.value = 'Email é obrigatório')

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) return (errorMessage.value = 'Email inválido')

  if (!phone || phone.length < 10) return (errorMessage.value = 'Telefone inválido')
  if (cnpj.length !== 14) return (errorMessage.value = 'CNPJ inválido')

  const file1 = form.get('articles_of_association_document')
  const file2 = form.get('state_operating_license_document')
  const file3 = form.get('certificate_of_good_standing_document')

  if (!file1 || file1.size === 0) return (errorMessage.value = 'Contrato Social é obrigatório')
  if (!file2 || file2.size === 0) return (errorMessage.value = 'Licença de Operação é obrigatória')
  if (!file3 || file3.size === 0)
    return (errorMessage.value = 'Certidões Negativas são obrigatórias')

  loading.value = true

  try {
    const finalForm = new FormData()

    finalForm.append('trade_name', company)
    finalForm.append('company_email', email)
    finalForm.append('contact_phone', phone)
    finalForm.append('company_cnpj', cnpj)
    finalForm.append('business_address', `${form.get('address')}, ${form.get('city')}`)
    finalForm.append('articles_of_association_document', file1)
    finalForm.append('state_operating_license_document', file2)
    finalForm.append('certificate_of_good_standing_document', file3)
    finalForm.append('person_responsible_request', 'Responsável') // ADICIONAR CAMPO DE NOME RESPONSÁVEL PELA SOLICITAÇÃO

    const response = await fetch('http://127.0.0.1:19003/api/company-registration-requests/', {
      method: 'POST',
      body: finalForm ,
    }) // ADICIONAR URL VIA VARIÁVEL DE AMBIENTE

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'Erro na resposta do servidor')
    }

    // Redirecionamento
    router.push({
      path: '/',
    })
  } catch (error) {
    console.error('Erro no cadastro:', error)
    errorMessage.value = error.message || 'Erro ao conectar com o servidor'
  } finally {
    loading.value = false
  }
}

const limparErro = () => {
  errorMessage.value = ''
}

/************

  Formatar CNPJ (a cada vez que qualquer tecla é digitada no input)

*************/

const formatarCNPJ = (event) => {
  // Cria uma variável que acessa a tag (e todos os seus atributos) que sofreu o evento input
  const input = event.target

  // Remove tudo que não é dígito do valor do input.
  // O valor length dessa string será 0 se o usuário digitar algo que não seja número,
  // ignorando a cadeia de condições em if e armazenando '' (não aparecendo no input).
  // O que significa que nada além de números conseguem ser postos no input.
  let value = input.value.replace(/\D/g, '')

  // Limita a 14 dígitos (tamanho padrão do CNPJ limpo)
  value = value.substring(0, 14)

  // Aplica a formatação progressivamente conforme o usuário digita
  if (value.length > 2) {
    value = value.slice(0, 2) + '.' + value.slice(2)
  }
  if (value.length > 6) {
    value = value.slice(0, 6) + '.' + value.slice(6)
  }
  if (value.length > 10) {
    value = value.slice(0, 10) + '/' + value.slice(10)
  }
  if (value.length > 15) {
    value = value.slice(0, 15) + '-' + value.slice(15)
  }

  // Atualiza a visualização do valor
  input.value = value
}

/****************************

  Formatar Número de Telefone (a cada vez que qualquer tecla é digitada no input)

*****************************/

const formatarTelefone = (event) => {
  // Cria uma variável que acessa a tag (e todos os seus atributos) que sofreu o evento input
  const input = event.target

  // Remove tudo que não é dígito do valor do input.
  // O valor length dessa string será 0 se o usuário digitar algo que não seja número,
  // ignorando a cadeia de condições em if e armazenando '' (não aparecendo no input).
  // O que significa que nada além de números conseguem ser postos no input.
  let value = input.value.replace(/\D/g, '')

  // Limita a 11 dígitos (DDD + 9 números)
  value = value.substring(0, 11)

  // Cadeia de condições em if que aplica a formatação
  // Adiciona parêntesis a strings com mais de 1 dígito
  if (value.length > 0) {
    value = '(' + value
  }

  // Corta a string até o 3° dígito,
  // adiciona o parêntesis e um espaço e concatena com o resto da string a partir do 4° digito
  if (value.length > 3) {
    value = value.slice(0, 3) + ') ' + value.slice(3)
  }

  if (value.length > 9) {
    // Se tiver 11 dígitos, move o hífen para o formato celular (9 dígitos)
    // Caso contrário, mantém o formato fixo (8 dígitos)
    const posicaoHifen = value.length === 15 ? 10 : 9
    value = value.slice(0, posicaoHifen) + '-' + value.slice(posicaoHifen)
  }

  // Atualiza a visualização do valor
  input.value = value
}
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

    <form v-else class="signup-form" @submit.prevent="handleSubmit($event)">
      <div class="field-group">
        <label for="nomeEmpresa">Nome da empresa *</label>
        <input
          name="company"
          id="nomeEmpresa"
          type="text"
          placeholder="Digite o nome da empresa"
          :disabled="loading || registerState.state.loading"
          @input="limparErro"
        />
      </div>

      <div class="field-group">
        <label for="email">Email *</label>
        <input
          name="email"
          id="email"
          type="email"
          placeholder="contato@empresa.com"
          :disabled="loading || registerState.state.loading"
          @input="limparErro"
        />
      </div>

      <div class="field-group">
        <label for="telefone">Telefone *</label>
        <input
          name="phone"
          id="telefone"
          type="tel"
          placeholder="(00) 90000-0000"
          maxlength="16"
          :disabled="loading || registerState.state.loading"
          @input="formatarTelefone"
        />
      </div>

      <div class="field-group">
        <label for="cnpj">CNPJ *</label>
        <input
          name="cnpj"
          id="cnpj"
          type="text"
          placeholder="00.000.000/0000-00"
          maxlength="18"
          :disabled="loading || registerState.state.loading"
          @input="formatarCNPJ"
        />
      </div>

      <div class="field-group">
        <label for="cidade">Cidade</label>
        <input
          name="city"
          id="cidade"
          type="text"
          placeholder="Digite a cidade"
          :disabled="loading || registerState.state.loading"
          @input="limparErro"
        />
      </div>

      <div class="field-group">
        <label for="endereco">Endereço</label>
        <input
          name="address"
          id="endereco"
          type="text"
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
            {{ arquivos.contratoSocial?.name || 'Nenhum arquivo selecionado' }}
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
            name="articles_of_association_document"
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
            <span
              class="mdi"
              :class="arquivos.licencaOperacao ? 'mdi-file-pdf' : 'mdi-file'"
            ></span>
            {{ arquivos.licencaOperacao?.name || 'Nenhum arquivo selecionado' }}
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
            name="state_operating_license_document"
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
            <span
              class="mdi"
              :class="arquivos.certidoesNegativas ? 'mdi-file-pdf' : 'mdi-file'"
            ></span>
            {{ arquivos.certidoesNegativas?.name || 'Nenhum arquivo selecionado' }}
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
            name="certificate_of_good_standing_document"
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
        <p>
          Os documentos enviados serão analisados pela nossa equipe. O processo pode levar até 48
          horas úteis.
        </p>
      </div>

      <p v-if="errorMessage" class="error-message">
        <span class="mdi mdi-alert-circle"></span> {{ errorMessage }}
      </p>
      <p v-if="registerState.state.error" class="error-message">
        <span class="mdi mdi-alert-circle"></span> {{ registerState.state.error }}
      </p>

      <button type="submit" class="btn-submit" :disabled="loading || registerState.state.loading">
        <span v-if="loading || registerState.state.loading" class="mdi mdi-loading mdi-spin"></span>
        {{ loading || registerState.state.loading ? 'Enviando cadastro...' : 'Enviar cadastro' }}
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
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
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
