<script setup>
import { RouterLink } from 'vue-router';
import RoleSelector from "@/components/auth/RoleSelector.vue";
import SignupIllustration from '@/components/ui/SignupIllustration.vue'
import { useDeviceLayout } from '@/composables/useDeviceLayout'

const { isMobile } = useDeviceLayout()
</script>

<template>
  <div class="signup-view" :class="{ desktop: !isMobile }">
    <aside v-if="!isMobile" class="side-design">
      <div class="side-content">
        <SignupIllustration/>
      </div>
    </aside>

    <main class="signup-main">
      <div class="signup-container">
        <div class="signup-header">
          <h1>Comece sua jornada</h1>
          <p class="subtitle">Escolha como deseja utilizar nossa plataforma</p>
        </div>

        <RoleSelector />

        <div class="signup-footer">
          <p class="login-link">
            Já possui uma conta?
            <RouterLink to="/login" class="login-button">Fazer login</RouterLink>
          </p>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
/* ============ BASE (mobile) ============ */
.signup-view {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  position: relative;
}

.signup-main {
  width: 100%;
  display: flex;
  justify-content: center;
}

.signup-container {
  width: 100%;
  max-width: 500px;
}

.signup-header {
  text-align: center;
  margin-bottom: 2.5rem;
}

.signup-header h1 {
  font-size: 2rem;
  color: var(--text);
  margin-bottom: 0.75rem;
  font-weight: 800;
}

.subtitle {
  font-size: 1rem;
  color: var(--text-muted);
  line-height: 1.5;
}

.signup-footer {
  text-align: center;
  padding-top: 1.5rem;
  border-top: 1px solid var(--border-primary);
}

.login-link {
  color: var(--text-muted);
  font-size: 0.95rem;
}

.login-button {
  color: var(--primary);
  text-decoration: none;
  font-weight: 600;
  margin-left: 0.25rem;
  transition: color 0.2s ease;
}

.login-button:hover {
  color: var(--primary-light);
  text-decoration: underline;
}

/* ============ DESKTOP ============ */
.signup-view.desktop {
  display: grid;
  grid-template-columns: 1fr 1.1fr;
  padding: 0;
  align-items: stretch;
  background: var(--bg);
}

.desktop .side-design {
  order: 2;   /* painel vai para a direita */
}

/* espelha os círculos decorativos */
.desktop .side-design::before {
  right: auto;
  left: -140px;
}
.desktop .side-design::after {
  left: auto;
  right: -100px;
}

/* ---- Painel lateral ---- */
.side-design {
  position: sticky;
  top: 0;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px;
  color: white;
  background: linear-gradient(135deg, var(--primary), var(--primary-hover));
  overflow: hidden;
}

/* círculos decorativos */
.side-design::before,
.side-design::after {
  content: '';
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
}

.side-design::before {
  width: 420px;
  height: 420px;
  top: -140px;
  right: -140px;
}

.side-design::after {
  width: 300px;
  height: 300px;
  bottom: -100px;
  left: -100px;
}

.side-content {
  position: relative;
  z-index: 1;
  max-width: 560px;
}

.side-title {
  margin: 20px 0 12px;
  font-size: 2.2rem;
  font-weight: 800;
  line-height: 1.15;
}

.side-text {
  font-size: 1.05rem;
  line-height: 1.6;
  opacity: 0.9;
}

/* ---- Área central com os botões de perfil ---- */
.desktop .signup-main {
  align-items: center;
  padding: 3rem 4rem;
}

.desktop .signup-container {
  max-width: 480px;
}

.desktop .signup-header h1 {
  font-size: 2.2rem;
  letter-spacing: -0.02em;
}
</style>
