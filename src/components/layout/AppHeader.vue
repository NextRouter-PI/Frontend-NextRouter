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
    <RouterLink to="/" class="logo">
      <img :src="Logo" alt="Logo">
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
  padding: 10px 20px;
  background: var(--superfice);
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 4px var(--shadow);
  z-index: 100;
}

.logo img {
  height: 50px;
  width: auto;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-nav-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  text-decoration: none;
  transition: background-color 0.25s ease, color 0.25s ease, transform 0.25s ease, box-shadow 0.25s ease;
}

.user-nav-btn .mdi {
  font-size: 26px;
}

.user-nav-btn:hover {
  color: var(--primary);
  transform: scale(1.08);
}

.user-nav-btn.active {
  background: var(--gradient-primary);
  color: var(--superfice);
  box-shadow: var(--shadow-primary);
}
</style>
