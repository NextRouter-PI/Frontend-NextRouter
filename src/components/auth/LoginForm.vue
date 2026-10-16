<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useLoginState } from '@/stores/useLoginState'
import { state } from '@/stores/state'
import { useDeviceLayout } from '@/composables/useDeviceLayout'
import AuthBranding from '@/components/ui/AuthBranding.vue'
import FloatingInput from '@/components/ui/FloatingInput.vue'
import PasswordField from '@/components/ui/PasswordField.vue'

const { isMobile } = useDeviceLayout()
const router = useRouter()
const erro = ref('')

const { login } = useLoginState()

const form = reactive({
  email: '',
  senha: '',
})

async function enviarLogin() {
  erro.value = ''

  const sucesso = await login(form.email, form.senha)

  if (sucesso) {
    router.push('/')
  } else {
    erro.value = state.error || 'Email ou senha inválidos.'
  }
}
</script>

<template>
  <div class="auth-page" :class="{ desktop: !isMobile }">
    <!-- Painel lateral: somente laptop/desktop -->
    <aside v-if="!isMobile" class="auth-side">
      <div class="side-content">
        <AuthBranding light />
        <h1 class="side-title">Bem-vindo de volta</h1>
        <p class="side-text">
          Acesse sua conta para continuar de onde parou.
        </p>
        <ul class="side-list">
          <li>Acesso rápido e seguro</li>
          <li>Seus dados sempre sincronizados</li>
          <li>Disponível no celular e no computador</li>
        </ul>
      </div>
    </aside>

    <!-- Formulário -->
    <main class="login-container">
      <AuthBranding v-if="isMobile" />

      <h2 v-if="!isMobile" class="form-title">Entrar</h2>
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
    </main>
  </div>
</template>

<style scoped>
/* ---------- Layout geral ---------- */
.auth-page {
  min-height: 100vh;
  background: var(--bg);
}

.auth-page.desktop {
  display: grid;
  grid-template-columns: 1.1fr 1fr;
}

/* ---------- Painel lateral (laptop) ---------- */
.auth-side {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px;
  color: white;
  background: linear-gradient(135deg, var(--primary), var(--primary-hover));
  position: relative;
  overflow: hidden;
}

/* círculos decorativos */
.auth-side::before,
.auth-side::after {
  content: '';
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
}
.auth-side::before {
  width: 420px;
  height: 420px;
  top: -140px;
  right: -140px;
}
.auth-side::after {
  width: 300px;
  height: 300px;
  bottom: -100px;
  left: -100px;
}

.side-content {
  position: relative;
  z-index: 1;
  max-width: 440px;
}

.side-title {
  margin: 32px 0 12px;
  font-size: 2.2rem;
  font-weight: 800;
  line-height: 1.15;
}

.side-text {
  margin-bottom: 28px;
  font-size: 1.05rem;
  opacity: 0.9;
}

.side-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 12px;
}

.side-list li {
  padding-left: 28px;
  position: relative;
  font-weight: 500;
}

.side-list li::before {
  content: '✓';
  position: absolute;
  left: 0;
  width: 20px;
  height: 20px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  font-size: 0.75rem;
}

/* ---------- Formulário ---------- */
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

.form-title {
  margin-bottom: 6px;
  font-size: 1.8rem;
  font-weight: 800;
  color: var(--text);
}

.login-hint {
  margin-bottom: 20px;
  text-align: center;
  color: var(--text-muted);
  font-size: 0.95rem;
}

.desktop .login-hint {
  text-align: left;
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
