<script setup>
import { computed } from 'vue'

const props = defineProps({
  company: { type: Object, required: true },
  logged: { type: Boolean, default: false },
  canRequestMembership: { type: Boolean, default: false },
})

const locationText = computed(() => {
  const groups = Array.isArray(props.company.route_groups) ? props.company.route_groups : []
  const served = []
  const seen = new Set()
  for (const group of groups) {
    const label = [group.city, group.state].filter(Boolean).join(' ')
    if (label && !seen.has(label.toLowerCase())) {
      seen.add(label.toLowerCase())
      served.push(label)
    }
  }
  if (served.length) return served.join(' · ')
  return [props.company.city, props.company.state].filter(Boolean).join(' ')
})

const defaultGroupId = computed(() => props.company.route_groups?.[0]?.id ?? null)

function linkQuery(groupId = defaultGroupId.value) {
  return groupId ? { company: props.company.id, group: groupId } : { company: props.company.id }
}
</script>

<template>
  <article class="company-card">
    <div class="company-media" aria-hidden="true">
      <img
        v-if="company.profile_picture_url"
        :src="company.profile_picture_url"
        :alt="`Logo de ${company.trade_name}`"
        class="company-logo"
        loading="lazy"
      />
      <BaseIcon v-else name="mdi-bus-side" class="company-placeholder-icon" />
    </div>

    <div class="company-body">
      <h2 class="company-name">{{ company.trade_name }}</h2>
      <p v-if="locationText" class="company-location">{{ locationText }}</p>

      <div v-if="company.route_groups.length" class="groups-section">
        <span class="groups-label">Grupos atendidos:</span>
        <ul class="groups-list">
          <li v-for="group in company.route_groups" :key="group.id" class="group-chip">
            {{ group.name }}
          </li>
        </ul>
      </div>

      <div class="card-footer">
        <RouterLink
          v-if="logged && canRequestMembership"
          class="card-action"
          :to="{ name: 'vinculos', query: linkQuery() }"
        >
          Solicitar vínculo
          <BaseIcon name="mdi-chevron-right" />
        </RouterLink>
        <RouterLink
          v-else-if="!logged"
          class="card-action"
          :to="{ name: 'login', query: linkQuery() }"
        >
          Entrar para solicitar
          <BaseIcon name="mdi-chevron-right" />
        </RouterLink>
        <p v-else class="card-note">
          Apenas contas de passageiro ou motorista solicitam vínculo.
        </p>
      </div>
    </div>
  </article>
</template>

<style lang="scss" scoped>
.company-card {
  display: flex;
  align-items: stretch;
  gap: 12px;
  padding: 12px;
  border-radius: 12px;
  background: var(--primary);
  color: var(--color-on-primary);
  box-shadow: var(--shadow);
  overflow-wrap: anywhere;
  content-visibility: auto;
  contain-intrinsic-size: auto 140px;
}

.company-media {
  width: 96px;
  min-height: 96px;
  flex-shrink: 0;
  border-radius: 10px;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: 6px;
}

.company-logo {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.company-placeholder-icon {
  font-size: 46px;
  color: var(--primary);
}

.company-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.company-name {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
  line-height: 1.25;
  color: var(--color-on-primary);
}

.company-location {
  margin: 0;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.92);
}

.groups-section {
  margin-top: 4px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.groups-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
}

.groups-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.group-chip {
  padding: 3px 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.22);
  color: var(--color-on-primary);
  font-size: 0.78rem;
  font-weight: 600;
}

.card-footer {
  margin-top: auto;
  padding-top: 8px;
}

.card-action {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border-radius: 999px;
  background: #ffffff;
  color: #1c1917;
  font-size: 0.84rem;
  font-weight: 700;
  text-decoration: none;
  transition: opacity 0.2s ease;
}

.card-action:hover {
  opacity: 0.9;
}

.card-note {
  margin: 0;
  font-size: 0.78rem;
  color: rgba(255, 255, 255, 0.92);
}

@media (min-width: 600px) {
  .company-card {
    gap: 16px;
    padding: 16px;
  }

  .company-media {
    width: 112px;
    min-height: 112px;
  }

  .company-name {
    font-size: 1.15rem;
  }
}
</style>
