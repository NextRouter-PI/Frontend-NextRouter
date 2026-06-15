<script setup>
import PassageiroTransport from '@/components/pages/passageiro/PassageiroTransport.vue'
import MotoristaTransport from '@/components/pages/motorista/MotoristaTransport.vue'

import { computed } from 'vue'
import { state } from '@/store/state'

const userLogged = computed(() => state)
</script>

<template>
  <div v-if="!userLogged.checkingAuth">
    <PassageiroTransport v-if="userLogged.user.type == 'passenger'" />
    <MotoristaTransport v-else-if="userLogged.user.type == 'driver'" />
  </div>
  <div v-else>
    <p>Carregando...</p>
  </div>
</template>
