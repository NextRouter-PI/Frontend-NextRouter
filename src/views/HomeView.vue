<script setup>
import PassengerHome from '@/components/pages/passenger/PassengerHome.vue'
import DriverHome from '@/components/pages/driver/DriverHome.vue'
import { computed, onMounted } from 'vue'
import { state } from '@/stores/state'

const ADMIN_URL = import.meta.env.VITE_ADMIN_URL

const userLogged = computed(() => state)

onMounted(() => {
  if (state.user?.type === 'company') {
    const name = encodeURIComponent(state.user.name)
    window.location.href = `${ADMIN_URL}/?company=${name}`
  }
})
</script>

<template>
  <div v-if="userLogged.logged">
    <PassengerHome v-if="userLogged.user.type == 'passenger'" />
    <DriverHome v-else-if="userLogged.user.type == 'driver'" />
  </div>
  <div v-else>
    <p>Carregando...</p>
  </div>
</template>
