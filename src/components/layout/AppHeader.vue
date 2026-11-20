<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import ThemeButton from '@/components/buttons/ThemeButton.vue'
import Logo from '@/assets/images/logo.png'

const route = useRoute()
const isUserRoute = computed(() => route.path.startsWith('/usuario'))
</script>

<template>
  <header class="header">
    <RouterLink to="/" class="logo" aria-label="NextRouter - Início">
      <img :src="Logo" alt="NextRouter" />
    </RouterLink>
    <div class="header-actions">
      <ThemeButton />
      <RouterLink
        to="/usuario/profile"
        class="user-nav-btn"
        :class="{ active: isUserRoute }"
        title="Usuário"
        aria-label="Seção de usuário"
      >
        <span class="mdi mdi-account" aria-hidden="true"></span>
      </RouterLink>
    </div>
  </header>
</template>

<style scoped>
.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: var(--header-height);
  padding: 0 18px;
  background: var(--chrome-bg);
  border-bottom: 2px solid var(--primary);
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.25);
  z-index: 100;
}

.logo {
  display: inline-flex;
  align-items: center;
}

.logo img {
  height: 36px;
  width: auto;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-nav-btn {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--chrome-text);
  background: rgba(255, 255, 255, 0.06);
  text-decoration: none;
  transition: background-color 0.22s var(--ease-fluid), color 0.22s var(--ease-fluid),
    transform 0.22s var(--ease-fluid), box-shadow 0.22s var(--ease-fluid);
}

.user-nav-btn .mdi {
  font-size: 22px;
}

.user-nav-btn:hover {
  color: var(--primary);
  background: rgba(236, 131, 20, 0.14);
  transform: scale(1.06);
}

.user-nav-btn:active {
  transform: scale(0.94);
}

.user-nav-btn.active {
  background: var(--primary);
  color: #ffffff;
  box-shadow: var(--shadow-primary);
}
</style>
