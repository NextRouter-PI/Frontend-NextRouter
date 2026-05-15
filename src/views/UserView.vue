<script setup>
import { onMounted } from "vue";
import RoleBasedView from "@/components/ui/layout/RoleBasedView.vue";
import MotoristaUser from "@/components/pages/motorista/MotoristaUser.vue";
import PassageiroUser from "@/components/pages/passageiro/PassageiroUser.vue";
import { useLoginState } from "@/store/useLoginState";

const { checkAuth } = useLoginState();

onMounted(() => {
  checkAuth();
});
</script>

<template>
  <RoleBasedView
    :passageiro-component="PassageiroUser"
    :motorista-component="MotoristaUser"
  />
</template>
