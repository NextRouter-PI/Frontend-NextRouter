<script setup>
import { RouterLink } from 'vue-router';

const roles = [
  {
    to: '/signup/usuario/',
    icon: 'mdi-seat-passenger',
    title: 'Passageiro',
    desc: 'Encontre motoristas parceiros e empresas para suas viagens'
  },
  {
    to: '/signup/motorista/',
    icon: 'mdi-bus',
    title: 'Motorista',
    desc: 'Ofereça seus serviços de transporte e ganhe dinheiro'
  },
  {
    to: '/signup/empresa/',
    icon: 'mdi-domain',
    title: 'Empresa',
    desc: 'Gerencie uma frota de veículos e motoristas'
  }
];
</script>

<template>
  <div class="role-select">
    <RouterLink
      v-for="role in roles"
      :key="role.title"
      :to="role.to"
      class="role-card"
    >
      <span class="mdi" :class="role.icon"></span>
      <div class="card-content">
        <h3>{{ role.title }}</h3>
        <p>{{ role.desc }}</p>
      </div>
      <div class="card-arrow">→</div>
    </RouterLink>
  </div>
</template>

<style scoped>
.role-select {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2.5rem;
}

.role-card {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  padding: 1.5rem;
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 16px;
  text-decoration: none;
  transition: all 0.3s ease;
  cursor: pointer;
}

.role-card:hover {
  border-color: var(--primary);
  transform: translateX(8px);
  box-shadow: 0 4px 12px rgba(249, 115, 22, 0.15);
}

.mdi {
  font-size: 2.5rem;
  min-width: 60px;
  text-align: center;
  color: var(--primary);
}

.card-content {
  flex: 1;
}

.card-content h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 0.5rem;
}

.card-content p {
  font-size: 0.9rem;
  color: #666;
  line-height: 1.4;
  margin: 0;
}

.card-arrow {
  font-size: 1.5rem;
  color: var(--primary);
  opacity: 0;
  transform: translateX(-10px);
  transition: all 0.3s ease;
}

.role-card:hover .card-arrow {
  opacity: 1;
  transform: translateX(0);
}
</style>
