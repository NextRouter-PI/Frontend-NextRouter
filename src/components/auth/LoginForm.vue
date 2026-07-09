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
      const token = state.access
      window.location.href = `${ADMIN_URL}/?company=${name}&token=${token}`
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

    <p class="login-hint">Entrar em sua conta:</p>

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

    <button @click="enviarLogin" :disabled="state.loading" class="btn-login">
      {{ state.loading ? 'Entrando...' : 'Entrar' }}
    </button>

    <p v-if="erro" class="erro">{{ erro }}</p>

    <p class="forgot-link">
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

.login-hint {
  margin-bottom: 20px;
  text-align: center;
  color: var(--text-muted);
  font-size: 0.95rem;
}

.btn-login,
.secondary {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  padding: 12px;
  border-radius: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: 0.2s;
  margin-bottom: 12px;
  font-size: 0.95rem;
}

.btn-login {
  background: var(--primary);
  color: white;
  border: none;
}

.btn-login:hover {
  background: var(--primary-hover);
}

.btn-login:disabled {
  opacity: 0.7;
  cursor: wait;
}

.secondary {
  background: transparent;
  color: var(--primary);
  border: 2px solid var(--primary);
}

.secondary:hover {
  background: var(--primary);
  color: white;
}

a {
  color: var(--primary);
  text-decoration: none;
  font-weight: 600;
}

a:hover {
  text-decoration: underline;
}

.erro {
  color: var(--danger);
  font-size: 14px;
  font-weight: 500;
  text-align: center;
  margin-bottom: 12px;
}

.forgot-link {
  text-align: center;
  color: var(--text-muted);
  font-size: 0.9rem;
  margin-bottom: 16px;
}
</style>
