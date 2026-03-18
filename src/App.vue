<script setup>
import { RouterView } from 'vue-router'
import AppHeader from './components/layout/AppHeader.vue';
import AppBottomNavigationBar from './components/layout/AppBottomNavigationBar.vue';

</script>

<template>
  <AppHeader />
  <RouterView />
  <AppBottomNavigationBar />
</template>