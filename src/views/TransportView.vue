<script setup>
import PassengerTransport from '@/components/pages/passenger/PassengerTransport.vue'
import DriverTransport from '@/components/pages/driver/DriverTransport.vue'
import { computed } from 'vue'
import { state } from '@/stores/state'

const userLogged = computed(() => state)
</script>

<template>
  <div v-if="!userLogged.checkingAuth">
    <PassengerTransport v-if="userLogged.user.type == 'passenger'" />
    <DriverTransport v-else-if="userLogged.user.type == 'driver'" />
  </div>
  <div v-else>
    <p>Carregando...</p>
  </div>
</template>
