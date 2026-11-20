<script setup>
import PassengerTransport from '@/features/passenger/components/PassengerTransport.vue'
import DriverTransport from '@/features/driver/components/DriverTransport.vue'
import CompanyVeiculos from '@/features/company/components/CompanyVeiculos.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import { USER_ROLES } from '@/constants'
import { state } from '@/stores/state'
</script>

<template>
  <div v-if="!state.checkingAuth">
    <PassengerTransport v-if="state.role === USER_ROLES.PASSENGER" />
    <DriverTransport v-else-if="state.role === USER_ROLES.DRIVER" />
    <CompanyVeiculos v-else-if="state.role === USER_ROLES.COMPANY" />
  </div>
  <LoadingSpinner v-else size="lg" />
</template>
