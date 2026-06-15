<script setup>
import PassageiroUser from '@/components/pages/passageiro/PassageiroUser.vue'
import MotoristaUser from '@/components/pages/motorista/MotoristaUser.vue'

import { computed } from 'vue'
import { state } from '@/store/state'

const userLogged = computed(() => state.user)
</script>

<template>
    <PassageiroUser v-if="userLogged.type == 'passenger'"/> 
    <MotoristaUser v-if="userLogged.type == 'driver'"/> 
</template>
