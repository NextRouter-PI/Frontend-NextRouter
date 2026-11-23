<script setup>
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
    <div :class="['shell-main', { 'is-full-bleed': fullBleed, 'is-wide': wide }]">
      <div v-if="showBack || titlePrefix || titleHighlight" class="shell-title-bar">
        <button
          v-if="showBack"
          type="button"
          class="shell-back-btn"
          aria-label="Voltar"
          @click="emit('back')"
        >
          <BaseIcon name="mdi-chevron-left" />
        </button>
        <span v-else class="shell-spacer" aria-hidden="true"></span>

        <h1 class="shell-heading">
          {{ titlePrefix }}<span v-if="titleHighlight" class="shell-heading-accent">{{ titleHighlight }}</span>
        </h1>

        <span class="shell-spacer" aria-hidden="true"></span>
      </div>

      <div v-if="showDivider" class="shell-divider" aria-hidden="true"></div>

      <slot />
    </div>

    <footer class="shell-footer">
      <div class="footer-inner">
        <BaseIcon name="mdi-instagram" class="footer-icon" />
        <span>@routerifc</span>
      </div>
    </footer>
  </div>
</template>

<style lang="scss" scoped>
.public-shell {
  min-height: calc(100vh - var(--header-height));
  display: flex;
  flex-direction: column;
  background: var(--bg);
  color: var(--text);
}

.shell-main {
  flex: 1;
  width: 100%;
  max-width: $container-sm;
  margin: 0 auto;
  padding: $space-5 18px 36px;

  &.is-full-bleed {
    max-width: none;
    padding: 0;
    display: flex;
    flex-direction: column;
  }

  @include from($bp-md) {
    max-width: 580px;
    padding: $space-8 $space-6 $space-12;

    &.is-wide {
      max-width: 820px;
    }

    &.is-full-bleed {
      max-width: none;
      padding: 0;
    }
  }
}

.shell-title-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: $space-4;
}

.shell-back-btn {
  @include flex-center;
  width: 40px;
  height: 40px;
  border-radius: $radius-md;
  background: transparent;
  color: var(--text);
  font-size: 1.9rem;
  transition:
    background-color $duration-normal $ease-fluid,
    transform $duration-fast $ease-fluid;

  &:hover {
    background: var(--altbg);
  }

  &:active {
    transform: scale(0.94);
  }
}

.shell-spacer {
  width: 40px;
  flex-shrink: 0;
}

.shell-heading {
  font-size: $text-xl;
  font-weight: $font-extrabold;
  color: var(--text);
  text-align: center;

  @include from($bp-md) {
    font-size: 1.55rem;
  }

  &-accent {
    color: var(--primary);
  }
}

.shell-divider {
  height: 2px;
  width: 100%;
  border-radius: $radius-pill;
  background: var(--primary);
  margin: 6px 0 $space-5;
}

.shell-footer {
  margin-top: auto;
  background: var(--chrome-bg);
  border-top: 2px solid var(--primary);
  color: var(--chrome-text);
  padding: $space-4 22px 22px;
}

.footer-inner {
  max-width: $container-xl;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: $space-2;
  font-size: $text-md;
  font-weight: $font-medium;
}

.footer-icon {
  font-size: 1.15rem;
}
</style>
