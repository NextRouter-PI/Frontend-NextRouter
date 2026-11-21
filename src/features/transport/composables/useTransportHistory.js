import { computed, ref, shallowRef } from 'vue'
import { USER_ROLES } from '@/constants'
import { useAuthStore } from '@/stores/useAuthStore'
import { useAccountScope } from '@/composables/useAccountScope'
import { useAsyncAction } from '@/composables/useAsyncAction'
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

/**
 * Gerencia histórico de viagens, objetos perdidos, avaliações e avisos para motorista, passageiro ou empresa.
 */
export function useTransportHistory() {
  const auth = useAuthStore()
  const scope = useAccountScope()
  const role = computed(() => auth.role)
  const loading = shallowRef(false)
  const { busy, error, notice, run } = useAsyncAction(scope)

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

  async function refresh({ force = false } = {}) {
    if (!scope.current() || (!force && busy.value)) return
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

  function readNotification(notif) {
    if (notif.read_at) return
    run((signal) => markNotificationRead(notif.id, { signal }), {
      successMessage: 'Aviso marcado como lido.',
      fallbackError: 'Não foi possível marcar o aviso como lido.',
      onSuccess: (updated) => {
        const idx = notifications.value.findIndex((n) => n.id === notif.id)
        if (idx !== -1) notifications.value[idx] = updated
      },
    })
  }

  const handleSubmitRating = ({ travel_id, score, comment, onSuccess }) =>
    run(
      (signal) => createDriverRating({ travel_id: Number(travel_id), score: Number(score), comment }, { signal }),
      {
        successMessage: 'Avaliação registrada.',
        fallbackError: 'Não foi possível registrar a avaliação.',
        onSuccess: async (res) => {
          onSuccess?.(res)
          await refresh({ force: true })
        },
      },
    )

  const handleSubmitLostItem = ({ travel_id, item_description, onSuccess }) =>
    run(
      (signal) =>
        createLostItem({ travel_id: Number(travel_id), item_description, operation_id: createOperationId() }, { signal }),
      {
        successMessage: 'Relato de item perdido registrado.',
        fallbackError: 'Não foi possível registrar o relato de item perdido.',
        onSuccess: async (res) => {
          onSuccess?.(res)
          await refresh({ force: true })
        },
      },
    )

  const handleAdvanceLostItem = ({ item, targetStatus }) =>
    run(
      (signal) =>
        transitionLostItem(item.id, { target_status: targetStatus, operation_id: createOperationId() }, { signal }),
      {
        successMessage:
          targetStatus === 'found' ? 'Objeto marcado como encontrado.' : 'Objeto marcado como devolvido.',
        fallbackError: 'Não foi possível avançar o estado de custódia do objeto.',
        onSuccess: () => refresh({ force: true }),
      },
    )

  return {
    role, loading, busy, error, notice, notifications, ratings, lostItems, finishedTravels,
    participationsByTravel, droppedOffTravelIds, rateableTravels, reportableTravels,
    refresh, readNotification, handleSubmitRating, handleSubmitLostItem, handleAdvanceLostItem,
  }
}
