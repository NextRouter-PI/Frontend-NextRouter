<script setup>
import { computed, onMounted, ref, shallowRef } from 'vue'
import { listHabitualRoutes } from '@/api/transport'
import { useAccountScope } from '@/composables/useAccountScope'

const scope = useAccountScope()
const routes = ref([])
const loading = shallowRef(false)

const habitualRoute = computed(() => routes.value.find((r) => r.kind === 'habitual') || null)
const sharedRoutes = computed(() => routes.value.filter((r) => r.kind === 'shared'))

function formatOwnPoint(point) {
  if (!point) return ''
  const line1 = [point.street, point.number].filter(Boolean).join(', ')
  const line2 = [point.complement, point.neighborhood].filter(Boolean).join(' · ')
  const line3 = [point.city, point.state].filter(Boolean).join('/')
  return [line1, line2, line3].filter(Boolean).join(' — ')
}

onMounted(async () => {
  loading.value = true
  try {
    const data = await listHabitualRoutes({}, { signal: scope.signal })
    if (scope.current()) routes.value = data
  } catch {
    // Falha silenciosa: a tela principal já reporta erros de carregamento
  } finally {
    if (scope.current()) loading.value = false
  }
})
</script>

<template>
  <section v-if="loading || habitualRoute || sharedRoutes.length" class="routes-card" aria-label="Minhas rotas">
    <h3 class="routes-title">Minhas Rotas no Grupo</h3>
    <p v-if="loading" class="routes-muted">Carregando sua rota habitual...</p>
    <template v-else>
      <div v-if="habitualRoute" class="route-box">
        <div class="route-head">
          <span class="route-tag">Rota habitual</span>
          <strong>{{ habitualRoute.name }}</strong>
        </div>
        <p class="route-meta">
          Grupo: <strong>{{ habitualRoute.group_name }}</strong>
          <template v-if="habitualRoute.destination_name"> · Destino: {{ habitualRoute.destination_name }}</template>
        </p>
        <p v-if="habitualRoute.my_point" class="route-meta">
          Seu ponto de embarque: <strong>{{ formatOwnPoint(habitualRoute.my_point) }}</strong>
        </p>
        <div v-if="habitualRoute.services?.length" class="schedule-chips">
          <span v-for="srv in habitualRoute.services" :key="srv.id" class="schedule-chip">
            {{ srv.direction === 'outbound' ? 'Ida' : 'Retorno' }} · {{ srv.target_time }}
            ({{ srv.is_shared ? 'Compartilhado' : 'Habitual' }} — {{ srv.name }})
          </span>
        </div>
      </div>

      <div v-if="sharedRoutes.length" class="shared-box">
        <span class="shared-label">Rotas compartilhadas disponíveis (voltas intermediárias):</span>
        <div class="schedule-chips">
          <span v-for="sr in sharedRoutes" :key="sr.id" class="shared-chip">
            {{ sr.name }}
          </span>
        </div>
      </div>
    </template>
  </section>
</template>

<style scoped>
.routes-card {
  background: var(--superfice);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 16px;
}

.routes-title {
  margin: 0 0 10px;
  font-size: 1.05rem;
  color: var(--primary);
}

.routes-muted {
  margin: 0;
  font-size: 0.88rem;
  color: var(--text-muted);
}

.route-box {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.route-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.route-tag {
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--primary);
  color: #ffffff;
  font-size: 0.75rem;
  font-weight: 700;
}

.route-meta {
  margin: 0;
  font-size: 0.86rem;
  color: var(--text);
  line-height: 1.4;
}

.schedule-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 4px;
}

.schedule-chip,
.shared-chip {
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(223, 128, 26, 0.12);
  color: var(--primary);
  font-size: 0.78rem;
  font-weight: 600;
}

.shared-box {
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.shared-label {
  font-size: 0.82rem;
  color: var(--text-muted);
  font-weight: 600;
}
</style>
