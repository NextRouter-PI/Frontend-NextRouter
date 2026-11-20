<script setup>
import ThemeButton from '@/components/buttons/ThemeButton.vue'
import Logo from '@/assets/images/logo.png'

defineProps({
  showBack: { type: Boolean, default: false },
  titlePrefix: { type: String, default: '' },
  titleHighlight: { type: String, default: '' },
  showDivider: { type: Boolean, default: false },
})

const emit = defineEmits(['back'])
</script>

<template>
  <div class="public-shell">
    <header class="shell-header">
      <RouterLink to="/login" class="shell-logo" aria-label="NextRouter">
        <img :src="Logo" alt="NextRouter" />
      </RouterLink>
      <ThemeButton />
    </header>

    <main class="shell-main">
      <div v-if="showBack || titlePrefix || titleHighlight" class="shell-title-bar">
        <button
          v-if="showBack"
          type="button"
          class="shell-back-btn"
          aria-label="Voltar"
          @click="emit('back')"
        >
          <span class="mdi mdi-chevron-left" aria-hidden="true"></span>
        </button>
        <span v-else class="shell-spacer" aria-hidden="true"></span>

        <h1 class="shell-heading">
          {{ titlePrefix }}<span v-if="titleHighlight" class="shell-heading-accent">{{ titleHighlight }}</span>
        </h1>

        <span class="shell-spacer" aria-hidden="true"></span>
      </div>

      <div v-if="showDivider" class="shell-divider" aria-hidden="true"></div>

      <slot />
    </main>

    <footer class="shell-footer">
      <div class="footer-inner">
        <span class="mdi mdi-instagram footer-icon" aria-hidden="true"></span>
        <span>@routerifc</span>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.public-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg);
  color: var(--text);
}

.shell-header {
  position: sticky;
  top: 0;
  z-index: 40;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 20px;
  background: #191716;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

.shell-logo img {
  height: 44px;
  width: auto;
  display: block;
}

.shell-main {
  flex: 1;
  width: 100%;
  max-width: 520px;
  margin: 0 auto;
  padding: 18px 18px 36px;
  box-sizing: border-box;
}

.shell-title-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.shell-back-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 10px;
  background: transparent;
  color: var(--text);
  font-size: 1.9rem;
  cursor: pointer;
}

.shell-back-btn:hover {
  background: var(--altbg);
}

.shell-spacer {
  width: 40px;
  flex-shrink: 0;
}

.shell-heading {
  margin: 0;
  font-size: 1.35rem;
  font-weight: 800;
  color: var(--text);
  text-align: center;
}

.shell-heading-accent {
  color: var(--primary-orange);
}

.shell-divider {
  height: 3px;
  width: 100%;
  border-radius: 999px;
  background: var(--primary-orange);
  margin: 6px 0 20px;
}

.shell-footer {
  margin-top: auto;
  background: #191716;
  border-top: 3px solid var(--primary-orange);
  color: #ffffff;
  padding: 20px 22px 28px;
}

.footer-inner {
  max-width: 520px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.95rem;
  font-weight: 500;
}

.footer-icon {
  font-size: 1.2rem;
}

@media (min-width: 768px) {
  .shell-main {
    max-width: 560px;
    padding: 28px 24px 48px;
  }

  .shell-heading {
    font-size: 1.55rem;
  }
}
</style>
