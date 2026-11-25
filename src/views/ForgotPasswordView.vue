<script setup>
import { RouterLink } from 'vue-router'
import BrandLogo from '@/components/ui/BrandLogo.vue'
import photoSmall from '@/assets/images/recuperar-estrada-640.webp'
import photoLarge from '@/assets/images/recuperar-estrada-1120.webp'
import PublicShell from '@/components/layout/PublicShell.vue'
import AuthPhotoPanel from '@/components/layout/AuthPhotoPanel.vue'
import ThemeButton from '@/components/ui/ThemeButton.vue'
import PasswordResetForm from '@/features/auth/components/PasswordResetForm.vue'
import { useDeviceLayout } from '@/composables/useDeviceLayout'

const { isMobile } = useDeviceLayout()
</script>

<template>
  <PublicShell full-bleed>
    <div class="forgot-split">
      <AuthPhotoPanel class="forgot-photo" side="right" :small="photoSmall" :large="photoLarge" position="center 60%"
        :slides="[
          { quote: 'Todo caminho tem volta.', highlight: 'volta', caption: 'Recupere seu acesso em poucos passos e siga viagem.' },
          { quote: 'Um código direto no seu e-mail.', highlight: 'código', caption: 'Confirme que é você e crie uma nova senha com segurança.' },
        ]"
      />

      <section class="forgot-panel">
        <div v-if="!isMobile" class="forgot-theme"><ThemeButton /></div>
        <div class="forgot-content">
          <header class="forgot-header">
            <BrandLogo class="forgot-logo" spin="always" />
            <p class="forgot-eyebrow">Recuperar senha</p>
            <h1 class="forgot-heading">Esqueceu a <span>senha</span>?</h1>
          </header>

          <div class="forgot-card">
            <PasswordResetForm />
          </div>

          <p class="forgot-footer">
            Lembrou a senha?
            <RouterLink to="/login" class="back-link">Voltar para o login</RouterLink>
          </p>
        </div>
      </section>
    </div>
  </PublicShell>
</template>

<style lang="scss" scoped>
.forgot-split {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--bg);
  color: var(--text);
  padding: 28px 22px 36px;

  @include from($bp-desktop + 1px) {
    flex-direction: row;
    // Sem barra superior no computador: a tela inteira é da recuperação.
    min-height: 100vh;
    min-height: 100dvh;
    padding: 0;
  }
}

.forgot-photo {
  margin: -28px -22px $space-6;

  @include from($bp-desktop + 1px) {
    margin: 0;
  }
}

.forgot-panel {
  @include flex-center;
  position: relative;
  width: 100%;

  @include from($bp-desktop + 1px) {
    flex: 1;
    padding: $space-10;
  }
}

.forgot-theme {
  position: absolute;
  top: $space-5;
  left: $space-6;
}

.forgot-content {
  width: 100%;
  max-width: 420px;
  animation: rise-in $duration-reveal $ease-fluid 0.1s backwards;
}

.forgot-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: $space-6;
  text-align: center;
}

.forgot-logo {
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

.forgot-eyebrow {
  margin-bottom: 6px;
  color: var(--primary-text);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.forgot-heading {
  margin: 0;
  font-size: clamp(1.6rem, 1.2rem + 1.4vw, 2.3rem);
  line-height: 1.15;
  font-weight: 800;
  letter-spacing: -0.025em;
  color: var(--text);

  span {
    color: var(--primary);
  }
}

.forgot-card {
  position: relative;
  overflow: hidden;
  @include surface-card($space-6, $radius-xl);
  box-shadow: 0 24px 48px -28px rgba(28, 28, 31, 0.35);

  // Faixa laranja no topo, igual ao cartão do cadastro.
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: var(--gradient-brand);
  }
}

.forgot-footer {
  margin-top: $space-5;
  text-align: center;
  color: var(--text-muted);
  font-size: 0.92rem;
}

// Mesmo hover dos links do login: sublinhado em degradê que cresce.
.back-link {
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
