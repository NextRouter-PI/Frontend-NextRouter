<script setup>
import { reactive, shallowRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { PERSONAL_ROLES, ROUTE_NAMES, ROUTE_PATHS } from '@/constants'
import { useLoginState } from '@/stores/useLoginState'
import { state } from '@/stores/state'
import PublicShell from '@/components/layout/PublicShell.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import ErrorMessage from '@/components/ui/ErrorMessage.vue'
import LoadingScreen from '@/components/ui/LoadingScreen.vue'

const router = useRouter()
const route = useRoute()
const { login } = useLoginState()

const erro = shallowRef('')
const redirecting = shallowRef(false)
const form = reactive({
  email: '',
  senha: '',
})
const fieldErrors = reactive({
  email: '',
  senha: '',
})

function isPositiveIntString(value) {
  return typeof value === 'string' && /^[1-9]\d*$/.test(value) && Number.isSafeInteger(Number(value))
}

async function enviarLogin() {
  if (state.loading || redirecting.value) return
  erro.value = ''
  fieldErrors.email = !form.email.trim() ? 'E-mail é obrigatório' : ''
  fieldErrors.senha = !form.senha.trim() ? 'Senha é obrigatória' : ''
  if (fieldErrors.email || fieldErrors.senha) return

  const sucesso = await login(form.email, form.senha)

  if (sucesso) {
    redirecting.value = true
    const { company, group } = route.query
    const validCompany = isPositiveIntString(company)
    const validGroup = isPositiveIntString(group)
    const destination =
      validCompany && PERSONAL_ROLES.includes(state.role)
        ? { name: ROUTE_NAMES.MEMBERSHIPS, query: validGroup ? { company, group } : { company } }
        : { name: ROUTE_NAMES.HOME }
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
        <svg class="route-art" viewBox="0 0 600 700" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <defs>
            <pattern id="login-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M40 0H0V40" fill="none" stroke="currentColor" stroke-width="0.6" />
            </pattern>
          </defs>
          <rect class="route-grid" width="600" height="700" fill="url(#login-grid)" />
          <path class="route-street" d="M-20 520 C 120 500, 160 380, 300 360 S 470 220, 620 180" />
          <path class="route-street" d="M80 -20 C 110 160, 60 300, 140 460 S 220 640, 200 720" />
          <path class="route-line" d="M90 560 C 160 470, 210 420, 300 400 S 420 330, 470 250 S 520 150, 540 110" />
          <circle class="route-stop" cx="90" cy="560" r="7" />
          <circle class="route-stop" cx="300" cy="400" r="7" />
          <circle class="route-stop route-stop--end" cx="540" cy="110" r="9" />
          <circle class="route-pulse" cx="540" cy="110" r="9" />
          <circle class="route-bus" r="6" />
        </svg>
        <div class="brand-block">
          <svg
            class="brand-pin brand-pin-mobile"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              class="brand-pin-ring"
              d="M12 20c-4.42 0-8-1.34-8-3 0-1.08 1.54-2.03 3.85-2.56l.68 1.36C6.95 16.17 5.8 16.69 5.8 17c0 .77 2.55 1.7 6.2 1.7s6.2-.93 6.2-1.7c0-.31-1.15-.83-2.73-1.2l.68-1.36C18.46 14.97 20 15.92 20 17c0 1.66-3.58 3-8 3z"
            />
            <path
              class="brand-pin-head"
              d="M12 2C8.69 2 6 4.69 6 8c0 4.5 6 9.5 6 9.5s6-5 6-9.5c0-3.31-2.69-6-6-6zm0 8.2a2.2 2.2 0 1 1 0-4.4 2.2 2.2 0 0 1 0 4.4z"
            />
          </svg>
          <p class="brand-welcome">Bem vindo ao</p>
          <h1 class="brand-name">
            <span class="brand-accent">NEXT</span><span class="brand-rest">ROUTER</span>
          </h1>
          <p class="brand-tagline">Transporte escolar e universitário com rotas, presença e GPS em tempo real.</p>
          <svg
            class="brand-pin brand-pin-desktop"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              class="brand-pin-ring"
              d="M12 20c-4.42 0-8-1.34-8-3 0-1.08 1.54-2.03 3.85-2.56l.68 1.36C6.95 16.17 5.8 16.69 5.8 17c0 .77 2.55 1.7 6.2 1.7s6.2-.93 6.2-1.7c0-.31-1.15-.83-2.73-1.2l.68-1.36C18.46 14.97 20 15.92 20 17c0 1.66-3.58 3-8 3z"
            />
            <path
              class="brand-pin-head"
              d="M12 2C8.69 2 6 4.69 6 8c0 4.5 6 9.5 6 9.5s6-5 6-9.5c0-3.31-2.69-6-6-6zm0 8.2a2.2 2.2 0 1 1 0-4.4 2.2 2.2 0 0 1 0 4.4z"
            />
          </svg>
        </div>
      </section>

      <section class="form-panel">
        <form class="login-form" novalidate @submit.prevent="enviarLogin">
          <p class="login-hint">Entrar em sua conta:</p>

          <BaseInput
            v-model="form.email"
            type="email"
            variant="floating"
            label="E-mail"
            autocomplete="email"
            required
            :error="fieldErrors.email"
            :disabled="state.loading || redirecting"
            @input="fieldErrors.email = ''"
          />

          <BaseInput
            v-model="form.senha"
            type="password"
            variant="floating"
            label="Senha"
            autocomplete="current-password"
            required
            :error="fieldErrors.senha"
            :disabled="state.loading || redirecting"
            @input="fieldErrors.senha = ''"
          />

          <ErrorMessage :message="erro" />

          <BaseButton
            type="submit"
            block
            size="lg"
            :loading="state.loading || redirecting"
            class="login-submit"
          >
            {{ redirecting ? 'Redirecionando...' : state.loading ? 'Entrando...' : 'Entrar' }}
          </BaseButton>

          <p class="forgot-row">
            Esqueceu a senha?
            <RouterLink :to="ROUTE_PATHS.FORGOT_PASSWORD" class="forgot-link">Clique Aqui</RouterLink>
          </p>

          <div class="bottom-actions">
            <RouterLink :to="ROUTE_PATHS.SIGNUP" class="btn-create">Criar nova conta</RouterLink>
            <RouterLink :to="ROUTE_PATHS.COMPANIES" class="discover-link">
              Pesquisar empresas sem entrar
            </RouterLink>
          </div>
        </form>
      </section>
    </div>

    <Transition name="fade-scale">
      <LoadingScreen
        v-if="redirecting"
        overlay
        title="Entrando no NextRouter..."
        subtitle="Redirecionando para seu painel"
      />
    </Transition>
  </PublicShell>
</template>

<style lang="scss" scoped>
.login-split {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  background: var(--bg);
  color: var(--text);
  padding: 28px 22px 36px;

  @include from($bp-desktop + 1px) {
    flex-direction: row;
    padding: 0;
  }
}

.brand-panel {
  @include flex-center;
  flex-direction: column;

  @include from($bp-desktop + 1px) {
    position: relative;
    overflow: hidden;
    isolation: isolate;
    flex: 1;
    padding: $space-10;
    background:
      radial-gradient(38rem 28rem at 80% 10%, rgba(236, 131, 20, 0.28), transparent 60%),
      radial-gradient(30rem 24rem at 10% 100%, rgba(245, 154, 50, 0.16), transparent 65%),
      var(--chrome-bg);
    color: var(--chrome-text);

    .brand-rest {
      color: var(--chrome-text);
    }

    .brand-welcome,
    .brand-tagline {
      color: var(--chrome-muted);
    }
  }
}

// Mapa ilustrado com uma rota animada: só no desktop, atrás da marca.
.route-art {
  display: none;

  @include from($bp-desktop + 1px) {
    display: block;
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    z-index: -1;
    color: rgba(255, 255, 255, 0.05);
  }
}

.route-street {
  fill: none;
  stroke: rgba(255, 255, 255, 0.07);
  stroke-width: 18;
  stroke-linecap: round;
}

.route-line {
  fill: none;
  stroke: var(--primary);
  stroke-width: 3;
  stroke-linecap: round;
  stroke-dasharray: 10 10;
  filter: drop-shadow(0 0 6px rgba(236, 131, 20, 0.7));
  animation: route-dash 9s linear infinite;
}

.route-stop {
  fill: var(--chrome-bg);
  stroke: var(--primary-light);
  stroke-width: 3;

  &--end {
    fill: var(--primary);
  }
}

.route-pulse {
  fill: none;
  stroke: var(--primary);
  stroke-width: 2;
  transform-box: fill-box;
  transform-origin: center;
  animation: pulse-ring 2.2s ease-out infinite;
}

.route-bus {
  fill: #fff;
  filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.9));
  offset-path: path('M90 560 C 160 470, 210 420, 300 400 S 420 330, 470 250 S 520 150, 540 110');
  animation: bus-drive 7s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite;
}

@keyframes bus-drive {
  0% {
    offset-distance: 0%;
    opacity: 0;
  }
  8%,
  92% {
    opacity: 1;
  }
  100% {
    offset-distance: 100%;
    opacity: 0;
  }
}

.brand-tagline {
  max-width: 30ch;
  margin-top: $space-3;
  color: var(--text-muted);
  font-size: $text-md;
  line-height: 1.55;
  animation: rise-in $duration-reveal $ease-fluid 0.2s both;
}

.brand-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin-bottom: $space-8;

  @include from($bp-desktop + 1px) {
    margin-bottom: 0;
  }
}

