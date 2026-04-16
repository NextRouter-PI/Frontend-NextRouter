<script setup>
import { useDeviceLayout } from "@/composables/useDeviceLayout";
import { useLoginState } from "@/store/useLoginState";

import AppHeader from "./components/layout/AppHeader.vue";
import Sidebar from "./components/layout/AppSideBar.vue";
import AppBottomNavigationBar from "./components/layout/AppBottomNavigationBar.vue";

const { isMobile } = useDeviceLayout();
const { state } = useLoginState();
</script>

<template>
  <div class="app-layout">

    <AppHeader v-if="state.logado" />
    <Sidebar v-if="!isMobile && state.logado" />

    <main class="content">
      <router-view />
    </main>

    <AppBottomNavigationBar v-if="isMobile" />

  </div>
</template>