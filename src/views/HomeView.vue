<script setup>
import { onMounted } from "vue";
import MotoristaHome from "@/components/pages/motorista/MotoristaHome.vue";
import PassageiroHome from "@/components/pages/passageiro/PassageiroHome.vue";
import { useLoginState } from "@/store/useLoginState";
const { state, checkAuth } = useLoginState()

onMounted(() => {
  checkAuth()
})
</script>

<template>
    <div class="home-view" v-if="state.user">
        <PassageiroHome v-if="state.user.type == 'Passageiro'"/>
        <MotoristaHome v-else-if="state.user.type == 'Motorista'"/>
        <p v-else>Empresa.</p>
    </div>
</template>


