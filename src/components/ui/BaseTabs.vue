<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, useTemplateRef, watch } from 'vue'
import { useRoute } from 'vue-router'

const props = defineProps({
  items: {
    type: Array,
    required: true,
    // Each item: { value, label, icon?, to?, badge? }
  },
  ariaLabel: { type: String, default: 'Seções' },
})

const modelValue = defineModel({ type: [String, Number], default: '' })

const route = useRoute()
const trackRef = useTemplateRef('trackRef')
const itemRefs = ref([])
const indicatorStyle = ref({ opacity: 0 })
let resizeObserver = null

function isItemActive(item) {
  if (item.to) return route.path === item.to || route.path.startsWith(`${item.to}/`)
  return modelValue.value === item.value
}

const activeIndex = computed(() => {
  const idx = props.items.findIndex((item) => isItemActive(item))
  return idx >= 0 ? idx : 0
})

function updateIndicator() {
  const track = trackRef.value
  const el = itemRefs.value[activeIndex.value]
  const node = el?.$el || el
  if (!track || !node) {
    indicatorStyle.value = { opacity: 0 }
    return
  }
  indicatorStyle.value = {
    opacity: 1,
    width: `${node.offsetWidth}px`,
    height: `${node.offsetHeight}px`,
    transform: `translate(${node.offsetLeft}px, ${node.offsetTop}px)`,
  }
}

function selectItem(item) {
  if (!item.to && item.value !== modelValue.value) {
    modelValue.value = item.value
  }
}

watch(
  [activeIndex, () => route.fullPath, () => props.items.map((i) => `${i.value}:${i.label}:${i.badge ?? ''}`).join('|')],
  async () => {
    await nextTick()
    updateIndicator()
  },
)

onMounted(async () => {
  await nextTick()
  updateIndicator()
  if (typeof ResizeObserver !== 'undefined' && trackRef.value) {
    resizeObserver = new ResizeObserver(updateIndicator)
    resizeObserver.observe(trackRef.value)
  }
})

onUnmounted(() => {
  resizeObserver?.disconnect()
  resizeObserver = null
})
</script>

<template>
  <nav
    ref="trackRef"
    class="base-tabs"
    :style="{ '--tab-count': items.length }"
    role="tablist"
    :aria-label="ariaLabel"
  >
    <span class="base-tabs-indicator" :style="indicatorStyle" aria-hidden="true"></span>

    <template v-for="(item, idx) in items" :key="item.value ?? item.to">
      <RouterLink
        v-if="item.to"
        :ref="(el) => (itemRefs[idx] = el)"
        :to="item.to"
        class="base-tab-item"
        :class="{ active: isItemActive(item) }"
        role="tab"
        :aria-selected="isItemActive(item)"
      >
        <BaseIcon v-if="item.icon" :name="item.icon" />
        <span class="base-tab-label">{{ item.label }}</span>
        <span v-if="item.badge != null && item.badge !== ''" class="base-tab-badge">
          {{ item.badge }}
        </span>
      </RouterLink>

      <button
        v-else
        :ref="(el) => (itemRefs[idx] = el)"
        type="button"
        class="base-tab-item"
        :class="{ active: isItemActive(item) }"
        role="tab"
        :aria-selected="isItemActive(item)"
        @click="selectItem(item)"
      >
        <BaseIcon v-if="item.icon" :name="item.icon" />
        <span class="base-tab-label">{{ item.label }}</span>
        <span v-if="item.badge != null && item.badge !== ''" class="base-tab-badge">
          {{ item.badge }}
        </span>
      </button>
    </template>
  </nav>
</template>

<style lang="scss" scoped>
.base-tabs {
  position: relative;
  display: grid;
  grid-template-columns: repeat(var(--tab-count, 2), minmax(0, 1fr));
  gap: 4px;
  padding: 4px;
  background: var(--color-surface);
  outline: 1px solid var(--border);
  outline-offset: -1px;
  border-radius: 12px;

  @include until($bp-sm) {
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  }
}

.base-tabs-indicator {
  position: absolute;
  top: 0;
  left: 0;
  border-radius: 9px;
  background: var(--gradient-primary);
  box-shadow: var(--shadow-primary);
  pointer-events: none;
  z-index: 0;
  transition:
    transform 0.28s $ease-fluid,
    width 0.28s $ease-fluid,
    height 0.28s $ease-fluid,
    opacity 0.18s ease;
}

.base-tab-item {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 34px;
  padding: 6px 12px;
  border-radius: 9px;
  color: var(--text-muted);
  font-weight: $font-semibold;
  font-size: $text-sm;
  line-height: 1.25;
  text-align: center;
  text-decoration: none;
  background: transparent;
  transition: color $duration-normal $ease-fluid;

  .mdi {
    font-size: 1.05rem;
    flex-shrink: 0;
  }

  &:hover {
    color: var(--text);
  }

  &.active {
    color: var(--color-on-primary);

    .base-tab-badge {
      background: rgba(255, 255, 255, 0.22);
      color: var(--color-on-primary);
    }
  }
}

.base-tab-label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.base-tab-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 18px;
  padding: 0 6px;
  border-radius: $radius-pill;
  background: var(--altbg);
  color: var(--text-muted);
  font-size: 0.72rem;
  font-weight: $font-bold;
  flex-shrink: 0;
  transition:
    background-color $duration-normal $ease-fluid,
    color $duration-normal $ease-fluid;
}
</style>
