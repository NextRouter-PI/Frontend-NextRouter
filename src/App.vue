<script setup>
import { useDeviceLayout } from "@/composables/useDeviceLayout";
import { useLoginState } from "@/store/useLoginState";

import Sidebar from "./components/layout/AppSideBar.vue";
import AppHeader from "./components/layout/AppHeader.vue";
import AppBottomNavigationBar from "./components/layout/AppBottomNavigationBar.vue";

const { isMobile } = useDeviceLayout();
const { state } = useLoginState();
</script>

<template>
  <div class="app-layout">
    <AppHeader />
    <template v-if="!state.logado">
      <router-view />
    </template>

    <template v-else>
      <template v-if="isMobile">
        <router-view />
        <AppBottomNavigationBar />
      </template>

      <template v-else>
        <Sidebar />
        <main class="content">
          <router-view />
        </main>
      </template>

    </template>

  </div>
</template>
