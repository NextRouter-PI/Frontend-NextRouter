<template>
  <footer class="bottom-nav">
    <router-link to="/" class="nav-item">
      <span class="mdi mdi-home"></span>
      <small>Home</small>
    </router-link>

    <router-link to="/user" class="nav-item">
      <span class="mdi mdi-account"></span>
      <small>Usuário</small>
    </router-link>

    <router-link to="/transport" class="nav-item">
      <span class="mdi mdi-car"></span>
      <small>Transporte</small>
    </router-link>

    <router-link to="/list" class="nav-item">
      <span class="mdi mdi-format-list-bulleted"></span>
      <small>Lista</small>
    </router-link>
  </footer>
</template>

<style scoped>
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 65px;
  background: #1E1E1E;
  display: flex;
  justify-content: space-around;
  align-items: center;
  border-top: 2px solid #DF801A;
  box-shadow: 0 -2px 10px rgba(0,0,0,0.3);
  z-index: 1000;
}

.nav-item {
  text-decoration: none;
  color: #aaa;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  font-size: 12px;
}

.nav-item span {
  font-size: 26px;
  transition: all 0.3s ease;
}

.nav-item small {
  font-size: 11px;
  transition: all 0.3s ease;
}

.nav-item:hover span {
  transform: scale(1.1);
}

.nav-item:active span {
  transform: scale(0.9);
}

.nav-item.router-link-active span {
  background: #DF801A;
  color: #1E1E1E;
  padding: 6px 12px;
  border-radius: 50%;
  transform: scale(1.3) translateY(-6px);
}

.nav-item.router-link-active small {
  color: #DF801A;
  transform: translateY(-4px);
}
</style>