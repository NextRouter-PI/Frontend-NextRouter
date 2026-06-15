<script setup>
import PassageiroTransport from '@/components/pages/passageiro/PassageiroTransport.vue'
import MotoristaTransport from '@/components/pages/motorista/MotoristaTransport.vue'

import { computed } from 'vue'
import { state } from '@/store/state'

const userLogged = computed(() => state.user)
</script>

<template>
    <PassageiroTransport v-if="userLogged.type == 'passenger'"/> 
    <MotoristaTransport v-if="userLogged.type == 'driver'"/> 
</template>
