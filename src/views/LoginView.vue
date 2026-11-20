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

const router = useRouter()
const route = useRoute()
const { login } = useLoginState()

const erro = shallowRef('')
const form = reactive({
  email: '',
  senha: '',
})

function isPositiveIntString(value) {
  return typeof value === 'string' && /^[1-9]\d*$/.test(value) && Number.isSafeInteger(Number(value))
}

async function enviarLogin() {
  if (state.loading) return
  erro.value = ''

  const sucesso = await login(form.email, form.senha)

  if (sucesso) {
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

          <BaseInput
            v-model="form.email"
            type="email"
            variant="underline"
            placeholder="E-mail"
            aria-label="E-mail"
            autocomplete="email"
            required
            :disabled="state.loading"
          />

          <BaseInput
            v-model="form.senha"
            type="password"
            variant="underline"
            placeholder="Senha"
            aria-label="Senha"
            autocomplete="current-password"
            required
            :disabled="state.loading"
          />

          <ErrorMessage :message="erro" />

          <BaseButton type="submit" block size="lg" :loading="state.loading" class="login-submit">
            {{ state.loading ? 'Entrando...' : 'Entrar' }}
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
    flex: 1;
    background: var(--altbg);
    border-right: 1px solid var(--border);
    padding: $space-10;
  }
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
  font-size: 62px;
  line-height: 1;
  color: var(--primary);

  &-desktop {
    display: none;
  }

  @include from($bp-desktop + 1px) {
    &-mobile {
      display: none;
    }

    &-desktop {
      display: block;
      font-size: 76px;
      margin-top: $space-4;
    }
  }
}

.brand-welcome {
  margin-top: $space-2;
  color: var(--text-muted);
  font-size: $text-base;
  font-weight: $font-medium;
}

.brand-name {
  font-size: 2.1rem;
  font-weight: $font-extrabold;
  letter-spacing: 0.04em;

  @include from($bp-desktop + 1px) {
    font-size: 2.6rem;
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
}

.login-hint {
  font-size: 1.05rem;
  font-weight: $font-semibold;
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
  transition: background-color $duration-normal $ease-fluid, color $duration-normal $ease-fluid;

  &:hover {
    background: var(--primary);
    color: var(--color-on-primary);
  }
}

.discover-link {
  font-size: $text-md;
}
</style>
