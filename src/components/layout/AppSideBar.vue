<script setup>
import ThemeButton from "../buttons/ThemeButton.vue"
import Logo from "/src-header/Logo.png"
</script>

<template>
  <aside class="sidebar">

    <!-- LOGO -->
    <RouterLink to="/" class="logo">
      <div class="logo-content">
        <img :src="Logo" alt="Logo">
        <h1>NextRouter</h1>
      </div>
    </RouterLink>

    <!-- MENU -->
    <nav class="nav">

      <router-link to="/" class="nav-item" title="Home">
        <span class="mdi mdi-home"></span>
        <small>Home</small>
      </router-link>

      <router-link to="/user" class="nav-item" title="Usuário">
        <span class="mdi mdi-account"></span>
        <small>Usuário</small>
      </router-link>

      <router-link to="/transport" class="nav-item" title="Transporte">
        <span class="mdi mdi-car"></span>
        <small>Transporte</small>
      </router-link>

      <router-link to="/list" class="nav-item" title="Lista">
        <span class="mdi mdi-format-list-bulleted"></span>
        <small>Lista</small>
      </router-link>

    </nav>

    <!-- BOTÃO EMBAIXO -->
    <div class="bottom">
      <ThemeButton />
    </div>

  </aside>
</template>

<style scoped>
.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  width: 100px;
  height: 100vh;
  background: #1E1E1E;

  display: flex;
  flex-direction: column;
  align-items: center;

  padding: 20px 0;
  gap: 30px;

  border-right: 1px solid rgba(255,255,255,0.05);
  box-shadow: 8px 0 30px rgba(0,0,0,0.4);

  transition: width 0.4s ease;
  overflow: hidden;
}

.sidebar:hover {
  width: 230px;
}

.logo {
  width: 100%;
  text-decoration: none;
}

.logo-content {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 18px;
}

.logo-content img {
  width: 40px;
}

.logo-content h1 {
  font-size: 18px;
  font-weight: 600;
  color: #fff;

  opacity: 0;
  transform: translateX(-10px);
  transition: 0.3s;
  white-space: nowrap;
}

.sidebar:hover .logo-content h1 {
  opacity: 1;
  transform: translateX(0);
}

.nav {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.nav-item {
  position: relative;
  text-decoration: none;
  color: #aaa;

  display: flex;
  align-items: center;
  gap: 14px;

  width: 90%;
  padding: 10px 12px;

  border-radius: 12px;
  transition: 0.25s;
}

.nav-item::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: 12px;

  background: linear-gradient(
    90deg,
    rgba(223,128,26,0.15),
    transparent
  );

  opacity: 0;
  transition: 0.25s;
}

.nav-item:hover::before {
  opacity: 1;
}

.nav-item::after {
  content: "";
  position: absolute;
  left: -8px;
  top: 50%;
  transform: translateY(-50%);

  width: 4px;
  height: 0%;

  background: linear-gradient(180deg, #DF801A, #ffb347);
  border-radius: 10px;

  transition: 0.3s;
}

.nav-item.router-link-active::after {
  height: 60%;
}

.nav-item span {
  width: 42px;
  height: 42px;
  min-width: 42px;
  min-height: 42px;

  display: flex;
  align-items: center;
  justify-content: center;

  font-size: 20px;

  border-radius: 50%;
  background: transparent;

  transition: all 0.3s ease;
}

.nav-item small {
  opacity: 0;
  transform: translateX(-10px);

  transition: 0.25s;
  white-space: nowrap;
}

.sidebar:hover .nav-item small {
  opacity: 1;
  transform: translateX(0);
}

.nav-item:hover span {
  color: #DF801A;
  transform: scale(1.1);
}

.nav-item.router-link-active {
  color: #fff;
}

.nav-item.router-link-active span {
  color: #1E1E1E;
  background: linear-gradient(135deg, #DF801A, #ffb347);

  box-shadow:
    0 4px 12px rgba(223,128,26,0.4),
    0 0 8px rgba(223,128,26,0.3);

  transform: scale(1.1);
}

.bottom {
  margin-top: auto;
  padding-bottom: 10px;
}

.nav-item:active {
  transform: scale(0.95);
}
</style>