<script setup>
import { computed } from 'vue'
import RoleBasedView from '@/components/ui/layout/RoleBasedView.vue'
import MotoristaHome from '@/components/pages/motorista/MotoristaHome.vue'
import PassageiroHome from '@/components/pages/passageiro/PassageiroHome.vue'
import { state } from '@/store/state'

const userLogged = computed(() => state.user)
</script>

<template>
  <RoleBasedView
    v-if="userLogged"
    :passageiro-component="PassageiroHome"
    :motorista-component="MotoristaHome"
    empresa-text="Redirecionando..."
  />
</template>
