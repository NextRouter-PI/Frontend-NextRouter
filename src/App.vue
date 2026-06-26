<script setup>
import { useDeviceLayout } from '@/composables/useDeviceLayout'
import { state } from './stores/state.js'
import AppHeader from './components/layout/AppHeader.vue'
import Sidebar from './components/layout/AppSideBar.vue'
import AppBottomNavigationBar from './components/layout/AppBottomNavigationBar.vue'

const { isMobile } = useDeviceLayout()
</script>

<template>
  <div v-if="!state.checkingAuth" class="app-layout">
    <AppHeader v-if="state.logged" />
    <Sidebar v-if="!isMobile && state.logged" />

    <main :class="state.logged ? 'logado' : ''">
      <router-view />
    </main>

    <AppBottomNavigationBar
      v-if="isMobile && state.logged"
    />
  </div>
</template>

<style scoped>
.logado{
  margin: 80px 0;
}
</style>