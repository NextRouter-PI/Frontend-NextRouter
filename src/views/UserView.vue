<script setup>
import MotoristaUser from "@/components/motorista/MotoristaUser.vue";
import PassageiroUserMotoristaUser from "@/components/passageiro/PassageiroUser.vue";
import { useLoginState } from "@/store/useLoginState";
const { state } = useLoginState();
</script>

<template>
    <div class="UserMotoristaUser-view" v-if="state.tipo === 'passageiro'">
        <PassageiroUserMotoristaUser />
    </div>
    <div v-else-if="state.tipo === 'motorista'">
        <MotoristaUser />
    </div>
    <div v-else>
        <p>Empresa.</p>
    </div>
</template>


