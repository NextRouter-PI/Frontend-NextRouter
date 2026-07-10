<script setup>
import PassengerHome from '@/components/pages/passenger/PassengerHome.vue'
import DriverHome from '@/components/pages/driver/DriverHome.vue'
import CompanyHome from '@/components/pages/company/CompanyHome.vue'
import { computed } from 'vue'
import { state } from '@/stores/state'

const userLogged = computed(() => state)
</script>

<template>
  <div v-if="userLogged.logged">
    <PassengerHome v-if="userLogged.user.type == 'passenger'" />
    <DriverHome v-else-if="userLogged.user.type == 'driver'" />
    <CompanyHome v-else-if="userLogged.user.type == 'company'" />
  </div>
  <div v-else>
    <p>Carregando...</p>
  </div>
</template>
