<script setup>
import { useDeviceLayout } from "@/composables/useDeviceLayout";
import { useLoginState } from "@/store/useLoginState";

import Sidebar from "./components/layout/AppSideBar.vue";
import AppHeader from "./components/layout/AppHeader.vue";
import AppBottomNavigationBar from "./components/layout/AppBottomNavigationBar.vue";
import LoginView from "./views/LoginView.vue";

const { isMobile } = useDeviceLayout();
const { state } = useLoginState();
</script>

<template>
  <div class="app-layout">
    <AppHeader/>
    <LoginView v-if="!state.logado" />

    <template v-else>

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

    </template>

  </div>
</template>