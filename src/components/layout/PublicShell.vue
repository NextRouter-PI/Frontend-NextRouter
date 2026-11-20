<script setup>
import ThemeButton from '@/components/buttons/ThemeButton.vue'
import Logo from '@/assets/images/logo.png'

defineProps({
  showBack: { type: Boolean, default: false },
  titlePrefix: { type: String, default: '' },
  titleHighlight: { type: String, default: '' },
  showDivider: { type: Boolean, default: false },
  fullBleed: { type: Boolean, default: false },
  wide: { type: Boolean, default: false },
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

    <main :class="['shell-main', { 'is-full-bleed': fullBleed, 'is-wide': wide }]">
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
  height: var(--header-height);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  background: var(--chrome-bg);
  border-bottom: 2px solid var(--primary);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.22);
}

.shell-logo {
  display: inline-flex;
  align-items: center;
}

.shell-logo img {
  height: 36px;
  width: auto;
  display: block;
}

.shell-main {
  flex: 1;
  width: 100%;
  max-width: 520px;
  margin: 0 auto;
  padding: 20px 18px 36px;
  box-sizing: border-box;
}

.shell-main.is-full-bleed {
  max-width: none;
  padding: 0;
  display: flex;
  flex-direction: column;
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
  transition: background-color 0.2s var(--ease-fluid), transform 0.16s var(--ease-fluid);
}

.shell-back-btn:hover {
  background: var(--altbg);
}

.shell-back-btn:active {
  transform: scale(0.94);
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
  color: var(--primary);
}

.shell-divider {
  height: 2px;
  width: 100%;
  border-radius: 999px;
  background: var(--primary);
  margin: 6px 0 20px;
}

.shell-footer {
  margin-top: auto;
  background: var(--chrome-bg);
  border-top: 2px solid var(--primary);
  color: var(--chrome-text);
  padding: 16px 22px 22px;
}

.footer-inner {
  max-width: 1120px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  font-weight: 500;
}

.footer-icon {
  font-size: 1.15rem;
}

@media (min-width: 768px) {
  .shell-main {
    max-width: 580px;
    padding: 32px 24px 48px;
  }

  .shell-main.is-wide {
    max-width: 820px;
  }

  .shell-main.is-full-bleed {
    max-width: none;
    padding: 0;
  }

  .shell-heading {
    font-size: 1.55rem;
  }
}
</style>
