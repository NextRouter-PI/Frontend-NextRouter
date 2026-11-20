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
    icon: 'mdi-steering',
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
/* Mobile-first: 3 botões laranja full-width (Login.png) */
.role-select {
  display: flex;
  flex-direction: column;
  gap: 18px;
  margin-bottom: 36px;
}

.role-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 74px;
  padding: 18px 24px;
  background: var(--primary);
  color: #ffffff;
  border: 1.5px solid var(--primary);
  border-radius: 12px;
  text-decoration: none;
  box-shadow: var(--shadow);
  transition: transform 0.22s var(--ease-fluid), background-color 0.22s var(--ease-fluid),
    box-shadow 0.22s var(--ease-fluid), border-color 0.22s var(--ease-fluid);
}

.role-card:hover {
  background: var(--primary-hover);
  transform: translateY(-2px);
  box-shadow: var(--shadow-primary);
}

.role-card:active {
  transform: scale(0.98);
}

.role-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #ffffff;
}

.role-icon {
  font-size: 2.3rem;
  color: #ffffff;
}

/* Desktop: 3 cards quadrados brancos com borda laranja (Login Desktop.png) */
@media (min-width: 768px) {
  .role-select {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 24px;
    margin-bottom: 42px;
  }

  .role-card {
    flex-direction: column-reverse;
    justify-content: center;
    gap: 14px;
    min-height: 185px;
    padding: 26px 20px;
    background: var(--superfice);
    color: var(--primary);
    border: 1.5px solid var(--primary);
    box-shadow: var(--shadow);
  }

  .role-card:hover {
    background: rgba(236, 131, 20, 0.06);
    transform: translateY(-4px);
    box-shadow: var(--shadow-primary);
  }

  .role-title {
    color: var(--primary);
    font-size: 1.15rem;
  }

  .role-icon {
    font-size: 3.4rem;
    color: var(--primary);
  }
}
</style>
