<script setup>
import { onMounted } from "vue";
import MotoristaTransport from "@/components/motorista/MotoristaTransport.vue";
import PassageiroTransport from "@/components/passageiro/PassageiroTransport.vue";
import { useLoginState } from "@/store/useLoginState";
const { state, checkAuth } = useLoginState()

onMounted(() => {
  checkAuth()
})
</script>

<template>
    <div class="Transport-view" v-if="state.user">
        <PassageiroTransport v-if="state.user.type == 'Passageiro'"/>
        <MotoristaTransport v-else-if="state.user.type == 'Motorista'"/>
        <p v-else>Empresa.</p>
    </div>
</template>


