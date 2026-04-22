<script setup>
import { onMounted } from "vue";
import MotoristaUser from "@/components/motorista/MotoristaUser.vue";
import PassageiroUser from "@/components/passageiro/PassageiroUser.vue";
import { useLoginState } from "@/store/useLoginState";
const { state, checkAuth } = useLoginState()

onMounted(() => {
  checkAuth()
})
</script>

<template>
    <div class="User-view" v-if="state.user">
        <PassageiroUser v-if="state.user.type == 'Passageiro'"/>
        <MotoristaUser v-else-if="state.user.type == 'Motorista'"/>
        <p v-else>Empresa.</p>
    </div>
</template>