.brand-pin {
  width: 68px;
  height: 68px;
  color: var(--primary);
  overflow: visible;

  &-head {
    transform-origin: 12px 17px;
    animation: pin-hop 1.9s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite;
  }

  &-desktop {
    display: none;
  }

  @include from($bp-desktop + 1px) {
    &-mobile {
      display: none;
    }

    &-desktop {
      display: block;
      width: 82px;
      height: 82px;
      margin-top: $space-4;
    }
  }
}

@keyframes pin-hop {
  0%,
  100% {
    transform: translateY(0) scale(1, 1);
  }
  18% {
    transform: translateY(0.4px) scale(1.05, 0.94);
  }
  46% {
    transform: translateY(-4.2px) scale(0.96, 1.05);
  }
  74% {
    transform: translateY(0.3px) scale(1.04, 0.96);
  }
  88% {
    transform: translateY(-1px) scale(0.99, 1.01);
  }
}

.brand-welcome {
  margin-top: $space-2;
  color: var(--text-muted);
  font-size: $text-base;
  font-weight: $font-medium;
}

.brand-name {
  animation: rise-in $duration-reveal $ease-fluid both;
  font-size: 2.1rem;
  font-weight: $font-extrabold;
  letter-spacing: 0.04em;

  @include from($bp-desktop + 1px) {
    font-size: clamp(2.6rem, 1.6rem + 2.4vw, 3.6rem);
    letter-spacing: 0.01em;
  }
}

