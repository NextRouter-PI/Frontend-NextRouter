<script setup>
import { computed } from 'vue'
import { useInputFormat } from '@/composables/useInputFormat'

const props = defineProps({
  membership: { type: Object, required: true },
  title: { type: String, required: true },
})

const { formatPhone } = useInputFormat()
const labels = {
  pending: 'Pedido pendente',
  active: 'Vínculo ativo',
  rejected: 'Pedido recusado',
  withdrawn: 'Pedido retirado',
  ended: 'Vínculo encerrado',
}
const statusLabel = computed(() => labels[props.membership.status] || 'Estado não reconhecido')
const createdLabel = computed(() => new Date(props.membership.created_at).toLocaleString('pt-BR'))
const formattedPhone = computed(() =>
  props.membership.contact_phone ? formatPhone(props.membership.contact_phone) : ''
)
</script>

<template>
  <article class="membership-card">
    <div class="membership-header">
      <div class="membership-avatar" aria-hidden="true">
        <img
          v-if="membership.applicant_profile_picture_url"
          :src="membership.applicant_profile_picture_url"
          :alt="`Foto de ${title}`"
          class="avatar-img"
          loading="lazy"
        />
        <span v-else class="mdi mdi-account-circle-outline avatar-fallback"></span>
      </div>
      <div class="membership-header-info">
        <h3 class="membership-title">{{ title }}</h3>
        <span :class="['membership-badge', `status-${membership.status}`]">{{ statusLabel }}</span>
      </div>
    </div>

    <p class="membership-meta">
      {{ membership.driver ? 'Motorista' : 'Passageiro' }} · pedido nº {{ membership.id }}
      · <time :datetime="membership.created_at">{{ createdLabel }}</time>
    </p>
    <p v-if="formattedPhone" class="membership-detail">
      <span class="mdi mdi-phone-outline" aria-hidden="true"></span>
      Telefone para contato: <strong>{{ formattedPhone }}</strong>
    </p>
    <p v-if="membership.requested_route_group_name" class="membership-detail">
      <span class="mdi mdi-routes" aria-hidden="true"></span>
      Grupo de rota solicitado: <strong>{{ membership.requested_route_group_name }}</strong>
    </p>
    <slot />
  </article>
</template>

<style lang="scss" scoped>
.membership-card {
  padding: 16px 18px;
  outline: 1px solid var(--border);
  outline-offset: -1px;
  border-left: 4px solid var(--primary);
  border-radius: 14px;
  background: var(--color-surface);
  box-shadow: var(--shadow);
  overflow-wrap: anywhere;
  transition: outline-color 0.2s var(--ease-fluid), transform 0.2s var(--ease-fluid),
    box-shadow 0.2s var(--ease-fluid);
}

.membership-card:hover {
  outline-color: var(--primary);
}

.membership-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}

.membership-avatar {
  width: 50px;
  height: 50px;
  border-radius: 12px;
  flex-shrink: 0;
  overflow: hidden;
  background: var(--input-surface);
  border: 1.5px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-fallback {
  font-size: 30px;
  color: var(--primary);
}

.membership-header-info {
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}

.membership-title {
  margin: 0;
  font-size: 1.05rem;
}

.membership-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  border-radius: 999px;
  font-weight: 700;
  font-size: 0.74rem;
  background: var(--color-primary-tint);
  color: var(--primary);
}

.membership-badge.status-active {
  background: rgba(34, 197, 94, 0.14);
  color: var(--success);
}

.membership-badge.status-pending {
  background: rgba(234, 179, 8, 0.16);
  color: var(--warning);
}

.membership-badge.status-rejected,
.membership-badge.status-withdrawn,
.membership-badge.status-ended {
  background: var(--input-surface);
  color: var(--text-muted);
}

.membership-meta {
  margin: 0 0 8px;
  font-size: 0.85rem;
  color: var(--text-muted);
}

.membership-detail {
  margin: 0 0 8px;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 6px;
}
</style>
