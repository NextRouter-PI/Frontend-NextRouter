<script setup>
defineProps({
  light: { type: Boolean, default: false },
})
</script>

<template>
  <div class="header" :class="{ light }">
    <span class="mdi mdi-map-marker-radius"></span>
    <h2>Bem vindo ao</h2>
    <h1><span>NEXT</span>ROUTER</h1>
  </div>
</template>

<style scoped>
.header {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.mdi-map-marker-radius {
  font-size: 100px;
  color: var(--primary);
  margin: 0 auto;
  display: block;
}

h1 {
  font-size: 45px;
  line-height: 1.1;
  margin-bottom: 5px;
  text-align: center;
  font-weight: bold;
}

h1 span {
  color: var(--primary);
}

h2 {
  font-size: 35px;
  line-height: 1.1;
  text-align: center;
  margin-bottom: 0;
  font-weight: bolder;
}

/* ---------- Versão branca (para fundos coloridos) ---------- */
.light .mdi-map-marker-radius,
.light h1,
.light h2 {
  color: #fff;
}

/* "NEXT" fica branco mais suave para manter o contraste com "ROUTER" */
.light h1 span {
  color: rgba(255, 255, 255, 0.55);
}
</style>