.brand-accent {
  color: var(--primary);
}

.brand-rest {
  color: var(--text);
}

.form-panel {
  @include flex-center;
  width: 100%;

  @include from($bp-desktop + 1px) {
    flex: 1;
    padding: $space-10;
  }
}

.login-form {
  width: 100%;
  max-width: 380px;
  display: flex;
  flex-direction: column;
  animation: rise-in $duration-reveal $ease-fluid 0.1s both;
}

.login-hint {
  font-size: 1.4rem;
  font-weight: $font-extrabold;
  letter-spacing: -0.02em;
  margin-bottom: $space-5;
  color: var(--text);
}

.login-submit {
  margin-top: $space-3;
}

.forgot-row {
  text-align: center;
  margin-top: $space-4;
  font-size: $text-md;
  color: var(--text-muted);
}

.forgot-link,
.discover-link {
  color: var(--primary);
  font-weight: $font-semibold;

  &:hover {
    text-decoration: underline;
  }
}

.bottom-actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $space-3;
  margin-top: $space-6;
  padding-top: $space-5;
  border-top: 1px solid var(--border);
}

.btn-create {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  padding: $space-3 $space-4;
  border-radius: $radius-md;
  outline: 1.5px solid var(--primary);
  outline-offset: -1.5px;
  color: var(--primary);
  font-weight: $font-semibold;
  transition:
    background-color $duration-normal $ease-fluid,
    color $duration-normal $ease-fluid,
    transform $duration-normal $ease-fluid,
    box-shadow $duration-normal $ease-fluid;

  &:hover {
    background: var(--primary);
    color: var(--color-on-primary);
    transform: translateY(-1px);
    box-shadow: var(--shadow-primary);
  }
}

.discover-link {
  font-size: $text-md;
}
</style>
