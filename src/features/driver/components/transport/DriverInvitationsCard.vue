<script setup>
import { formatDateTimeBr } from '@/utils/formatters'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'

defineProps({
  invitations: { type: Array, required: true },
  busy: { type: Boolean, default: false },
})

const emit = defineEmits(['respond'])
</script>

<template>
  <BaseCard
    v-if="invitations.length"
    :title="`Convites de Substituição Pendentes (${invitations.length})`"
    subtitle="O convite não concede acesso ao percurso nem aos participantes antes do seu aceite explícito."
  >
    <div class="invitations-list">
      <div v-for="inv in invitations" :key="inv.id" class="inv-item">
        <div class="inv-copy">
          <strong>Convite #{{ inv.id }} · Viagem #{{ inv.travel }}</strong>
          <p class="inv-meta">
            Período planejado: {{ formatDateTimeBr(inv.planned_start) }} até
            {{ formatDateTimeBr(inv.planned_end) }} · Expira em {{ formatDateTimeBr(inv.expires_at) }}
          </p>
        </div>
        <div class="inv-actions">
          <BaseButton size="sm" :disabled="busy" @click="emit('respond', inv.id, true)">
            Aceitar convite
          </BaseButton>
          <BaseButton variant="outline" size="sm" :disabled="busy" @click="emit('respond', inv.id, false)">
            Recusar
          </BaseButton>
        </div>
      </div>
    </div>
  </BaseCard>
</template>

<style lang="scss" scoped>
.invitations-list {
  display: flex;
  flex-direction: column;
  gap: $space-3;
}

.inv-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: $space-3;
  padding: $space-3;
  border-radius: $radius-md;
  background: var(--altbg);
  border: 1px solid var(--border);
}

.inv-copy {
  display: flex;
  flex-direction: column;
  gap: $space-1;
  font-size: $text-md;
}

.inv-meta {
  font-size: $text-xs;
  color: var(--text-muted);
}

.inv-actions {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;
}
</style>
