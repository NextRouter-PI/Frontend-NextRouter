<script setup>
import { useLoginState } from "@/store/useLoginState"

defineProps({
  passageiroComponent: { type: Object, required: true },
  motoristaComponent: { type: Object, required: true },
  empresaText: { type: String, default: "Empresa." },
})

const { state } = useLoginState()
</script>

<template>
  <div v-if="state.user" class="role-view">
    <component :is="passageiroComponent" v-if="state.user.type === 'Passageiro'" />
    <component :is="motoristaComponent" v-else-if="state.user.type === 'Motorista'" />
    <p v-else>{{ empresaText }}</p>
  </div>
</template>

<style scoped>
p {
  padding: 20px;
  text-align: center;
}
</style>
