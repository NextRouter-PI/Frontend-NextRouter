<script setup>
import PassengerUser from '@/components/pages/passenger/PassengerUser.vue'
import DriverUser from '@/components/pages/driver/DriverUser.vue'
import CompanyUser from '@/components/pages/company/CompanyUser.vue'
import { computed } from 'vue'
import { state } from '@/stores/state'

const userLogged = computed(() => state)
</script>

<template>
  <div v-if="!userLogged.checkingAuth">
    <PassengerUser v-if="userLogged.user.type == 'passenger'" />
    <DriverUser v-else-if="userLogged.user.type == 'driver'" />
    <CompanyUser v-else-if="userLogged.user.type == 'company'" />
  </div>
  <div v-else>
    <p>Carregando...</p>
  </div>
</template>
