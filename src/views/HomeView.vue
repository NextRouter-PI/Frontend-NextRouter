<script setup>
import PassengerHome from '@/features/passenger/components/PassengerHome.vue'
import DriverHome from '@/features/driver/components/DriverHome.vue'
import CompanyHome from '@/features/company/components/CompanyHome.vue'
import { ROUTE_PATHS, USER_ROLES } from '@/constants'
import { state } from '@/stores/state'
</script>

<template>
  <div v-if="state.logged">
    <p v-if="state.profileStale" role="status">
      Os dados cadastrais podem estar desatualizados.
      <RouterLink :to="ROUTE_PATHS.USER">Consultar perfil</RouterLink>.
    </p>
    <PassengerHome v-if="state.role === USER_ROLES.PASSENGER" />
    <DriverHome v-else-if="state.role === USER_ROLES.DRIVER" />
    <CompanyHome v-else-if="state.role === USER_ROLES.COMPANY" />
    <p v-else role="status">
      Conta autenticada, mas sem um perfil único disponível nesta interface. Contate o suporte.
    </p>
  </div>
  <div v-else>
    <p>Carregando...</p>
  </div>
</template>
