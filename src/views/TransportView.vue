<script setup>
import MotoristaTransport from "@/components/motorista/MotoristaTransport.vue";
import PassageiroTransport from "@/components/passageiro/PassageiroTransport.vue";
import { useLoginState } from "@/store/useLoginState";
const { state } = useLoginState();
</script>

<template>
    <div class="Transport-view" v-if="state.tipo === 'passageiro'">
        <PassageiroTransport />
    </div>
    <div v-else>
        <MotoristaTransport />
    </div>
</template>


