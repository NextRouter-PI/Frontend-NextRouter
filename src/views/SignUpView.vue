<script setup>
import { RouterLink } from 'vue-router'
import BrandLogo from '@/components/ui/BrandLogo.vue'
import photoSmall from '@/assets/images/cadastro-campus-640.webp'
import photoLarge from '@/assets/images/cadastro-campus-1120.webp'
import PublicShell from '@/components/layout/PublicShell.vue'
import AuthPhotoPanel from '@/components/layout/AuthPhotoPanel.vue'
import ThemeButton from '@/components/ui/ThemeButton.vue'
import RoleSelector from '@/features/auth/components/RoleSelector.vue'
import { useDeviceLayout } from '@/composables/useDeviceLayout'

const { isMobile } = useDeviceLayout()
</script>

<template>
  <PublicShell full-bleed>
    <div class="signup-split">
      <AuthPhotoPanel
        class="signup-photo"
        side="right"
        :small="photoSmall"
        :large="photoLarge"
        position="center 60%"
        :slides="[
          { quote: 'Seu caminho começa aqui.', highlight: 'começa aqui', caption: 'Passageiros, motoristas e empresas conectados na mesma rota.' },
          { quote: 'Empresas organizam tudo.', highlight: 'organizam', caption: 'Grupos, frota, pontos e operação do dia num só painel.' },
          { quote: 'Motoristas com a lista na mão.', highlight: 'lista na mão', caption: 'Quem embarca em cada parada, direto no celular.' },
        ]"
        :features="[
          { icon: 'mdi-map-marker-path', text: 'Rotas em tempo real' },
          { icon: 'mdi-check-circle-outline', text: 'Confirmação de embarque' },
          { icon: 'mdi-bell-ring-outline', text: 'Avisos no celular' },
        ]"
      />

      <section class="signup-panel">
        <div v-if="!isMobile" class="signup-theme"><ThemeButton /></div>
        <div class="signup-choice">
          <header class="choice-header">
            <BrandLogo class="choice-logo" spin="always" />
            <p class="choice-eyebrow">Criar conta</p>
            <h1 class="choice-heading">Como você vai usar o <span>NextRouter</span>?</h1>
          </header>

          <RoleSelector stacked />

          <div class="signup-footer">
            <p class="footer-row">
              Já possui uma conta?
              <RouterLink to="/login" class="footer-link">Fazer login</RouterLink>
            </p>
            <p class="footer-row">
              <RouterLink to="/companies" class="footer-link">Pesquisar empresas sem criar conta</RouterLink>
            </p>
          </div>
        </div>
      </section>
    </div>
  </PublicShell>
</template>

<style lang="scss" scoped>
.signup-split {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--bg);
  color: var(--text);
  padding: 28px 22px 36px;

  @include from($bp-desktop + 1px) {
    flex-direction: row;
    // Sem barra superior no computador: a tela inteira é do cadastro.
    min-height: 100vh;
    min-height: 100dvh;
    padding: 0;
  }
}

.signup-photo {
  margin: -28px -22px $space-6;

  @include from($bp-desktop + 1px) {
    margin: 0;
  }
}

.signup-panel {
  @include flex-center;
  position: relative;
  width: 100%;

  @include from($bp-desktop + 1px) {
    flex: 1;
    padding: $space-10;
  }
}

.signup-theme {
  position: absolute;
  top: $space-5;
  left: $space-6;
}

.signup-choice {
  width: 100%;
  max-width: 460px;
  animation: rise-in $duration-reveal $ease-fluid 0.1s backwards;
}

.choice-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: $space-6;
  text-align: center;
}

.choice-logo {
  // Rodinha girando devagar e sem parar nas telas de entrada.
  --wheel-speed: 2.4s;
  width: 104px;
  height: auto;
  margin-bottom: $space-3;
  transition: transform $duration-slow $ease-spring;

  &:hover {
    transform: none;
  }

  @include from($bp-desktop + 1px) {
    width: 130px;
  }
}

.choice-eyebrow {
  margin-bottom: 6px;
  color: var(--primary-text);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.choice-heading {
  margin: 0;
  font-size: clamp(1.6rem, 1.2rem + 1.4vw, 2.3rem);
  line-height: 1.15;
  font-weight: 800;
  letter-spacing: -0.025em;
  color: var(--text);

  span {
    color: var(--primary);
    white-space: nowrap;
  }
}

.signup-footer {
  text-align: center;
  padding-top: 20px;
  border-top: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.footer-row {
  margin: 0;
  color: var(--text-muted);
  font-size: 0.92rem;
}

// Mesmo hover dos links do login: sublinhado em degradê que cresce.
.footer-link {
  position: relative;
  color: var(--primary-text);
  font-weight: 600;
  transition: color $duration-normal $ease-fluid;

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
</style>
