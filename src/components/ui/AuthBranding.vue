<template>
  <div class="header">
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
  font-size: 80px;
  color: var(--primary);
  margin: 0 auto 0px auto;
  display: block;
}

h1 {
  font-size: 45px;
  margin-bottom: 5px;
  text-align: center;
  font-weight: bold;
}

h1 span {
  color: var(--primary);
}

h2 {
  font-size: 35px;
  text-align: center;
  margin-bottom: -15px;
  font-weight: bolder;
}
</style>
