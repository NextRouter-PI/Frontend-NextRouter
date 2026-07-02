<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useLoginState } from '@/stores/useLoginState'
import { state } from '@/stores/state'

import AuthBranding from '@/components/ui/AuthBranding.vue'
import FloatingInput from '@/components/ui/FloatingInput.vue'
import PasswordField from '@/components/ui/PasswordField.vue'

const router = useRouter()
const erro = ref('')

const { login } = useLoginState()

const form = reactive({
  email: '',
  senha: '',
})

const ADMIN_URL = import.meta.env.VITE_ADMIN_URL

async function enviarLogin() {
  erro.value = ''

  const sucesso = await login(form.email, form.senha)

  if (sucesso) {
    if (state.user?.type === 'company') {
      const name = encodeURIComponent(state.user.name)
      window.location.href = `${ADMIN_URL}/?company=${name}`
    } else {
      router.push('/')
    }
  } else {
    erro.value = state.error || 'Email ou senha inválidos.'
  }
}
</script>

<template>
  <div class="login-container">
    <AuthBranding />

    <p>Entrar em sua conta:</p>

    <FloatingInput
      v-model="form.email"
      label="Email"
      type="email"
      autocomplete="email"
      @keyup.enter="enviarLogin"
    />

    <PasswordField
      v-model="form.senha"
      label="Senha"
      autocomplete="current-password"
      @keyup.enter="enviarLogin"
    />

    <button @click="enviarLogin" :disabled="state.loading">
      {{ state.loading ? 'Entrando...' : 'Entrar' }}
    </button>

    <p v-if="erro" class="erro">{{ erro }}</p>

    <p>
      Esqueceu a senha?
      <RouterLink to="/forgot-password">Clique Aqui</RouterLink>
    </p>

    <RouterLink to="/signup" class="secondary"> Criar nova conta </RouterLink>
  </div>
</template>

<style scoped>
.login-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 25px;
  background: var(--bg);
}

.login-container > * {
  width: 100%;
  max-width: 350px;
}

p {
  margin-bottom: 15px;
  text-align: center;
  color: #666;
}

button,
.secondary {
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
  opacity: 0.7;
  cursor: wait;
}

.secondary {
  background: transparent;
  color: var(--primary);
  border: 1px solid var(--primary);
}

.secondary:hover {
  background: var(--primary);
  color: white;
}

a {
  color: var(--primary);
  text-decoration: none;
  font-weight: 500;
}

a:hover {
  text-decoration: underline;
}

.erro {
  color: var(--error);
  font-size: 14px;
  font-weight: 500;
  color: #d32f2f;
}
</style>
