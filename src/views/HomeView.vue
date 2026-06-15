<script setup>
import PassageiroHome from '@/components/pages/passageiro/PassageiroHome.vue'
import MotoristaHome from '@/components/pages/motorista/MotoristaHome.vue'

import { computed } from 'vue'
import { state } from '@/store/state'

const userLogged = computed(() => state)
</script>

<template>
  <div v-if="userLogged.logged">
    <PassageiroHome v-if="userLogged.user.type == 'passenger'" />
    <MotoristaHome v-else-if="userLogged.user.type == 'driver'" />
  </div>
  <div v-else>
    <p>Carregando...</p>
  </div>
</template>
