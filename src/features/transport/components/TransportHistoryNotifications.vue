<script setup>
import { computed, onMounted, ref, shallowRef } from 'vue'
import { USER_ROLES } from '@/constants'
import { state } from '@/stores/state'
import { useAccountScope } from '@/composables/useAccountScope'
import { sessionError } from '@/stores/session'
import { formatApiError } from '@/utils/apiErrors'
import { createOperationId } from '@/stores/transport/helpers'
import {
  listNotifications,
  markNotificationRead,
  listDriverRatings,
  createDriverRating,
  listLostItems,
  createLostItem,
  transitionLostItem,
  listTravels,
  listTravelParticipations,
} from '@/api/transport'
import BaseButton from '@/components/ui/BaseButton.vue'
import StatusBanner from '@/components/ui/StatusBanner.vue'
import SkeletonCard from '@/components/ui/SkeletonCard.vue'
import LostItemsSection from './history/LostItemsSection.vue'
import DriverRatingsSection from './history/DriverRatingsSection.vue'
import NotificationsSection from './history/NotificationsSection.vue'

const scope = useAccountScope()
const role = computed(() => state.role)
const loading = shallowRef(false)
const busy = shallowRef(false)
const error = shallowRef('')
const notice = shallowRef('')

const notifications = ref([])
const ratings = ref([])
const lostItems = ref([])
const finishedTravels = ref([])
const participationsByTravel = ref(new Map())
const droppedOffTravelIds = ref(new Set())

const rateableTravels = computed(() =>
  role.value === USER_ROLES.PASSENGER
    ? finishedTravels.value.filter((t) => droppedOffTravelIds.value.has(t.id))
    : [],
)

const reportableTravels = computed(() => {
  if (role.value === USER_ROLES.DRIVER) return finishedTravels.value
  if (role.value === USER_ROLES.PASSENGER) return rateableTravels.value
  return []
})

function formatDate(dateStr) {
  if (!dateStr) return '—'
  const parts = String(dateStr).split('-')
  return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : dateStr
}

async function refresh() {
  if (!scope.current() || busy.value) return
  loading.value = true
  error.value = ''
  try {
    const [notifs, rats, items, travels, parts] = await Promise.all([
      listNotifications({}, { signal: scope.signal }),
      listDriverRatings({}, { signal: scope.signal }),
      listLostItems({}, { signal: scope.signal }),
      listTravels({ status: 'finished' }, { signal: scope.signal }),
      role.value === USER_ROLES.PASSENGER
        ? listTravelParticipations({}, { signal: scope.signal })
        : Promise.resolve([]),
    ])
    if (!scope.current()) return
    notifications.value = notifs
    ratings.value = rats
    lostItems.value = items
    finishedTravels.value = travels
    const map = new Map()
    const dropped = new Set()
    for (const p of parts) {
      map.set(p.travel, p)
      if (p.status === 'dropped_off') dropped.add(p.travel)
    }
    participationsByTravel.value = map
    droppedOffTravelIds.value = dropped
  } catch (cause) {
    if (scope.current()) {
      error.value = sessionError(
        cause,
        formatApiError(cause, 'Não foi possível consultar o histórico de viagens e objetos perdidos.'),
      )
    }
  } finally {
    if (scope.current()) loading.value = false
  }
}

async function runMutation(fn, successMsg, fallbackError, { reload = true, onSuccess } = {}) {
  if (!scope.current() || busy.value) return
  busy.value = true
  error.value = ''
  notice.value = ''
  try {
    const res = await fn()
    if (!scope.current()) return
    notice.value = successMsg
    onSuccess?.(res)
    if (reload) await refresh()
  } catch (cause) {
    if (scope.current()) {
      error.value = sessionError(cause, formatApiError(cause, fallbackError))
    }
  } finally {
    if (scope.current()) busy.value = false
  }
}

function readNotification(notif) {
  if (notif.read_at) return
  runMutation(
    () => markNotificationRead(notif.id, { signal: scope.signal }),
    'Aviso marcado como lido.',
    'Não foi possível marcar o aviso como lido.',
    {
      reload: false,
      onSuccess: (updated) => {
        const idx = notifications.value.findIndex((n) => n.id === notif.id)
        if (idx !== -1) notifications.value[idx] = updated
      },
    },
  )
}

function handleSubmitRating({ travel_id, score, comment, onSuccess }) {
  runMutation(
    () =>
      createDriverRating(
        { travel_id: Number(travel_id), score: Number(score), comment },
        { signal: scope.signal },
      ),
    'Avaliação registrada.',
    'Não foi possível registrar a avaliação.',
    { onSuccess },
  )
}

function handleSubmitLostItem({ travel_id, item_description, onSuccess }) {
  runMutation(
    () =>
      createLostItem(
        { travel_id: Number(travel_id), item_description, operation_id: createOperationId() },
        { signal: scope.signal },
      ),
    'Relato de item perdido registrado.',
    'Não foi possível registrar o relato de item perdido.',
    { onSuccess },
  )
}

function handleAdvanceLostItem({ item, targetStatus }) {
  runMutation(
    () =>
      transitionLostItem(
        item.id,
        { target_status: targetStatus, operation_id: createOperationId() },
        { signal: scope.signal },
      ),
    targetStatus === 'found' ? 'Objeto marcado como encontrado.' : 'Objeto marcado como devolvido.',
    'Não foi possível avançar o estado de custódia do objeto.',
  )
}

onMounted(refresh)
</script>

<template>
  <div class="history-panel">
    <div class="history-header">
      <div>
        <h2>Histórico de Viagens e Itens Perdidos</h2>
        <p class="history-sub">
          Visualize suas viagens finalizadas, registre itens perdidos e acompanhe avaliações e avisos.
        </p>
      </div>
      <BaseButton variant="outline" size="sm" :disabled="loading || busy" @click="refresh">
        Atualizar
      </BaseButton>
    </div>

    <StatusBanner variant="success" :message="notice" />
    <StatusBanner variant="danger" :message="error" />
    <SkeletonCard v-if="loading" :count="2" />

    <LostItemsSection
      :role="role"
      :finished-travels="finishedTravels"
      :reportable-travels="reportableTravels"
      :lost-items="lostItems"
      :participations-by-travel="participationsByTravel"
      :dropped-off-travel-ids="droppedOffTravelIds"
      :format-date="formatDate"
      :loading="loading"
      :busy="busy"
      @submit-lost-item="handleSubmitLostItem"
      @advance-lost-item="handleAdvanceLostItem"
    />

    <DriverRatingsSection
      :role="role"
      :ratings="ratings"
      :rateable-travels="rateableTravels"
      :format-date="formatDate"
      :loading="loading"
      :busy="busy"
      @submit-rating="handleSubmitRating"
    />

    <NotificationsSection
      :notifications="notifications"
      :loading="loading"
      :busy="busy"
      @mark-read="readNotification"
    />
  </div>
</template>

<style lang="scss" scoped>
.history-panel {
  margin-top: $space-2;
  display: flex;
  flex-direction: column;
  gap: $space-4;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: $space-3;

  h2 {
    font-size: $text-lg;
    font-weight: $font-bold;
  }
}

.history-sub {
  font-size: $text-sm;
  color: var(--text-muted);
  margin-top: $space-1;
}
</style>
