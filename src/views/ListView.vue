<script setup>
import PassageiroList from '@/components/pages/passageiro/PassageiroList.vue'
import MotoristaList from '@/components/pages/motorista/MotoristaList.vue'

import { computed } from 'vue'
import { state } from '@/store/state'

const userLogged = computed(() => state.user)
</script>

<template>
    <PassageiroList v-if="userLogged.type == 'passenger'"/> 
    <MotoristaList v-if="userLogged.type == 'driver'"/> 
</template>
