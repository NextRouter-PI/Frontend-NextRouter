<script setup>
import { onMounted } from "vue";
import RoleBasedView from "@/components/ui/layout/RoleBasedView.vue";
import MotoristaList from "@/components/pages/motorista/MotoristaList.vue";
import PassageiroList from "@/components/pages/passageiro/PassageiroList.vue";
import { useLoginState } from "@/store/useLoginState";

const { checkAuth } = useLoginState();

onMounted(() => {
  checkAuth();
});
</script>

<template>
  <RoleBasedView
    :passageiro-component="PassageiroList"
    :motorista-component="MotoristaList"
  />
</template>
