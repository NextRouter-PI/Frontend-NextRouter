<script setup>
import { onMounted } from "vue";
import RoleBasedView from "@/components/ui/layout/RoleBasedView.vue";
import MotoristaHome from "@/components/pages/motorista/MotoristaHome.vue";
import PassageiroHome from "@/components/pages/passageiro/PassageiroHome.vue";
import { useLoginState } from "@/store/useLoginState";

const { state, checkAuth } = useLoginState();

onMounted(async () => {
  await checkAuth();

  if (state.user?.type === "Empresa") {
    window.location.href = "http://localhost:5174";
  }
});
</script>

<template>
  <RoleBasedView
    v-if="state.user"
    :passageiro-component="PassageiroHome"
    :motorista-component="MotoristaHome"
    empresa-text="Redirecionando..."
  />
</template>
