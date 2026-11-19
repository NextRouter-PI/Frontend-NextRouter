<script setup>
import { computed } from 'vue'

const props = defineProps({
  membership: { type: Object, required: true },
  title: { type: String, required: true },
})
const labels = {
  pending: 'Pedido pendente', active: 'Vínculo ativo', rejected: 'Pedido recusado',
  withdrawn: 'Pedido retirado', ended: 'Vínculo encerrado',
}
const statusLabel = computed(() => labels[props.membership.status] || 'Estado não reconhecido')
const createdLabel = computed(() => new Date(props.membership.created_at).toLocaleString('pt-BR'))
</script>

<template>
  <article class="membership-card">
    <h3 class="membership-title">{{ title }}</h3>
    <p class="membership-state">{{ statusLabel }}</p>
    <p class="membership-meta">
      {{ membership.driver ? 'Motorista' : 'Passageiro' }} · pedido nº {{ membership.id }}
      · <time :datetime="membership.created_at">{{ createdLabel }}</time>
    </p>
    <slot />
  </article>
</template>

<style scoped>
.membership-card {
  padding: 18px;
  border: 1px solid var(--border);
  border-left: 4px solid var(--primary);
  border-radius: 12px;
  background: var(--superfice);
  box-shadow: var(--shadow);
  overflow-wrap: anywhere;
}
.membership-title { margin: 0 0 8px; font-size: 1.1rem; }
.membership-state { margin: 0 0 8px; font-weight: 600; }
.membership-meta { margin: 0 0 12px; font-size: 0.85rem; }
</style>
