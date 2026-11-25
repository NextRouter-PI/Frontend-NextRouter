<script setup>
defineProps({
  ariaLabel: { type: String, required: true },
  headerIcon: { type: String, required: true },
  headerTitle: { type: String, required: true },
  userName: { type: String, default: '' },
  avatarIcon: { type: String, required: true },
  roleLabel: { type: String, required: true },
  roleIcon: { type: String, default: '' },
})

import { computed, shallowRef } from 'vue'

const expanded = defineModel('expanded', { type: Boolean, default: true })

// Celular: o cartão ocupa a tela entre o topo e o menu de baixo; arrastar a alça para
// baixo recolhe (mostra o mapa) e para cima abre. Clique/Enter na alça também alterna.
const DRAG_THRESHOLD_PX = 70
const dragY = shallowRef(0)
const dragging = shallowRef(false)
let startY = 0
let moved = false

function onPointerDown(event) {
  if (event.button !== 0) return
  startY = event.clientY
  moved = false
  dragging.value = true
  event.currentTarget.setPointerCapture?.(event.pointerId)
}

function onPointerMove(event) {
  if (!dragging.value) return
  const dy = event.clientY - startY
  if (Math.abs(dy) > 6) moved = true
  // Aberto só desce; recolhido só sobe.
  dragY.value = expanded.value ? Math.max(0, dy) : Math.min(0, dy)
}

function onPointerUp() {
  if (!dragging.value) return
  dragging.value = false
  if (expanded.value && dragY.value > DRAG_THRESHOLD_PX) expanded.value = false
  else if (!expanded.value && dragY.value < -DRAG_THRESHOLD_PX) expanded.value = true
  dragY.value = 0
}

function onHandleClick() {
  // Depois de um arraste o navegador ainda dispara click: não alterna de novo.
  if (moved) {
    moved = false
    return
  }
  expanded.value = !expanded.value
}

const dragStyle = computed(() => (dragging.value && dragY.value ? { '--sheet-drag': `${dragY.value}px` } : null))
</script>

<template>
  <section
    class="map-sheet"
    :class="{ collapsed: !expanded, dragging }"
    :style="dragStyle"
    :aria-label="ariaLabel"
  >
    <button
      type="button"
      class="sheet-handle-btn"
      :aria-expanded="expanded"
      :aria-label="expanded ? 'Recolher painel e ver o mapa' : 'Abrir painel'"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
      @click="onHandleClick"
    >
      <span class="sheet-pill" aria-hidden="true"></span>
      <div class="sheet-summary-row">
        <div class="sheet-location">
          <BaseIcon :name="headerIcon" />
          <span>{{ headerTitle }}</span>
        </div>
        <div class="sheet-status-right">
          <slot name="summary-status" />
          <BaseIcon :class="{ rotated: expanded }" name="mdi-chevron-up" class="chevron-icon" />
        </div>
      </div>
    </button>

    <div
      class="sheet-body-collapse"
      :class="{ open: expanded }"
      :aria-hidden="!expanded"
      :inert="!expanded || undefined"
    >
      <div class="sheet-body-inner">
        <div class="sheet-body">
          <div class="sheet-user-row">
            <div class="sheet-avatar">
              <BaseIcon :name="avatarIcon" />
            </div>
            <div class="sheet-user-info">
              <h1>Olá, {{ userName }}</h1>
              <span class="sheet-role-badge">
                <BaseIcon v-if="roleIcon" :name="roleIcon" />
                {{ roleLabel }}
              </span>
            </div>
          </div>

          <slot />
        </div>
      </div>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.map-sheet {
  position: relative;
  z-index: 2;
  width: 100%;
  background: var(--chrome-bg);
  color: var(--chrome-text);
  border-top: 2px solid var(--primary);
  border-radius: 22px 22px 0 0;
  box-shadow: 0 -8px 28px rgba(0, 0, 0, 0.35);
  animation: sheet-slide-up 0.34s $ease-fluid;
}

@keyframes sheet-slide-up {
  from {
    opacity: 0;
    transform: translateY(24px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.sheet-body-collapse {
  display: grid;
  grid-template-rows: 0fr;
  opacity: 0;
  transition:
    grid-template-rows 0.34s $ease-fluid,
    opacity 0.24s $ease-fluid;

  &.open {
    grid-template-rows: 1fr;
    opacity: 1;
  }
}

.sheet-body-inner {
  overflow: hidden;
  min-height: 0;
}

.sheet-handle-btn {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 10px 18px 12px;
  background: transparent;
  border: none;
  color: inherit;
  cursor: pointer;
}

.sheet-pill {
  width: 40px;
  height: 4px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.28);
}

.sheet-summary-row {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.sheet-location {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-on-primary);
  min-width: 0;

  .mdi {
    color: var(--primary);
    font-size: 1.15rem;
  }
}

.sheet-status-right {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.chevron-icon {
  font-size: 1.25rem;
  color: var(--chrome-muted);
  transition: transform $duration-normal $ease-fluid;

  &.rotated {
    transform: rotate(180deg);
  }
}

.sheet-body {
  padding: 2px 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.sheet-user-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.sheet-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--color-primary-tint);
  color: var(--primary);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 1.45rem;
  flex-shrink: 0;
}

.sheet-user-info h1 {
  margin: 0 0 2px;
  font-size: 1.12rem;
  color: var(--color-on-primary);
}

.sheet-role-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.76rem;
  font-weight: 600;
  color: var(--primary);
}

// Celular: tela cheia acima do menu de baixo, encostado nele (sem espaço), por cima do
// cartão da próxima parada e dos botões do mapa; recolhido deixa só a alça à mostra.
@media (max-width: 900px) {
  .map-sheet {
    --sheet-peek: 60px; // altura da alça (pílula + linha da empresa)
    position: fixed;
    left: 0;
    right: 0;
    top: var(--header-height);
    bottom: var(--bottom-nav-height);
    z-index: 6;
    display: flex;
    flex-direction: column;
    border-radius: 22px 22px 0 0;
    box-shadow: 0 -10px 30px rgba(0, 0, 0, 0.4);
    animation: none;
    transform: translateY(var(--sheet-drag, 0px));
    transition: transform 0.4s cubic-bezier(0.25, 1, 0.5, 1);

    &.collapsed {
      transform: translateY(calc(100% - var(--sheet-peek) + var(--sheet-drag, 0px)));
    }

    &.dragging {
      transition: none;
    }
  }

  .sheet-handle-btn {
    flex-shrink: 0;
    touch-action: none;
    cursor: grab;
  }

  .sheet-body-collapse {
    flex: 1;
    min-height: 0;
    // No celular o painel não encolhe a altura: só desce. O conteúdo fica sempre montado.
    grid-template-rows: 1fr;
    opacity: 1;
  }

  .sheet-body-inner {
    overflow-y: auto;
    overscroll-behavior: contain;
  }

  .chevron-icon.rotated {
    transform: rotate(180deg);
  }
}

@media (min-width: 901px) {
  .map-sheet {
    max-width: 390px;
    border: 1.5px solid rgba(236, 131, 20, 0.45);
    border-radius: 20px;
    box-shadow: 0 12px 34px rgba(0, 0, 0, 0.42);
  }
}
</style>
