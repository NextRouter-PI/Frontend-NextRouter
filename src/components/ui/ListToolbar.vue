<script setup>
// Barra das listas: busca à esquerda e o botão principal ("Adicionar ...") do outro lado.
const search = defineModel({ type: String, default: '' })

defineProps({
  placeholder: { type: String, default: 'Buscar...' },
  searchLabel: { type: String, default: 'Buscar' },
  actionLabel: { type: String, default: '' },
  actionIcon: { type: String, default: 'mdi-plus' },
  actionTo: { type: [String, Object], default: null },
})

const emit = defineEmits(['action'])
</script>

<template>
  <div class="list-toolbar">
    <label class="list-search">
      <BaseIcon name="mdi-magnify" class="list-search-icon" />
      <input v-model="search" type="search" :placeholder="placeholder" :aria-label="searchLabel" />
    </label>
    <slot />
    <component
      :is="actionTo ? 'RouterLink' : 'button'"
      v-if="actionLabel"
      :to="actionTo || undefined"
      :type="actionTo ? undefined : 'button'"
      class="list-action"
      @click="!actionTo && emit('action')"
    >
      <BaseIcon :name="actionIcon" />
      <span>{{ actionLabel }}</span>
    </component>
  </div>
</template>

<style lang="scss" scoped>
.list-toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: $space-3;
}

.list-search {
  position: relative;
  flex: 1 1 260px;
  display: flex;
  align-items: center;

  input {
    width: 100%;
    height: 46px;
    padding: 0 $space-4 0 42px;
    border-radius: $radius-md;
    background: var(--color-surface);
    outline: 1.5px solid var(--border);
    outline-offset: -1.5px;
    color: var(--text);
    font-size: $text-md;
    transition:
      outline-color $duration-normal $ease-fluid,
      box-shadow $duration-normal $ease-fluid;

    &:hover {
      outline-color: color-mix(in srgb, var(--primary) 40%, var(--border));
    }

    &:focus {
      outline: 2px solid var(--primary);
      outline-offset: -2px;
      box-shadow: var(--glow-primary);
    }
  }
}

.list-search-icon {
  position: absolute;
  left: 14px;
  font-size: 1.2rem;
  color: var(--text-muted);
  pointer-events: none;
}

.list-action {
  position: relative;
  overflow: hidden;
  isolation: isolate;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: $space-2;
  height: 46px;
  padding: 0 $space-5;
  border-radius: $radius-md;
  background: var(--gradient-brand);
  color: var(--color-on-primary);
  font-weight: $font-bold;
  white-space: nowrap;
  box-shadow: var(--shadow-primary);
  transition:
    transform $duration-normal $ease-fluid,
    box-shadow $duration-normal $ease-fluid;

  .mdi {
    font-size: 1.25rem;
    transition: transform $duration-slow $ease-spring;
  }

  // Brilho que atravessa o botão no hover.
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    z-index: -1;
    background: linear-gradient(110deg, transparent 30%, rgba(255, 255, 255, 0.35) 50%, transparent 70%);
    transform: translateX(-120%);
    transition: transform 0.7s $ease-fluid;
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 14px 28px -10px rgba(236, 131, 20, 0.7);

    .mdi {
      transform: rotate(90deg);
    }

    &::after {
      transform: translateX(120%);
    }
  }

  &:active {
    transform: scale(0.97);
  }

  @include until($bp-sm) {
    flex: 1 1 100%;
  }
}
</style>
