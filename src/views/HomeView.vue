<script setup>
import { defineAsyncComponent } from 'vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import { ROUTE_PATHS, USER_ROLES } from '@/constants'
import { useAuthStore } from '@/stores/useAuthStore'

const auth = useAuthStore()

const asyncRoleView = (loader) =>
  defineAsyncComponent({
    loader,
    loadingComponent: LoadingSpinner,
    delay: 150,
  })

const PassengerHome = asyncRoleView(() => import('@/features/passenger/components/PassengerHome.vue'))
const DriverHome = asyncRoleView(() => import('@/features/driver/components/DriverHome.vue'))
const CompanyHome = asyncRoleView(() => import('@/features/company/components/CompanyHome.vue'))
</script>

<template>
  <Transition name="page-fade" mode="out-in">
    <div v-if="auth.logged" key="logged">
      <p v-if="auth.profileStale" role="status">
        Os dados cadastrais podem estar desatualizados.
        <RouterLink :to="ROUTE_PATHS.USER">Consultar perfil</RouterLink>.
      </p>
      <PassengerHome v-if="auth.role === USER_ROLES.PASSENGER" />
      <DriverHome v-else-if="auth.role === USER_ROLES.DRIVER" />
      <CompanyHome v-else-if="auth.role === USER_ROLES.COMPANY" />
      <p v-else role="status">
        Conta autenticada, mas sem um perfil único disponível nesta interface. Contate o suporte.
      </p>
    </div>
    <div v-else key="loading" class="home-loading">
      <LoadingSpinner size="lg" text="Carregando painel..." />
    </div>
  </Transition>
</template>

<style lang="scss" scoped>
.home-loading {
  min-height: calc(100vh - var(--header-height) - var(--bottom-nav-height));
  @include flex-center;
}
</style>
