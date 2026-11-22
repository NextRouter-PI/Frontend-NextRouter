<script setup>
import { defineAsyncComponent } from 'vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import { USER_ROLES } from '@/constants'
import { useAuthStore } from '@/stores/useAuthStore'

const auth = useAuthStore()

const asyncRoleView = (loader) =>
  defineAsyncComponent({
    loader,
    loadingComponent: LoadingSpinner,
    delay: 150,
  })

const PassengerList = asyncRoleView(() => import('@/features/passenger/components/PassengerList.vue'))
const DriverList = asyncRoleView(() => import('@/features/driver/components/DriverList.vue'))
const CompanyRotas = asyncRoleView(() => import('@/features/company/components/CompanyRotas.vue'))
</script>

<template>
  <div v-if="!auth.checkingAuth">
    <PassengerList v-if="auth.role === USER_ROLES.PASSENGER" />
    <DriverList v-else-if="auth.role === USER_ROLES.DRIVER" />
    <CompanyRotas v-else-if="auth.role === USER_ROLES.COMPANY" />
  </div>
  <LoadingSpinner v-else size="lg" />
</template>
