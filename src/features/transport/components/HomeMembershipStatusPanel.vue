<script setup>
defineProps({
  loaded: { type: Boolean, default: false },
  membership: { type: Object, default: null },
  company: { type: Object, default: null },
  noneDescription: { type: String, required: true },
})
</script>

<template>
  <Transition name="fade-slide" mode="out-in">
    <div v-if="!loaded" key="loading" class="sheet-panel sheet-skeleton" role="status" aria-label="Carregando vínculo">
      <span class="sheet-skeleton-bar title"></span>
      <span class="sheet-skeleton-bar line"></span>
      <span class="sheet-skeleton-bar line short"></span>
    </div>

    <div v-else-if="!membership" key="none" class="sheet-panel">
      <p class="panel-title">Sem vínculo empresarial</p>
      <p class="panel-meta">{{ noneDescription }}</p>
      <div class="sheet-actions">
        <RouterLink to="/companies" class="sheet-cta">Buscar empresas</RouterLink>
        <RouterLink to="/memberships" class="sheet-cta-outline">Meus vínculos</RouterLink>
      </div>
    </div>

    <div v-else-if="membership?.status === 'pending'" key="pending" class="sheet-panel pending">
      <p class="panel-title">Solicitação pendente</p>
      <p class="panel-meta">
        Aguardando aprovação de <strong>{{ company?.trade_name || `Empresa #${membership.company}` }}</strong>.
      </p>
      <div class="sheet-actions">
        <RouterLink to="/memberships" class="sheet-cta-outline">Acompanhar pedido</RouterLink>
      </div>
    </div>

    <div v-else-if="membership?.status === 'active'" key="active" class="sheet-panel active">
      <slot name="active" />
    </div>
  </Transition>
</template>

<style lang="scss" scoped>
.sheet-skeleton {
  min-height: 92px;
  justify-content: center;
}

.sheet-skeleton-bar {
  display: block;
  height: 11px;
  border-radius: 6px;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.06) 25%, rgba(255, 255, 255, 0.14) 50%, rgba(255, 255, 255, 0.06) 75%);
  background-size: 200% 100%;
  animation: sheet-shimmer 1.35s ease-in-out infinite;

  &.title {
    width: 46%;
    height: 14px;
  }

  &.line {
    width: 90%;
  }

  &.short {
    width: 64%;
  }
}

@keyframes sheet-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.sheet-panel {
  padding: 14px;
  border-radius: 14px;
  background: var(--chrome-surface);
  border: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  gap: 8px;

  &.pending {
    border-color: rgba(234, 179, 8, 0.4);
  }

  &.active {
    border-color: rgba(34, 197, 94, 0.35);
  }
}

:deep(.panel-title) {
  margin: 0;
  font-size: 0.94rem;
  font-weight: 700;
  color: var(--color-on-primary);
}

:deep(.panel-meta) {
  margin: 0;
  font-size: 0.82rem;
  line-height: 1.45;
  color: var(--chrome-muted);

  strong {
    color: var(--color-on-primary);
  }
}

:deep(.sheet-actions) {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 4px;
}

:deep(.sheet-cta),
:deep(.sheet-cta-outline) {
  @include action-button;
  flex: 1 1 130px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 14px;
  font-size: 0.85rem;
  font-weight: 700;
  text-decoration: none;
}

:deep(.sheet-cta) {
  background: var(--primary);
  color: var(--color-on-primary);

  &:hover {
    background: var(--primary-hover);
  }
}

:deep(.sheet-cta-outline) {
  background: transparent;
  color: var(--color-on-primary);
  border: 1.5px solid rgba(255, 255, 255, 0.25);

  &:hover {
    border-color: var(--primary);
    color: var(--primary);
  }
}
</style>
