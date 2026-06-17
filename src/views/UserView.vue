<script setup>
import PassageiroUser from '@/components/pages/passageiro/PassageiroUser.vue'
import MotoristaUser from '@/components/pages/motorista/MotoristaUser.vue'

import { computed } from 'vue'
import { state } from '@/store/state'

const userLogged = computed(() => state)
</script>

<template>
  <div v-if="!userLogged.checkingAuth">
    <PassageiroUser v-if="userLogged.user.type == 'passenger'" />
    <MotoristaUser v-else-if="userLogged.user.type == 'driver'" />
  </div>
  <div v-else>
    <p>Carregando...</p>
  </div>
</template>
