<script setup>
import { useDeviceLayout } from '@/composables/useDeviceLayout'
import { state } from './store/state.js'
import AppHeader from './components/layout/AppHeader.vue'
import Sidebar from './components/layout/AppSideBar.vue'
import AppBottomNavigationBar from './components/layout/AppBottomNavigationBar.vue'

const { isMobile } = useDeviceLayout()
</script>

<template>
  <div class="app-layout">
    <AppHeader v-if="state.logged" />
    <Sidebar v-if="!isMobile && state.logged" />

    <main class="content">
      <router-view />
    </main>

    <AppBottomNavigationBar v-if="isMobile && state.logged" />
  </div>
</template>
