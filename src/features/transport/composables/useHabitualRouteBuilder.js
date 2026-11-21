import { computed, nextTick, onMounted, ref, shallowRef, watch } from 'vue'
import { useRotasStore } from '@/stores/useRotasStore'
import { useAccountScope } from '@/composables/useAccountScope'
import { useRouteBuilderMap } from '@/features/transport/composables/useRouteBuilderMap'
import { isValidLatLng } from '@/utils/geo'

function mergeCandidateRows(rows, extraSelected) {
  const byId = new Map()
  for (const existing of extraSelected) {
    byId.set(existing.group_membership_id, { ...existing, selected: true })
  }
  for (const row of rows) {
    if (!byId.has(row.group_membership_id)) {
      byId.set(row.group_membership_id, { ...row, selected: false })
    }
  }
  return Array.from(byId.values())
}

/**
 * Coordena carregamento de passageiros sem rota, seleção no mapa e salvamento da rota habitual.
 */
export function useHabitualRouteBuilder({ props, emit, mapContainer }) {
  const store = useRotasStore()
  const scope = useAccountScope()
  const routeName = shallowRef('')
  const editingRouteId = shallowRef(null)
  const savingHabitual = shallowRef(false)
  const habitualError = shallowRef('')
  const habitualNotice = shallowRef('')
  const loadingCandidates = shallowRef(false)
  const candidates = ref([])
  const selectedCandidates = computed(() => candidates.value.filter((c) => c.selected))

  const { renderMarkers, focusPassenger, getCenterCoords, invalidateSize } = useRouteBuilderMap({
    mapContainer,
    candidates,
    getDestinationCoords: () => props.destinationCoords,
    onTogglePassenger: togglePassenger,
  })

  function togglePassenger(item) {
    item.selected = !item.selected
    if (item.selected && (!Number.isFinite(Number(item.latitude)) || !Number.isFinite(Number(item.longitude)))) {
      const center = getCenterCoords()
      item.latitude = center.lat
      item.longitude = center.lng
    }
    renderMarkers()
  }

  async function loadUnassigned(extraSelected = []) {
    if (!scope.current()) return
    loadingCandidates.value = true
    const rows = await store.carregarPassageirosSemRota(props.groupId, { signal: scope.signal })
    if (!scope.current()) return
    candidates.value = mergeCandidateRows(rows, extraSelected)
    loadingCandidates.value = false
    await nextTick()
    invalidateSize()
    renderMarkers()
  }

  function startEditRoute(route) {
    editingRouteId.value = route.id
    routeName.value = route.name
    habitualError.value = ''
    habitualNotice.value = ''
    loadUnassigned(route.passengers || [])
  }

  function cancelEditRoute() {
    editingRouteId.value = null
    routeName.value = ''
    habitualError.value = ''
    loadUnassigned([])
  }

  async function saveHabitualRoute() {
    if (!scope.current() || savingHabitual.value) return
    habitualError.value = ''
    habitualNotice.value = ''
    if (!routeName.value.trim()) {
      habitualError.value = 'Informe o nome da rota habitual.'
      return
    }
    if (!selectedCandidates.value.length) {
      habitualError.value = 'Selecione ao menos um passageiro no mapa ou na lista antes de confirmar a rota.'
      return
    }
    for (const p of selectedCandidates.value) {
      if (!isValidLatLng(p.latitude, p.longitude)) {
        habitualError.value = `Defina ou ajuste as coordenadas de ${p.passenger_name} no mapa.`
        return
      }
    }

    savingHabitual.value = true
    const passengers = selectedCandidates.value.map((p) => ({
      group_membership_id: p.group_membership_id,
      latitude: Number(p.latitude),
      longitude: Number(p.longitude),
    }))
    const result = await store.salvarRotaHabitual(
      props.groupId,
      { name: routeName.value, kind: 'habitual', passengers },
      editingRouteId.value,
      { signal: scope.signal },
    )
    if (!scope.current()) return
    savingHabitual.value = false
    if (!result) {
      habitualError.value = store.error || 'Não foi possível salvar a rota habitual.'
      return
    }
    habitualNotice.value = editingRouteId.value ? 'Rota habitual atualizada com sucesso.' : 'Rota habitual criada com sucesso.'
    editingRouteId.value = null
    routeName.value = ''
    emit('updated')
    await loadUnassigned([])
  }

  watch(
    () => props.groupId,
    () => {
      editingRouteId.value = null
      routeName.value = ''
      loadUnassigned([])
    },
  )

  onMounted(() => loadUnassigned([]))

  return {
    routeName,
    editingRouteId,
    savingHabitual,
    habitualError,
    habitualNotice,
    loadingCandidates,
    candidates,
    selectedCandidates,
    togglePassenger,
    focusPassenger,
    startEditRoute,
    cancelEditRoute,
    saveHabitualRoute,
  }
}
