<script setup>
import PassengerList from '@/components/pages/passenger/PassengerList.vue'
import DriverList from '@/components/pages/driver/DriverList.vue'
import CompanyRotas from '@/components/pages/company/CompanyRotas.vue'
import { computed } from 'vue'
import { state } from '@/stores/state'

const userLogged = computed(() => state)
</script>

<template>
  <div v-if="!userLogged.checkingAuth">
    <PassengerList v-if="userLogged.role === 'passenger'" />
    <DriverList v-else-if="userLogged.role === 'driver'" />
    <CompanyRotas v-else-if="userLogged.role === 'company'" />
  </div>
  <div v-else>
    <p>Carregando...</p>
  </div>
</template>
