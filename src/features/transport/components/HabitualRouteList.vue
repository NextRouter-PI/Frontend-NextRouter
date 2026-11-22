<script setup>
import { formatAddress } from '@/utils/formatters'
import BaseButton from '@/components/ui/BaseButton.vue'

defineProps({
  routes: { type: Array, default: () => [] },
})

const emit = defineEmits(['edit'])
</script>

<template>
  <div v-if="routes.length" class="route-list">
    <article v-for="route in routes" :key="route.id" class="route-card">
      <div class="route-card-head">
        <div>
          <strong>{{ route.name }}</strong>
          <span class="route-badge">{{ route.passengers?.length || 0 }} passageiro(s)</span>
        </div>
        <BaseButton variant="outline" size="sm" @click="emit('edit', route)">Editar rota</BaseButton>
      </div>
      <ul v-if="route.passengers?.length" class="passenger-summary">
        <li v-for="p in route.passengers" :key="p.group_membership_id">
          <strong>{{ p.passenger_name }}</strong> — {{ formatAddress(p) }}
        </li>
      </ul>
    </article>
  </div>
  <p v-else class="empty-hint">Nenhuma rota habitual cadastrada neste grupo ainda.</p>
</template>

<style lang="scss" scoped>
.route-list {
  display: flex;
  flex-direction: column;
  gap: $space-3;
}

.route-card {
  padding: $space-3;
  border-radius: $radius-md;
  background: var(--altbg);
  border: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: $space-2;

  &-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: $space-2;
  }
}

.route-badge {
  margin-left: $space-2;
  padding: 2px $space-2;
  border-radius: $radius-pill;
  background: var(--color-primary-soft);
  color: var(--primary);
  font-size: $text-xs;
  font-weight: $font-bold;
}

.passenger-summary {
  font-size: $text-xs;
  color: var(--text-muted);
  display: flex;
  flex-direction: column;
  gap: $space-1;
}

.empty-hint {
  font-size: $text-xs;
  color: var(--text-muted);
  margin-bottom: $space-2;
}
</style>
