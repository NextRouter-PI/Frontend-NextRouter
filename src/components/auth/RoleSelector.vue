<script setup>
import { RouterLink } from 'vue-router'

const roles = [
  {
    to: '/signup/usuario/',
    icon: 'mdi-seat-passenger',
    title: 'Passageiro',
  },
  {
    to: '/signup/motorista/',
    icon: 'mdi-account-tie-hat',
    title: 'Motorista',
  },
  {
    to: '/signup/empresa/',
    icon: 'mdi-office-building-outline',
    title: 'Empresa',
  },
]
</script>

<template>
  <div class="role-select">
    <RouterLink
      v-for="role in roles"
      :key="role.title"
      :to="role.to"
      class="role-card"
    >
      <span class="role-title">{{ role.title }}</span>
      <span class="mdi role-icon" :class="role.icon" aria-hidden="true"></span>
    </RouterLink>
  </div>
</template>

<style scoped>
.role-select {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 32px;
}

.role-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 76px;
  padding: 18px 24px;
  background: var(--primary-orange);
  color: #ffffff;
  border-radius: 12px;
  text-decoration: none;
  box-shadow: 0 4px 12px rgba(223, 128, 26, 0.28);
  transition: transform 0.2s ease, background-color 0.2s ease;
}

.role-card:hover {
  background: var(--primary-hover);
  transform: translateY(-2px);
}

.role-title {
  font-size: 1.3rem;
  font-weight: 700;
  color: #ffffff;
}

.role-icon {
  font-size: 2.4rem;
  color: #ffffff;
}
</style>
