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

const PassengerTransport = asyncRoleView(() => import('@/features/passenger/components/PassengerTransport.vue'))
const DriverTransport = asyncRoleView(() => import('@/features/driver/components/DriverTransport.vue'))
const CompanyVeiculos = asyncRoleView(() => import('@/features/company/components/CompanyVeiculos.vue'))
</script>

<template>
  <div v-if="!auth.checkingAuth">
    <PassengerTransport v-if="auth.role === USER_ROLES.PASSENGER" />
    <DriverTransport v-else-if="auth.role === USER_ROLES.DRIVER" />
    <CompanyVeiculos v-else-if="auth.role === USER_ROLES.COMPANY" />
  </div>
  <LoadingSpinner v-else size="lg" />
</template>
