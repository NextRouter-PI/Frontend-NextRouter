<script setup>
import { useDeviceLayout } from "@/composables/useDeviceLayout";
import Sidebar from "./components/layout/AppSideBar.vue";
import AppHeader from "./components/layout/AppHeader.vue";
import AppBottomNavigationBar from "./components/layout/AppBottomNavigationBar.vue";


const { isMobile } = useDeviceLayout();
</script>

<template>
  <div class="app-layout">

    <template v-if="isMobile">
      <AppHeader />
      <router-view />
      <AppBottomNavigationBar />
    </template>

    <template v-else>
      <Sidebar />
      <main class="content">
        <router-view />
      </main>
    </template>

  </div>
</template>