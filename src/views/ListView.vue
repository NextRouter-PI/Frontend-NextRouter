<script setup>
import PassengerList from '@/features/passenger/components/PassengerList.vue'
import DriverList from '@/features/driver/components/DriverList.vue'
import CompanyRotas from '@/features/company/components/CompanyRotas.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import { USER_ROLES } from '@/constants'
import { state } from '@/stores/state'
</script>

<template>
  <div v-if="!state.checkingAuth">
    <PassengerList v-if="state.role === USER_ROLES.PASSENGER" />
    <DriverList v-else-if="state.role === USER_ROLES.DRIVER" />
    <CompanyRotas v-else-if="state.role === USER_ROLES.COMPANY" />
  </div>
  <LoadingSpinner v-else size="lg" />
</template>
