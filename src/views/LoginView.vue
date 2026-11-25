<script setup>
import { reactive, shallowRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { PERSONAL_ROLES, ROUTE_NAMES, ROUTE_PATHS } from '@/constants'
import { useLoginState } from '@/stores/useLoginState'
import { state } from '@/stores/state'
import PublicShell from '@/components/layout/PublicShell.vue'
import ThemeButton from '@/components/ui/ThemeButton.vue'
import BrandLogo from '@/components/ui/BrandLogo.vue'
import photoSmall from '@/assets/images/login-van-manha-640.webp'
import photoLarge from '@/assets/images/login-van-manha-1120.webp'
import AuthPhotoPanel from '@/components/layout/AuthPhotoPanel.vue'
import { useDeviceLayout } from '@/composables/useDeviceLayout'
import { requestCurtainCover } from '@/composables/pageCurtain'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import ErrorMessage from '@/components/ui/ErrorMessage.vue'
import LoadingScreen from '@/components/ui/LoadingScreen.vue'

const router = useRouter()
const route = useRoute()
const { login } = useLoginState()

const erro = shallowRef('')
const redirecting = shallowRef(false)
// Com animações ativas, a cortina laranja cobre a tela; a tela de carregamento fica só sem animação.
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
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
    // Onda subindo ao entrar na conta; depois recarrega para descartar estado de sessões anteriores.
    await requestCurtainCover('up')
    window.location.replace(router.resolve(destination).href)
  } else {
    erro.value = state.error || 'E-mail ou senha inválidos.'
  }
}
const { isMobile } = useDeviceLayout()
</script>

<template>
  <PublicShell full-bleed>
    <div class="login-split">
      <AuthPhotoPanel
        class="login-photo"
        :small="photoSmall"
        :large="photoLarge"
        position="center 62%"
        :slides="[
          { quote: 'Cada rota no horário certo.', highlight: 'horário certo', caption: 'Acompanhe o transporte escolar do embarque à chegada, em tempo real.' },
          { quote: 'Saiba onde a van está agora.', highlight: 'agora', caption: 'Veja a localização da viagem e a previsão de chegada no seu ponto.' },
          { quote: 'Confirme sua viagem em um toque.', highlight: 'um toque', caption: 'Diga se vai na ida e na volta e a empresa organiza as vagas.' },
        ]"
        :features="[
          { icon: 'mdi-map-marker-path', text: 'Rotas em tempo real' },
          { icon: 'mdi-check-circle-outline', text: 'Confirmação de embarque' },
          { icon: 'mdi-bell-ring-outline', text: 'Avisos no celular' },
        ]"
      />

      <section class="form-panel">
        <div v-if="!isMobile" class="login-theme"><ThemeButton /></div>
        <form class="login-form" novalidate @submit.prevent="enviarLogin">
          <header class="login-head">
            <BrandLogo class="login-logo" spin="always" />
            <h1 class="login-title">
              Bem-vindo ao <span class="login-brand">NextRouter</span>
            </h1>
            <p class="login-hint">Entre na sua conta para continuar.</p>
          </header>

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
            <RouterLink :to="ROUTE_PATHS.FORGOT_PASSWORD" class="forgot-link">Recuperar senha</RouterLink>
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
        v-if="redirecting && reducedMotion"
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
  justify-content: flex-start;
  background: var(--bg);
  color: var(--text);
  padding: 28px 22px 36px;

  @include from($bp-desktop + 1px) {
    flex-direction: row;
    // Sem barra superior no computador: a tela inteira é do login.
    min-height: 100vh;
    min-height: 100dvh;
    padding: 0;
  }
}

.login-photo {
  margin: -28px -22px $space-6;
  height: 300px;

  // Vídeo maior no login: ocupa cerca de 60% da tela.
  @include from($bp-desktop + 1px) {
    flex-basis: 60%;
    height: auto;
    margin: 0;
  }
}

.form-panel {
  @include flex-center;
  position: relative;
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
  animation: rise-in $duration-reveal $ease-fluid 0.1s backwards;
}

.login-theme {
  position: absolute;
  top: $space-5;
  right: $space-6;
}

.login-head {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $space-2;
  margin-bottom: $space-6;
  text-align: center;
}

.login-logo {
  // Rodinha girando devagar e sem parar nas telas de entrada.
  --wheel-speed: 2.4s;
  width: 118px;
  height: auto;
  object-fit: contain;
  margin-bottom: $space-1;
  animation: rise-in $duration-reveal $ease-fluid backwards;
  transition: transform $duration-slow $ease-spring;

  &:hover {
    transform: rotate(-8deg) scale(1.08);
  }

  @include from($bp-desktop + 1px) {
    width: 150px;
  }
}

.login-title {
  font-size: clamp(1.7rem, 1.2rem + 1.6vw, 2.6rem);
  font-weight: $font-extrabold;
  line-height: 1.12;
  letter-spacing: -0.025em;
  color: var(--text);
  animation: rise-in $duration-reveal $ease-fluid 0.08s backwards;
}

.login-brand {
  white-space: nowrap;
  color: var(--primary);
}

.login-hint {
  font-size: $text-md;
  color: var(--text-muted);
}

.login-submit {
  margin-top: $space-3;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 14px 28px -10px rgba(236, 131, 20, 0.7);
  }
}

.forgot-row {
  text-align: center;
  margin-top: $space-4;
  font-size: $text-md;
  color: var(--text-muted);
}

.forgot-link,
.discover-link {
  position: relative;
  color: var(--primary-text);
  font-weight: $font-semibold;
  transition: color $duration-normal $ease-fluid;

  // Sublinhado que cresce da esquerda para a direita.
  &::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    bottom: -2px;
    height: 2px;
    border-radius: $radius-pill;
    background: var(--gradient-brand);
    transform: scaleX(0);
    transform-origin: right;
    transition: transform 0.35s $ease-fluid;
  }

  &:hover,
  &:focus-visible {
    color: var(--primary-strong);

    &::after {
      transform: scaleX(1);
      transform-origin: left;
    }
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
  position: relative;
  overflow: hidden;
  isolation: isolate;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  gap: $space-2;
  width: 100%;
  padding: $space-3 $space-4;
  border-radius: $radius-md;
  outline: 1.5px solid var(--primary);
  outline-offset: -1.5px;
  color: var(--primary-text);
  font-weight: $font-semibold;
  transition:
    color 0.35s $ease-fluid,
    transform $duration-normal $ease-fluid,
    box-shadow $duration-slow $ease-fluid;

  // Preenchimento laranja que entra da esquerda.
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: -1;
    background: var(--gradient-brand);
    transform: scaleX(0);
    transform-origin: left;
    transition: transform 0.4s $ease-fluid;
  }

  &:hover,
  &:focus-visible {
    color: var(--color-on-primary);
    transform: translateY(-2px);
    box-shadow: var(--shadow-primary);

    &::before {
      transform: scaleX(1);
    }
  }

  &:active {
    transform: scale(0.98);
  }
}

.discover-link {
  font-size: $text-md;
}
</style>
