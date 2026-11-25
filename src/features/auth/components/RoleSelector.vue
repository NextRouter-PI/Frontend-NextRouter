<script setup>
import { RouterLink } from 'vue-router'

defineProps({ stacked: { type: Boolean, default: false } })

const roles = [
  {
    to: '/signup/passenger',
    icon: 'mdi-seat-passenger',
    title: 'Passageiro',
    text: 'Confirme suas viagens e acompanhe o transporte em tempo real.',
  },
  {
    to: '/signup/driver',
    icon: 'mdi-steering',
    title: 'Motorista',
    text: 'Receba as rotas do dia e registre embarques pelo celular.',
  },
  {
    to: '/signup/company',
    icon: 'mdi-office-building-outline',
    title: 'Empresa',
    text: 'Organize grupos, frota, pontos e a operação diária.',
  },
]
</script>

<template>
  <div class="role-select" :class="{ stacked }">
    <RouterLink
      v-for="(role, index) in roles"
      :key="role.title"
      :to="role.to"
      class="role-card"
      :style="{ animationDelay: `${index * 90}ms` }"
    >
      <span class="role-icon-wrap"><BaseIcon :name="role.icon" class="role-icon" /></span>
      <span class="role-copy">
        <span class="role-title">{{ role.title }}</span>
        <span class="role-text">{{ role.text }}</span>
      </span>
      <BaseIcon name="mdi-arrow-right" class="role-arrow" />
    </RouterLink>
  </div>
</template>

<style lang="scss" scoped>
.role-select {
  display: flex;
  flex-direction: column;
  gap: $space-4;
  margin-bottom: 36px;
}

.role-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: $space-4;
  padding: 18px 20px;
  background: var(--color-surface);
  color: var(--text);
  outline: 1.5px solid var(--border);
  outline-offset: -1.5px;
  border-radius: $radius-xl;
  box-shadow: var(--shadow);
  overflow: hidden;
  isolation: isolate;
  animation: rise-in $duration-reveal $ease-fluid backwards;
  transition:
    transform $duration-slow $ease-fluid,
    box-shadow $duration-slow $ease-fluid,
    outline-color $duration-normal $ease-fluid;

  // Brilho laranja que acende no canto ao passar o mouse.
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: -1;
    background: radial-gradient(22rem 12rem at 100% 0%, var(--color-primary-tint), transparent 70%);
    opacity: 0;
    transition: opacity $duration-slow $ease-fluid;
  }

  &:hover {
    transform: translateY(-3px);
    outline-color: var(--primary);
    box-shadow: var(--shadow-hover);

    &::before {
      opacity: 1;
    }

    .role-icon-wrap {
      transform: none;
    }

    .role-arrow {
      opacity: 1;
      transform: none;
    }
  }

  &:active {
    transform: scale(0.98);
  }
}

.role-icon-wrap {
  @include flex-center;
  flex-shrink: 0;
  width: 56px;
  height: 56px;
  border-radius: $radius-lg;
  background: var(--gradient-brand);
  box-shadow: var(--shadow-primary);
  transition: transform $duration-slow $ease-spring;
}

.role-icon {
  font-size: 1.8rem;
  color: var(--color-on-primary);
}

.role-copy {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.role-title {
  font-size: 1.15rem;
  font-weight: $font-bold;
}

.role-text {
  color: var(--text-muted);
  font-size: $text-sm;
  line-height: 1.45;
}

.role-arrow {
  margin-left: auto;
  flex-shrink: 0;
  font-size: 1.3rem;
  color: var(--primary);
  opacity: 0.5;
  transform: translateX(-4px);
  transition:
    opacity $duration-normal $ease-fluid,
    transform $duration-normal $ease-fluid;
}

@media (min-width: 768px) {
  .role-select {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: $space-6;
    margin-bottom: 42px;
  }

  .role-card {
    flex-direction: column;
    align-items: flex-start;
    gap: $space-4;
    min-height: 230px;
    padding: 26px 22px;
  }

  .role-icon-wrap {
    width: 64px;
    height: 64px;
  }

  .role-icon {
    font-size: 2.1rem;
  }

  .role-arrow {
    margin-left: 0;
    margin-top: auto;
  }
}

// Lista vertical (cadastro em meia tela): mantém o card deitado também no computador.
@media (min-width: 768px) {
  .role-select.stacked {
    display: flex;
    flex-direction: column;
    gap: $space-4;
    margin-bottom: $space-8;

    .role-card {
      flex-direction: row;
      align-items: center;
      min-height: 0;
      padding: 18px 20px;
    }

    .role-icon-wrap {
      width: 56px;
      height: 56px;
    }

    .role-icon {
      font-size: 1.8rem;
    }

    .role-arrow {
      margin-left: auto;
      margin-top: 0;
    }
  }
}
</style>
