<script setup>
import { reactive, shallowRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useLoginState } from '@/stores/useLoginState'
import { state } from '@/stores/state'
import PublicShell from '@/components/layout/PublicShell.vue'

const router = useRouter()
const route = useRoute()
const { login } = useLoginState()

const erro = shallowRef('')
const showPassword = shallowRef(false)
const form = reactive({
  email: '',
  senha: '',
})

async function enviarLogin() {
  if (state.loading) return
  erro.value = ''

  const sucesso = await login(form.email, form.senha)

  if (sucesso) {
    const company = route.query.company
    const group = route.query.group
    const validCompany =
      typeof company === 'string' &&
      /^[1-9]\d*$/.test(company) &&
      Number.isSafeInteger(Number(company))
    const validGroup =
      typeof group === 'string' &&
      /^[1-9]\d*$/.test(group) &&
      Number.isSafeInteger(Number(group))
    const destination =
      validCompany && ['passenger', 'driver'].includes(state.role)
        ? { name: 'vinculos', query: validGroup ? { company, group } : { company } }
        : { name: 'home' }
    // Recarrega para descartar estado em memória de sessões anteriores.
    window.location.replace(router.resolve(destination).href)
  } else {
    erro.value = state.error || 'E-mail ou senha inválidos.'
  }
}
</script>

<template>
  <PublicShell>
    <section class="login-section">
      <div class="brand-block">
        <span class="mdi mdi-map-marker-radius brand-pin" aria-hidden="true"></span>
        <p class="brand-welcome">Bem vindo ao</p>
        <h1 class="brand-name">
          <span class="brand-accent">NEXT</span>ROUTER
        </h1>
      </div>

      <form class="login-form" @submit.prevent="enviarLogin">
        <p class="login-hint">Entrar em sua conta:</p>

        <div class="underline-field">
          <input
            v-model="form.email"
            type="email"
            class="underline-input"
            placeholder="E-mail"
            aria-label="E-mail"
            autocomplete="email"
            required
            :disabled="state.loading"
          />
        </div>

        <div class="underline-field password-field">
          <input
            v-model="form.senha"
            :type="showPassword ? 'text' : 'password'"
            class="underline-input"
            placeholder="Senha"
            aria-label="Senha"
            autocomplete="current-password"
            required
            :disabled="state.loading"
          />
          <button
            type="button"
            class="toggle-password"
            :aria-label="showPassword ? 'Ocultar senha' : 'Mostrar senha'"
            @click="showPassword = !showPassword"
          >
            <span
              class="mdi"
              :class="showPassword ? 'mdi-eye-off-outline' : 'mdi-eye-outline'"
              aria-hidden="true"
            ></span>
          </button>
        </div>

        <p v-if="erro" class="login-error" role="alert">{{ erro }}</p>

        <button type="submit" class="btn-enter" :disabled="state.loading">
          {{ state.loading ? 'Entrando...' : 'Entrar' }}
        </button>

        <p class="forgot-row">
          Esqueceu a senha?
          <RouterLink to="/forgot-password" class="forgot-link">Clique Aqui</RouterLink>
        </p>

        <div class="bottom-actions">
          <RouterLink to="/signup" class="btn-create">Criar nova conta</RouterLink>
          <RouterLink to="/empresas" class="discover-link">
            Pesquisar empresas sem entrar
          </RouterLink>
        </div>
      </form>
    </section>
  </PublicShell>
</template>

<style scoped>
.login-section {
  width: 100%;
  max-width: 380px;
  margin: 0 auto;
  padding: 16px 6px 12px;
  display: flex;
  flex-direction: column;
}

.brand-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin-bottom: 34px;
}

.brand-pin {
  font-size: 64px;
  line-height: 1;
  color: var(--primary-orange);
  margin-bottom: 12px;
}

.brand-welcome {
  margin: 0;
  font-size: 1.75rem;
  font-weight: 800;
  line-height: 1.15;
  color: var(--text);
}

.brand-name {
  margin: 2px 0 0;
  font-size: 2rem;
  font-weight: 900;
  line-height: 1.1;
  letter-spacing: 0.5px;
  color: var(--text);
}

.brand-accent {
  color: var(--primary-orange);
}

.login-form {
  display: flex;
  flex-direction: column;
}

.login-hint {
  margin: 0 0 22px;
  font-size: 0.98rem;
  color: var(--text);
  opacity: 0.9;
}

.underline-field {
  position: relative;
  margin-bottom: 24px;
}

.underline-input {
  width: 100%;
  padding: 10px 4px;
  border: none;
  border-bottom: 2px solid var(--primary-orange);
  border-radius: 0;
  background: transparent;
  color: var(--text);
  font-size: 1rem;
  box-sizing: border-box;
  transition: border-color 0.2s ease;
}

.password-field .underline-input {
  padding-right: 40px;
}

.underline-input::placeholder {
  color: var(--primary);
  opacity: 0.85;
}

.underline-input:focus {
  outline: none;
  border-bottom-color: var(--primary-light);
}

.toggle-password {
  position: absolute;
  right: 2px;
  top: 50%;
  transform: translateY(-50%);
  border: none;
  background: transparent;
  color: var(--primary);
  font-size: 1.25rem;
  cursor: pointer;
  padding: 4px;
}

.login-error {
  margin: -8px 0 14px;
  font-size: 0.88rem;
  font-weight: 500;
  color: var(--danger);
  text-align: center;
}

.btn-enter {
  width: 100%;
  min-height: 48px;
  margin-top: 8px;
  border: none;
  border-radius: 999px;
  background: var(--primary-orange);
  color: #ffffff;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.btn-enter:hover:not(:disabled) {
  background: var(--primary-hover);
}

.btn-enter:disabled {
  opacity: 0.7;
  cursor: wait;
}

.forgot-row {
  margin: 20px 0 0;
  text-align: center;
  font-size: 0.95rem;
  color: var(--text);
}

.forgot-link {
  color: var(--primary-orange);
  font-weight: 700;
  text-decoration: none;
  margin-left: 4px;
}

.forgot-link:hover {
  text-decoration: underline;
}

.bottom-actions {
  margin-top: 48px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
}

.btn-create {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 48px;
  border: 1.5px solid var(--primary-orange);
  border-radius: 999px;
  background: transparent;
  color: var(--primary-orange);
  font-size: 1rem;
  font-weight: 600;
  text-decoration: none;
  transition: background-color 0.2s ease, color 0.2s ease;
}

.btn-create:hover {
  background: var(--primary-orange);
  color: #ffffff;
}

.discover-link {
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--text-muted);
  text-decoration: underline;
}

.discover-link:hover {
  color: var(--primary);
}
</style>
