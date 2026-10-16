<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import api from '@/api/client';

import AuthBranding from "@/components/ui/AuthBranding.vue";
import FloatingInput from "@/components/ui/FloatingInput.vue";
import PasswordField from "@/components/ui/PasswordField.vue";
import CodeInput from "@/components/ui/CodeInput.vue";

const router = useRouter();
const etapa = ref(1);
const email = ref('');
const codigo = ref(['', '', '', '', '', '']);
const senhaEmail = ref('');
const novaSenha = ref('');
const confirmarSenha = ref('');
const erro = ref('');

async function enviarCodigo() {
  erro.value = '';

  if (!email.value) {
    erro.value = 'Por favor, digite seu e-mail';
    return;
  }

  try {
    await api.post('/email-tokens/send-email/', {
      email: email.value,
      token_type: 'new-password',
    });
    senhaEmail.value = email.value;
    etapa.value = 2;
  } catch (error) {
    erro.value = 'Não foi possível enviar o código. Verifique o e-mail informado.';
  }
}

async function enviarNovoCodigo() {
  erro.value = '';
  try {
    await api.post('/email-tokens/send-email/', {
      email: senhaEmail.value,
      token_type: 'new-password',
    });
  } catch (error) {
    erro.value = 'Não foi possível reenviar o código.';
  }
}

function confirmarCodigo() {
  erro.value = '';
  const codigoCompleto = codigo.value.join('');

  if (codigoCompleto.length !== 6) {
    erro.value = 'Por favor, digite o código completo';
    return;
  }

  etapa.value = 3;
}

async function resetarSenha() {
  erro.value = '';

  if (!novaSenha.value) {
    erro.value = 'Por favor, digite sua nova senha';
    return;
  }

  if (!confirmarSenha.value) {
    erro.value = 'Por favor, confirme sua senha';
    return;
  }

  if (novaSenha.value !== confirmarSenha.value) {
    erro.value = 'As senhas não coincidem';
    return;
  }

  try {
    await api.post('/email-tokens/reset-password/', {
      email: senhaEmail.value,
      code: codigo.value.join(''),
      password: novaSenha.value,
    });

    setTimeout(() => {
      router.push('/login');
    }, 1000);
  } catch (error) {
    erro.value = 'Código inválido ou expirado. Tente novamente.';
    etapa.value = 2;
  }
}

function voltarParaLogin() {
  router.push('/login');
}
</script>

<template>
  <div class="forgot-password-container">
    <AuthBranding />

    <div v-if="etapa === 1" class="etapa">
      <p class="texto-principal">Digite seu e-mail para enviarmos um código de verificação</p>

      <FloatingInput v-model="email" label="E-mail" type="email" />

      <button @click="enviarCodigo">Enviar código</button>

      <p v-if="erro" class="erro">{{ erro }}</p>

      <p class="voltar">
        <a href="#" @click.prevent="voltarParaLogin">Voltar para login</a>
      </p>
    </div>

    <div v-if="etapa === 2" class="etapa">
      <p class="texto-principal">
        Digite o código de verificação que foi enviado para <strong>{{ senhaEmail }}</strong>
      </p>

      <CodeInput v-model="codigo" />

      <p class="reenviar-texto">
        Não recebeu?
        <a href="#" @click.prevent="enviarNovoCodigo">Enviar novo código</a>
      </p>

      <button @click="confirmarCodigo">Confirmar</button>

      <p v-if="erro" class="erro">{{ erro }}</p>
    </div>

    <div v-if="etapa === 3" class="etapa">
      <p class="texto-principal">Digite sua nova senha</p>

      <PasswordField v-model="novaSenha" label="Nova senha" />

      <PasswordField v-model="confirmarSenha" label="Confirme sua senha" />

      <button @click="resetarSenha">Redefinir Senha</button>

      <p v-if="erro" class="erro">{{ erro }}</p>
    </div>
  </div>
</template>

<style scoped>
.forgot-password-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: var(--bg);
  min-height: 100vh;
  padding: 20px;
}

.forgot-password-container > * {
  width: 100%;
  max-width: 350px;
}

.etapa {
  width: 100%;
}

.texto-principal {
  text-align: center;
  color: #333;
  margin-bottom: 20px;
  font-size: 14px;
  line-height: 1.6;
}

button {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  padding: 10px;
  border: none;
  border-radius: 8px;
  background: var(--primary);
  color: white;
  font-weight: bold;
  cursor: pointer;
  transition: 0.2s;
  margin-bottom: 10px;
}

button:hover {
  background: var(--primary-hover);
}

.erro {
  color: #d32f2f;
  font-size: 12px;
  text-align: center;
  margin-top: 10px;
}

.voltar {
  text-align: center;
  margin-top: 15px;
}

.voltar a {
  color: var(--primary);
  font-size: 12px;
  cursor: pointer;
  text-decoration: underline;
}

.voltar a:hover {
  color: var(--primary-hover);
}

.reenviar-texto {
  text-align: center;
  font-size: 12px;
  color: #666;
  margin-bottom: 15px;
}

.reenviar-texto a {
  color: var(--primary);
  cursor: pointer;
  text-decoration: underline;
}

.reenviar-texto a:hover {
  color: var(--primary-hover);
}
</style>
