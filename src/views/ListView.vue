<script setup>
import { onMounted } from "vue";
import MotoristaList from "@/components/motorista/MotoristaList.vue";
import PassageiroList from "@/components/passageiro/PassageiroList.vue";
import { useLoginState } from "@/store/useLoginState";
const { state, checkAuth } = useLoginState()

onMounted(() => {
  checkAuth()
})
</script>

<template>
    <div class="List-view" v-if="state.user">
        <PassageiroList v-if="state.user.type == 'Passageiro'"/>
        <MotoristaList v-else-if="state.user.type == 'Motorista'"/>
        <p v-else>Empresa.</p>
    </div>
</template>


