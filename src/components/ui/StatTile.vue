<script setup>
import { computed, toRef } from 'vue'
import { useCountUp } from '@/composables/useCountUp'

// Card de número do painel: ícone em degradê, valor que conta até o número e dica curta.
const props = defineProps({
  icon: { type: String, required: true },
  label: { type: String, required: true },
  value: { type: [Number, String], default: null },
  total: { type: Number, default: null },
  hint: { type: String, default: '' },
  tone: { type: String, default: 'orange', validator: (v) => ['orange', 'green', 'blue', 'gray'].includes(v) },
  to: { type: [String, Object], default: null },
  loading: { type: Boolean, default: false },
})

const animated = useCountUp(toRef(props, 'value'))
const shown = computed(() => (props.value === null || props.value === undefined ? '—' : animated.value))
// Barra de progresso quando há um total (ex.: 3 de 5 veículos ativos).
const percent = computed(() =>
  typeof props.value === 'number' && props.total ? Math.min(100, Math.round((props.value / props.total) * 100)) : null,
)
</script>

<template>
  <component :is="to ? 'RouterLink' : 'div'" :to="to || undefined" class="stat-tile" :class="[`tone-${tone}`, { link: to }]">
    <span class="stat-tile-icon" aria-hidden="true"><BaseIcon :name="icon" /></span>
    <div class="stat-tile-body">
      <span class="stat-tile-label">{{ label }}</span>
      <span class="stat-tile-value">
        <span v-if="loading" class="stat-tile-skeleton" aria-hidden="true"></span>
        <template v-else>
          {{ shown }}<small v-if="total !== null"> / {{ total }}</small>
        </template>
      </span>
      <span v-if="percent !== null" class="stat-tile-bar" aria-hidden="true">
        <span :style="{ width: `${percent}%` }"></span>
      </span>
      <span v-if="hint" class="stat-tile-hint">{{ hint }}</span>
    </div>
    <BaseIcon v-if="to" name="mdi-arrow-right" class="stat-tile-arrow" />
  </component>
</template>

<style lang="scss" scoped>
.stat-tile {
  @include surface-card($space-4, $radius-lg);
  position: relative;
  overflow: hidden;
  isolation: isolate;
  display: flex;
  align-items: flex-start;
  gap: $space-3;
  color: var(--text);
  transition:
    transform $duration-slow $ease-fluid,
    box-shadow $duration-slow $ease-fluid,
    outline-color $duration-normal $ease-fluid;

  // Em duas colunas no celular: ícone em cima, número embaixo.
  @include until($bp-sm) {
    flex-direction: column;
    gap: $space-2;
    padding: $space-3;
  }

  // Brilho que acende no canto no hover.
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: -1;
    background: radial-gradient(16rem 9rem at 100% 0%, var(--tile-glow), transparent 70%);
    opacity: 0;
    transition: opacity $duration-slow $ease-fluid;
  }

  &:hover {
    transform: translateY(-3px);
    box-shadow: var(--shadow-hover);

    &::before {
      opacity: 1;
    }

    .stat-tile-icon {
      transform: rotate(-8deg) scale(1.08);
    }

    .stat-tile-arrow {
      opacity: 1;
      transform: none;
    }
  }
}

.tone-orange {
  --tile-a: #f59a32;
  --tile-b: #d4710c;
  --tile-glow: rgba(236, 131, 20, 0.16);
}

.tone-green {
  --tile-a: #4ade80;
  --tile-b: #16a34a;
  --tile-glow: rgba(34, 197, 94, 0.14);
}

.tone-blue {
  --tile-a: #60a5fa;
  --tile-b: #2563eb;
  --tile-glow: rgba(59, 130, 246, 0.14);
}

.tone-gray {
  --tile-a: #a1a1aa;
  --tile-b: #52525b;
  --tile-glow: rgba(113, 113, 122, 0.14);
}

.stat-tile-icon {
  @include flex-center;
  flex-shrink: 0;
  width: 46px;
  height: 46px;
  border-radius: $radius-lg;
  background: linear-gradient(135deg, var(--tile-a), var(--tile-b));
  color: #fff;
  font-size: 1.4rem;
  box-shadow: 0 8px 18px -8px var(--tile-b);
  transition: transform $duration-slow $ease-spring;
}

.stat-tile-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
}

.stat-tile-label {
  font-size: 0.68rem;
  font-weight: $font-bold;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-muted);
}

.stat-tile-value {
  font-size: 1.7rem;
  font-weight: $font-extrabold;
  line-height: 1.1;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;

  small {
    font-size: 0.95rem;
    font-weight: $font-semibold;
    color: var(--text-muted);
  }
}

.stat-tile-skeleton {
  display: block;
  width: 56px;
  height: 26px;
  margin-top: 2px;
  border-radius: $radius-sm;
  background: linear-gradient(90deg, var(--altbg), var(--border), var(--altbg));
  background-size: 200% 100%;
  animation: tile-shimmer 1.2s linear infinite;
}

@keyframes tile-shimmer {
  to {
    background-position: -200% 0;
  }
}

.stat-tile-bar {
  display: block;
  height: 5px;
  margin: 6px 0 2px;
  border-radius: $radius-pill;
  background: var(--altbg);
  overflow: hidden;

  span {
    display: block;
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(90deg, var(--tile-a), var(--tile-b));
    animation: tile-bar 1s $ease-fluid both;
    transform-origin: left;
  }
}

@keyframes tile-bar {
  from {
    transform: scaleX(0);
  }
}

.stat-tile-hint {
  font-size: $text-xs;
  color: var(--text-muted);
}

.stat-tile-arrow {
  align-self: center;
  color: var(--primary);
  opacity: 0;
  transform: translateX(-6px);
  transition:
    opacity $duration-normal $ease-fluid,
    transform $duration-normal $ease-fluid;
}
</style>
