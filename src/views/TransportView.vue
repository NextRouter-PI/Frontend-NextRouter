<script setup>
import { onMounted } from "vue";
import RoleBasedView from "@/components/ui/layout/RoleBasedView.vue";
import MotoristaTransport from "@/components/pages/motorista/MotoristaTransport.vue";
import PassageiroTransport from "@/components/pages/passageiro/PassageiroTransport.vue";
import { useLoginState } from "@/store/useLoginState";

const { checkAuth } = useLoginState();

onMounted(() => {
  checkAuth();
});
</script>

<template>
  <RoleBasedView
    :passageiro-component="PassageiroTransport"
    :motorista-component="MotoristaTransport"
  />
</template>
