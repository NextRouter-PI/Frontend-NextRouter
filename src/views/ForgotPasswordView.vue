<script setup>
import { useRouter } from 'vue-router'
import { usePasswordReset } from '@/composables/usePasswordReset'
import AuthBranding from '@/components/ui/AuthBranding.vue'
import FloatingInput from '@/components/ui/FloatingInput.vue'
import PasswordField from '@/components/ui/PasswordField.vue'
import CodeInput from '@/components/ui/CodeInput.vue'

const router = useRouter()
const {
  etapa, email, emailCodigo, codigo, novaSenha, confirmarSenha, erro, ocupado, cooldown,
  solicitarCodigo, verificarCodigo, redefinirSenha, voltarAoEmail, voltarAoCodigo,
} = usePasswordReset()

function voltarParaLogin() {
  router.push('/login')
}
</script>

<template>
  <div class="forgot-password-container">
    <AuthBranding />

    <form v-if="etapa === 1" class="etapa" @submit.prevent="solicitarCodigo">
      <p class="texto-principal">Digite seu e-mail para enviarmos um código de verificação</p>

      <FloatingInput v-model="email" label="E-mail" type="email" autocomplete="email" :disabled="ocupado" />

      <button type="submit" :disabled="ocupado">{{ ocupado ? 'Solicitando...' : 'Enviar código' }}</button>

      <p class="voltar">
        <a href="#" @click.prevent="voltarParaLogin">Voltar para login</a>
      </p>
    </form>

    <form v-if="etapa === 2" class="etapa" @submit.prevent="verificarCodigo">
      <p class="texto-principal">
        Se houver uma conta elegível para <strong>{{ emailCodigo }}</strong>,
        você receberá um código. Digite os seis dígitos abaixo.
      </p>

      <CodeInput v-model="codigo" :disabled="ocupado" />

      <p class="reenviar-texto">
        <template v-if="cooldown > 0">Reenviar código em {{ cooldown }}s</template>
        <button v-else type="button" class="resend-code" :disabled="ocupado" @click="solicitarCodigo">
          Enviar novo código
        </button>
      </p>

      <button type="submit" :disabled="ocupado">{{ ocupado ? 'Verificando...' : 'Confirmar código' }}</button>
      <button type="button" :disabled="ocupado" @click="voltarAoEmail">Usar outro e-mail</button>
    </form>

    <form v-if="etapa === 3" class="etapa" @submit.prevent="redefinirSenha">
      <p class="texto-principal">Digite sua nova senha</p>

      <PasswordField v-model="novaSenha" label="Nova senha" autocomplete="new-password" :disabled="ocupado" />

      <PasswordField v-model="confirmarSenha" label="Confirme sua senha" autocomplete="new-password" :disabled="ocupado" />

      <button type="submit" :disabled="ocupado">{{ ocupado ? 'Enviando...' : 'Redefinir senha' }}</button>
      <button type="button" :disabled="ocupado" @click="voltarAoCodigo">Corrigir ou reenviar código</button>
    </form>

    <section v-if="etapa === 4" class="etapa" role="status">
      <p class="texto-principal">Senha redefinida. Entre novamente com a nova senha; as sessões anteriores foram encerradas.</p>
      <button type="button" @click="voltarParaLogin">Ir para login</button>
    </section>

    <p v-if="erro" class="erro" role="alert">{{ erro }}</p>
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

button:disabled {
  opacity: 0.6;
  cursor: wait;
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

.reenviar-texto .resend-code {
  display: inline;
  width: auto;
  padding: 0;
  margin: 0;
  background: none;
  font-weight: normal;
  color: var(--primary);
  cursor: pointer;
  text-decoration: underline;
}

.reenviar-texto .resend-code:hover {
  color: var(--primary-hover);
}
</style>
