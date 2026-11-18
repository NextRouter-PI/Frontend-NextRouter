<script setup>
import { state } from '@/stores/state';

defineProps({
  passageiroComponent: { type: Object, required: true },
  motoristaComponent: { type: Object, required: true },
  empresaText: { type: String, default: "Empresa." },
})
</script>

<template>
  <div v-if="state.user" class="role-view">
    <component :is="passageiroComponent" v-if="state.role === 'passenger'" />
    <component :is="motoristaComponent" v-else-if="state.role === 'driver'" />
    <p v-else>{{ empresaText }}</p>
  </div>
</template>

<style scoped>
p {
  padding: 20px;
  text-align: center;
}
</style>
