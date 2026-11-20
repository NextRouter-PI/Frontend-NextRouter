<script setup>
import { computed } from 'vue'
import { formatDateTimeBr } from '@/utils/formatters'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'

const props = defineProps({
  notifications: { type: Array, required: true },
  loading: { type: Boolean, default: false },
  busy: { type: Boolean, default: false },
})

const emit = defineEmits(['mark-read'])

const unreadCount = computed(() => props.notifications.filter((n) => !n.read_at).length)
</script>

<template>
  <BaseCard :title="`Avisos (${notifications.length} · não lidos: ${unreadCount})`">
    <p v-if="!notifications.length && !loading" class="status-msg">
      Nenhum aviso registrado para sua conta.
    </p>
    <div v-else class="item-list">
      <div
        v-for="n in notifications"
        :key="n.id"
        class="history-card"
        :class="{ unread: !n.read_at }"
      >
        <div class="card-row">
          <div>
            <strong>Aviso #{{ n.id }} · {{ n.kind }}</strong>
            <span> ({{ n.resource_type }} #{{ n.resource_id }})</span>
            <p class="meta-line">
              Estado informado: <strong>{{ n.payload?.status || '—' }}</strong> · Criado em
              {{ formatDateTimeBr(n.created_at) }}
              <span v-if="n.read_at"> · Lido em {{ formatDateTimeBr(n.read_at) }}</span>
            </p>
          </div>
          <BaseButton v-if="!n.read_at" size="sm" :disabled="busy" @click="emit('mark-read', n)">
            Marcar como lido
          </BaseButton>
        </div>
      </div>
    </div>
  </BaseCard>
</template>

<style lang="scss" scoped>
.item-list {
  display: flex;
  flex-direction: column;
  gap: $space-2;
}

.history-card {
  padding: $space-3;
  border-radius: $radius-md;
  background: var(--altbg);
  border: 1px solid var(--border);

  &.unread {
    border-left: 4px solid var(--primary);
  }
}

.card-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: $space-2;
}

.status-msg,
.meta-line {
  font-size: $text-xs;
  color: var(--text-muted);

  strong {
    color: var(--text);
  }
}
</style>
