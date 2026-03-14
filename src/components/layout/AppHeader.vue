<script setup>
import ThemeButton from "@/components/buttons/ThemeButton.vue"
</script>

<template>
  <header class="header">
    <h1 class="logo">Next<span>Router</span></h1>
    <ThemeButton />
  </header>
</template>

<style scoped>

.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  padding: 10px 20px;
  background: #1E1E1E;
  display: flex;
  justify-content: space-between;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 100;
}

.logo {
  color: #DF801A;
  font-weight: 700;
  font-size: 1.4rem;
  font-family: 'Inter', sans-serif;
}

.logo span {
  color: #1E1E1E;
  background-color: #DF801A;
  margin-left: 4px;
  padding: 0.5px 2px;
  border-radius: 3px;
}

@media (min-width: 768px) {
}

</style>
