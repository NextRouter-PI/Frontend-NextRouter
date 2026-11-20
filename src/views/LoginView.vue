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
  <PublicShell full-bleed>
    <div class="login-split">
      <section class="brand-panel">
        <div class="brand-block">
          <span class="mdi mdi-map-marker-radius brand-pin brand-pin-mobile" aria-hidden="true"></span>
          <p class="brand-welcome">Bem vindo ao</p>
          <h1 class="brand-name">
            <span class="brand-accent">NEXT</span><span class="brand-rest">ROUTER</span>
          </h1>
          <span class="mdi mdi-map-marker-radius brand-pin brand-pin-desktop" aria-hidden="true"></span>
        </div>
      </section>

      <section class="form-panel">
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

          <Transition name="fade-slide">
            <p v-if="erro" class="login-error" role="alert">{{ erro }}</p>
          </Transition>

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
    </div>
  </PublicShell>
</template>

<style scoped>
.login-split {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  background: var(--chrome-bg);
  color: var(--chrome-text);
  padding: 28px 22px 36px;
}

.brand-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.brand-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin-bottom: 32px;
}

.brand-pin {
  font-size: 62px;
  line-height: 1;
  color: var(--primary);
}

.brand-pin-mobile {
  margin-bottom: 12px;
}

.brand-pin-desktop {
  display: none;
}

.brand-welcome {
  margin: 0;
  font-size: 1.7rem;
  font-weight: 800;
  line-height: 1.15;
  color: #ffffff;
}

.brand-name {
  margin: 2px 0 0;
  font-size: 2rem;
  font-weight: 900;
  line-height: 1.1;
  letter-spacing: 0.5px;
}

.brand-accent {
  color: var(--primary);
}

.brand-rest {
  color: #ffffff;
}

.form-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.login-form {
  width: 100%;
  max-width: 360px;
  display: flex;
  flex-direction: column;
}

.login-hint {
  margin: 0 0 22px;
  font-size: 0.96rem;
  color: var(--chrome-text);
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
  border-bottom: 1.5px solid var(--primary);
  border-radius: 0;
  background: transparent;
  color: #ffffff;
  font-size: 0.98rem;
  box-sizing: border-box;
  transition: border-color 0.2s var(--ease-fluid);
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
  min-height: 46px;
  margin-top: 8px;
  border: none;
  border-radius: 999px;
  background: var(--primary);
  color: #ffffff;
  font-size: 0.98rem;
  font-weight: 700;
  cursor: pointer;
  transition: background-color 0.2s var(--ease-fluid), transform 0.16s var(--ease-fluid),
    box-shadow 0.2s var(--ease-fluid);
}

.btn-enter:hover:not(:disabled) {
  background: var(--primary-hover);
  box-shadow: var(--shadow-primary);
}

.btn-enter:active:not(:disabled) {
  transform: scale(0.98);
}

.btn-enter:disabled {
  opacity: 0.7;
  cursor: wait;
}

.forgot-row {
  margin: 18px 0 0;
  text-align: center;
  font-size: 0.92rem;
  color: var(--chrome-text);
}

.forgot-link {
  color: var(--primary);
  font-weight: 700;
  text-decoration: none;
  margin-left: 4px;
}

.forgot-link:hover {
  opacity: 0.85;
}

.bottom-actions {
  margin-top: 38px;
  padding-top: 22px;
  border-top: 1px solid rgba(236, 131, 20, 0.35);
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
  min-height: 46px;
  border: 1.5px solid var(--primary);
  border-radius: 999px;
  background: transparent;
  color: var(--chrome-text);
  font-size: 0.96rem;
  font-weight: 600;
  text-decoration: none;
  transition: background-color 0.2s var(--ease-fluid), color 0.2s var(--ease-fluid),
    transform 0.16s var(--ease-fluid);
}

.btn-create:hover {
  background: var(--primary);
  color: #ffffff;
}

.btn-create:active {
  transform: scale(0.98);
}

.discover-link {
  font-size: 0.86rem;
  font-weight: 600;
  color: var(--chrome-muted);
  text-decoration: none;
  transition: color 0.2s ease;
}

.discover-link:hover {
  color: var(--primary);
}

/* Desktop split-screen fiel ao Login Desktop.png */
@media (min-width: 900px) {
  .login-split {
    flex-direction: row;
    align-items: stretch;
    padding: 0;
  }

  .brand-panel {
    flex: 1.05;
    background: var(--primary);
    padding: 48px 40px;
  }

  .brand-block {
    margin-bottom: 0;
    align-items: flex-start;
    text-align: left;
  }

  .brand-pin-mobile {
    display: none;
  }

  .brand-pin-desktop {
    display: block;
    color: #111113;
    font-size: 64px;
    margin-top: 28px;
    align-self: center;
  }

  .brand-welcome {
    font-size: 2.3rem;
    color: #ffffff;
  }

  .brand-name {
    font-size: 3.1rem;
    letter-spacing: 1px;
  }

  .brand-accent {
    color: #111113;
  }

  .brand-rest {
    color: #ffffff;
  }

  .form-panel {
    flex: 1;
    background: var(--chrome-bg);
    padding: 48px 40px;
  }
}
</style>
