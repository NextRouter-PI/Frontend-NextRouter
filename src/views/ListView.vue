<script setup>
import MotoristaList from "@/components/motorista/MotoristaList.vue";
import PassageiroList from "@/components/passageiro/PassageiroList.vue";
import { useLoginState } from "@/store/useLoginState";
const { state } = useLoginState();
</script>

<template>
    <div class="List-view" v-if="state.tipo === 'passageiro'">
        <PassageiroList />
    </div>
    <div v-else-if="state.tipo === 'motorista'">
        <MotoristaList />
    </div>
    <div v-else>
        <p>Empresa.</p>
    </div>
</template>


