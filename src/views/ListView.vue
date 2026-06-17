<script setup>
import PassageiroList from '@/components/pages/passageiro/PassageiroList.vue'
import MotoristaList from '@/components/pages/motorista/MotoristaList.vue'

import { computed } from 'vue'
import { state } from '@/store/state'

const userLogged = computed(() => state)
</script>

<template>
  <div v-if="!userLogged.checkingAuth">
    <PassageiroList v-if="userLogged.user.type == 'passenger'" />
    <MotoristaList v-else-if="userLogged.user.type == 'driver'" />
  </div>
  <div v-else>
    <p>Carregando...</p>
  </div>
</template>
