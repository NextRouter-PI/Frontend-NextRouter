<script setup>
import { useLoginState } from "@/store/useLoginState";

const { state } = useLoginState();

// Definir as rotas baseado no tipo de usuário
const getBasePath = () => {
  return state.tipoUsuario === "motorista" ? "/motorista" : "/usuarios";
};
</script>

<template>
  <footer class="bottom-nav">
    <router-link :to="`${getBasePath()}/home`" class="nav-item">
      <span class="mdi mdi-home"></span>
      <small>Home</small>
    </router-link>

    <router-link :to="`${getBasePath()}/user`" class="nav-item">
      <span class="mdi mdi-account"></span>
      <small>Usuário</small>
    </router-link>

    <router-link :to="`${getBasePath()}/transport`" class="nav-item">
      <span class="mdi mdi-car"></span>
      <small>Transporte</small>
    </router-link>

    <router-link :to="`${getBasePath()}/list`" class="nav-item">
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
  background: var(--superfice);
  display: flex;
  justify-content: space-around;
  align-items: center;
  border-top: 2px solid var(--border-primary);
  box-shadow: 0 -2px 10px var(--shadow);
  z-index: 1000;
}

.nav-item {
  text-decoration: none;
  color: var(--text-muted);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  font-size: 12px;
}

.nav-item span {
  font-size: 26px;
  transition: all 0.4s ease;
}

.nav-item small {
  font-size: 11px;
  transition: all 0.4s ease;
}

.nav-item:hover span {
  transform: scale(1.1);
}

.nav-item:active span {
  transform: scale(0.9);
}

.nav-item.router-link-active span {
  background: var(--gradient-primary);
  color: var(--superfice);
  box-shadow: var(--shadow-primary);
  padding: 6px 12px;
  border-radius: 50%;
  transform: scale(1.3) translateY(-6px);
}

.nav-item.router-link-active small {
  color: var(--primary);
  transform: translateY(-4px);
}
</style>
