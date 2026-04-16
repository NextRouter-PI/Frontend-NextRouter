<script setup>
import { useDeviceLayout } from "@/composables/useDeviceLayout";

import AppHeader from "./components/layout/AppHeader.vue";
import Sidebar from "./components/layout/AppSideBar.vue";
import AppBottomNavigationBar from "./components/layout/AppBottomNavigationBar.vue";

const { isMobile } = useDeviceLayout();
</script>

<template>
  <div class="app-layout">
    <AppHeader />

    <!-- DESKTOP -->
    <Sidebar v-if="!isMobile" />

    <main class="content">
      <router-view />
    </main>

    <!-- MOBILE -->
    <AppBottomNavigationBar v-if="isMobile" />

  </div>
</template>