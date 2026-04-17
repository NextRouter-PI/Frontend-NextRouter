<script setup>
import MotoristaHome from "@/components/motorista/MotoristaHome.vue";
import PassageiroHome from "@/components/passageiro/PassageiroHome.vue";
import { useLoginState } from "@/store/useLoginState";
const { state } = useLoginState();
</script>

<template>
    <div class="home-view" v-if="state.tipo === 'passageiro'">
        <PassageiroHome />
    </div>
    <div v-else-if="state.tipo === 'motorista'">
        <MotoristaHome />
    </div>
    <div v-else>
        <p>Empresa.</p>
    </div>
</template>


