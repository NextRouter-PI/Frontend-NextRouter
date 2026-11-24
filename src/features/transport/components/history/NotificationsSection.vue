<script setup>
import { computed } from 'vue'
import {
  DOMAIN_STATUS_LABELS,
  NOTIFICATION_KIND_LABELS,
  RESOURCE_TYPE_LABELS,
} from '@/constants'
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

function formatKind(kind) {
  return NOTIFICATION_KIND_LABELS[kind] || kind || 'Aviso'
}

function formatResource(type) {
  return RESOURCE_TYPE_LABELS[type] || type || 'Registro'
}

function formatStatus(status) {
  if (!status) return '—'
  return DOMAIN_STATUS_LABELS[status] || status
}
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
          <span class="notice-icon" aria-hidden="true"><BaseIcon name="mdi-bell-outline" /></span>
          <div class="notice-copy">
            <strong>{{ formatKind(n.kind) }}</strong>
            <span class="notice-resource"> · {{ formatResource(n.resource_type) }}</span>
            <p class="meta-line">
              Estado: <strong>{{ formatStatus(n.payload?.status) }}</strong> · Criado em
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
  position: relative;
  overflow: hidden;
  padding: $space-3;
  border-radius: $radius-md;
  background: var(--altbg);
  border: 1px solid var(--border);

  &.unread {
    border-color: var(--border-primary);
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

.notice-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: $radius-md;
  background: var(--color-primary-soft);
  color: var(--primary);
  font-size: 1.15rem;
}

.notice-copy {
  flex: 1;
  min-width: 0;
}

.notice-resource {
  color: var(--text-muted);
}
</style>
