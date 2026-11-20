<script setup>
import { ref, computed, onMounted } from 'vue'
import { state } from '@/stores/state'
import { useAccountScope } from '@/composables/useAccountScope'
import { sessionError } from '@/stores/session'
import { formatApiError } from '@/utils/apiErrors'
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
import SkeletonCard from '@/components/ui/SkeletonCard.vue'

const scope = useAccountScope()
const role = computed(() => state.role)
const loading = ref(false)
const busy = ref(false)
const error = ref('')
const notice = ref('')

const notifications = ref([])
const ratings = ref([])
const lostItems = ref([])
const finishedTravels = ref([])
const participationsByTravel = ref(new Map())
const droppedOffTravelIds = ref(new Set())
const lostItemsSection = ref(null)

const ratingForm = ref({
  travel_id: '',
  score: 5,
  comment: '',
})

const lostItemForm = ref({
  travel_id: '',
  item_description: '',
})

const unreadCount = computed(() => notifications.value.filter((n) => !n.read_at).length)

const rateableTravels = computed(() => {
  if (role.value !== 'passenger') return []
  return finishedTravels.value.filter((t) => droppedOffTravelIds.value.has(t.id))
})

const reportableTravels = computed(() => {
  if (role.value === 'driver') return finishedTravels.value
  if (role.value === 'passenger') return rateableTravels.value
  return []
})

const participationStatusLabel = {
  allocated: 'Alocado',
  on_board: 'Embarcado',
  dropped_off: 'Desembarcado',
  no_show: 'Ausente',
  withdrawn: 'Desistência',
}

const lostItemStatusLabel = {
  reported: 'Relatado',
  found: 'Encontrado',
  returned: 'Devolvido',
}

function nextOperationId() {
  return (
    globalThis.crypto?.randomUUID?.() ||
    `00000000-0000-4000-8000-${String(Date.now()).padStart(12, '0').slice(-12)}`
  )
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  const parts = String(dateStr).split('-')
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`
  return dateStr
}

function canReportLostItem(travel) {
  if (role.value === 'driver') return true
  if (role.value === 'passenger') return droppedOffTravelIds.value.has(travel.id)
  return false
}

function selectTravelForLostItem(travelId) {
  lostItemForm.value.travel_id = travelId
  lostItemsSection.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
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
      role.value === 'passenger'
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
      error.value = sessionError(cause, formatApiError(cause, 'Não foi possível consultar o histórico de viagens e objetos perdidos.'))
    }
  } finally {
    if (scope.current()) loading.value = false
  }
}

async function readNotification(notif) {
  if (!scope.current() || busy.value || notif.read_at) return
  busy.value = true
  error.value = ''
  notice.value = ''
  try {
    const updated = await markNotificationRead(notif.id, { signal: scope.signal })
    if (!scope.current()) return
    const idx = notifications.value.findIndex((n) => n.id === notif.id)
    if (idx !== -1) notifications.value[idx] = updated
    notice.value = 'Aviso marcado como lido.'
  } catch (cause) {
    if (scope.current()) {
      error.value = sessionError(cause, formatApiError(cause, 'Não foi possível marcar o aviso como lido.'))
    }
  } finally {
    if (scope.current()) busy.value = false
  }
}

async function submitRating() {
  if (!scope.current() || busy.value || !ratingForm.value.travel_id) return
  busy.value = true
  error.value = ''
  notice.value = ''
  try {
    await createDriverRating(
      {
        travel_id: Number(ratingForm.value.travel_id),
        score: Number(ratingForm.value.score),
        comment: ratingForm.value.comment,
      },
      { signal: scope.signal },
    )
    if (!scope.current()) return
    notice.value = 'Avaliação registrada.'
    ratingForm.value = { travel_id: '', score: 5, comment: '' }
    await refresh()
  } catch (cause) {
    if (scope.current()) {
      error.value = sessionError(cause, formatApiError(cause, 'Não foi possível registrar a avaliação.'))
    }
  } finally {
    if (scope.current()) busy.value = false
  }
}

async function submitLostItem() {
  if (!scope.current() || busy.value || !lostItemForm.value.travel_id || !lostItemForm.value.item_description.trim()) {
    return
  }
  busy.value = true
  error.value = ''
  notice.value = ''
  try {
    await createLostItem(
      {
        travel_id: Number(lostItemForm.value.travel_id),
        item_description: lostItemForm.value.item_description,
        operation_id: nextOperationId(),
      },
      { signal: scope.signal },
    )
    if (!scope.current()) return
    notice.value = 'Relato de item perdido registrado.'
    lostItemForm.value = { travel_id: '', item_description: '' }
    await refresh()
  } catch (cause) {
    if (scope.current()) {
      error.value = sessionError(cause, formatApiError(cause, 'Não foi possível registrar o relato de item perdido.'))
    }
  } finally {
    if (scope.current()) busy.value = false
  }
}

async function advanceLostItem(item, targetStatus) {
  if (!scope.current() || busy.value) return
  busy.value = true
  error.value = ''
  notice.value = ''
  try {
    await transitionLostItem(
      item.id,
      {
        target_status: targetStatus,
        operation_id: nextOperationId(),
      },
      { signal: scope.signal },
    )
    if (!scope.current()) return
    notice.value =
      targetStatus === 'found'
        ? 'Objeto marcado como encontrado.'
        : 'Objeto marcado como devolvido.'
    await refresh()
  } catch (cause) {
    if (scope.current()) {
      error.value = sessionError(cause, formatApiError(cause, 'Não foi possível avançar o estado de custódia do objeto.'))
    }
  } finally {
    if (scope.current()) busy.value = false
  }
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
      <button type="button" class="btn-outline" :disabled="loading || busy" @click="refresh">
        Atualizar
      </button>
    </div>

    <Transition name="fade-slide">
      <p v-if="notice" class="notice-msg" role="status">{{ notice }}</p>
    </Transition>
    <Transition name="fade-slide">
      <p v-if="error" class="error-msg" role="alert">{{ error }}</p>
    </Transition>
    <SkeletonCard v-if="loading" :count="2" />

    <!-- 1. Viagens passadas -->
    <section class="history-section">
      <h3>Viagens Passadas ({{ finishedTravels.length }})</h3>
      <p v-if="!finishedTravels.length && !loading" class="status-msg">
        Nenhuma viagem finalizada registrada no seu histórico até o momento.
      </p>
      <div v-else class="item-list">
        <div v-for="travel in finishedTravels" :key="travel.id" class="history-card">
          <div class="card-row">
            <div>
              <strong>
                Viagem #{{ travel.id }} · {{ formatDate(travel.date) }}
                ({{ travel.direction === 'outbound' ? 'Ida' : 'Retorno' }})
              </strong>
              <p class="meta-line">
                Veículo: {{ travel.vehicle ? `#${travel.vehicle}` : 'Não informado' }} ·
                Motorista: {{ travel.driver ? `#${travel.driver}` : 'Não informado' }}
                <template v-if="role === 'passenger' && participationsByTravel.get(travel.id)">
                  · Sua presença:
                  <strong>
                    {{
                      participationStatusLabel[participationsByTravel.get(travel.id).status] ||
                      participationsByTravel.get(travel.id).status
                    }}
                  </strong>
                </template>
              </p>
            </div>
            <button
              v-if="['passenger', 'driver'].includes(role) && canReportLostItem(travel)"
              type="button"
              class="btn-small-outline"
              :disabled="busy"
              @click="selectTravelForLostItem(travel.id)"
            >
              <span class="mdi mdi-bag-personal-off-outline" aria-hidden="true"></span>
              Relatar item perdido
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- 2. Itens perdidos -->
    <section ref="lostItemsSection" class="history-section">
      <h3>Itens Perdidos ({{ lostItems.length }})</h3>
      <p class="history-hint">
        Registre itens perdidos nas viagens finalizadas e acompanhe o andamento com a empresa (Relatado → Encontrado → Devolvido).
      </p>

      <form
        v-if="['passenger', 'driver'].includes(role) && reportableTravels.length"
        class="inline-form"
        @submit.prevent="submitLostItem"
      >
        <select v-model="lostItemForm.travel_id" required :disabled="busy" aria-label="Selecionar viagem finalizada">
          <option value="">Selecionar viagem finalizada...</option>
          <option v-for="t in reportableTravels" :key="t.id" :value="t.id">
            Viagem #{{ t.id }} · {{ formatDate(t.date) }} ({{ t.direction === 'outbound' ? 'Ida' : 'Retorno' }})
          </option>
        </select>
        <input
          v-model="lostItemForm.item_description"
          placeholder="Descrição do item perdido (até 255 caracteres)"
          maxlength="255"
          required
          :disabled="busy"
        />
        <button type="submit" class="btn-primary-inline" :disabled="busy">Registrar item perdido</button>
      </form>
      <p v-else-if="['passenger', 'driver'].includes(role) && !loading" class="status-msg">
        Você poderá registrar itens perdidos assim que tiver uma viagem finalizada concluída.
      </p>

      <p v-if="!lostItems.length && !loading" class="status-msg">Nenhum item perdido registrado.</p>
      <div v-else class="item-list">
        <div v-for="item in lostItems" :key="item.id" class="history-card">
          <div class="card-row">
            <div>
              <strong>
                Item #{{ item.id }} · Viagem #{{ item.travel }} ·
                Estado: {{ lostItemStatusLabel[item.status] || item.status }}
              </strong>
              <p class="item-desc">{{ item.item_description }}</p>
              <p class="meta-line">
                Histórico:
                <span v-for="ev in item.events || []" :key="ev.id">
                  [{{ lostItemStatusLabel[ev.status] || ev.status }} em {{ new Date(ev.occurred_at).toLocaleString('pt-BR') }}]
                </span>
              </p>
            </div>
            <div v-if="role === 'company'" class="action-buttons">
              <button
                v-if="item.status === 'reported'"
                type="button"
                class="btn-small-primary"
                :disabled="busy"
                @click="advanceLostItem(item, 'found')"
              >
                Marcar encontrado
              </button>
              <button
                v-else-if="item.status === 'found'"
                type="button"
                class="btn-small-primary"
                :disabled="busy"
                @click="advanceLostItem(item, 'returned')"
              >
                Marcar devolvido
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 3. Avaliações de viagens finalizadas -->
    <section class="history-section">
      <h3>Avaliações de Viagens Finalizadas ({{ ratings.length }})</h3>
      <p class="history-hint">
        Passageiros que concluíram o desembarque em uma viagem finalizada podem avaliar o motorista (nota de 1 a 5).
      </p>

      <form v-if="role === 'passenger' && rateableTravels.length" class="inline-form" @submit.prevent="submitRating">
        <select v-model="ratingForm.travel_id" required :disabled="busy" aria-label="Selecionar viagem para avaliar">
          <option value="">Selecionar viagem finalizada com desembarque...</option>
          <option v-for="t in rateableTravels" :key="t.id" :value="t.id">
            Viagem #{{ t.id }} · {{ formatDate(t.date) }} ({{ t.direction === 'outbound' ? 'Ida' : 'Retorno' }})
          </option>
        </select>
        <select v-model="ratingForm.score" required :disabled="busy" aria-label="Nota de 1 a 5">
          <option v-for="s in [5, 4, 3, 2, 1]" :key="s" :value="s">Nota {{ s }} ★</option>
        </select>
        <input
          v-model="ratingForm.comment"
          placeholder="Comentário opcional (até 500 caracteres)"
          maxlength="500"
          :disabled="busy"
        />
        <button type="submit" class="btn-primary-inline" :disabled="busy">Enviar avaliação</button>
      </form>

      <p v-if="!ratings.length && !loading" class="status-msg">Nenhuma avaliação registrada.</p>
      <div v-else class="item-list">
        <div v-for="r in ratings" :key="r.id" class="history-card">
          <strong>Viagem #{{ r.travel }} · Motorista #{{ r.driver }} · Nota {{ r.score }}/5 ★</strong>
          <p v-if="r.comment" class="meta-line">“{{ r.comment }}”</p>
          <p class="meta-line">Registrada em {{ new Date(r.created_at).toLocaleString('pt-BR') }}</p>
        </div>
      </div>
    </section>

    <!-- 4. Avisos persistentes -->
    <section class="history-section">
      <h3>Avisos ({{ notifications.length }} · não lidos: {{ unreadCount }})</h3>
      <p v-if="!notifications.length && !loading" class="status-msg">Nenhum aviso registrado para sua conta.</p>
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
                Estado informado: <strong>{{ n.payload?.status || '—' }}</strong> ·
                Criado em {{ new Date(n.created_at).toLocaleString('pt-BR') }}
                <span v-if="n.read_at"> · Lido em {{ new Date(n.read_at).toLocaleString('pt-BR') }}</span>
              </p>
            </div>
            <button
              v-if="!n.read_at"
              type="button"
              class="btn-small-primary"
              :disabled="busy"
              @click="readNotification(n)"
            >
              Marcar como lido
            </button>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.history-panel {
  margin-top: 8px;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.history-header h2 {
  margin: 0;
  font-size: 1.35rem;
  color: var(--text);
}

.history-sub {
  margin: 4px 0 0;
  font-size: 0.85rem;
  color: var(--text-muted);
}

.history-section {
  background: var(--superfice);
  outline: 1px solid var(--border);
  outline-offset: -1px;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 18px;
  box-shadow: var(--shadow);
}

.history-section h3 {
  margin: 0 0 6px;
  font-size: 1.05rem;
  color: var(--text);
}

.history-hint {
  margin: 0 0 14px;
  font-size: 0.82rem;
  color: var(--text-muted);
  line-height: 1.45;
}

.inline-form {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 14px;
}

.inline-form select,
.inline-form input {
  flex: 1 1 180px;
  height: 38px;
  padding: 0 10px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--bg);
  color: var(--text);
  font-size: 0.84rem;
  box-sizing: border-box;
}

.item-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.history-card {
  padding: 14px 16px;
  border-radius: 12px;
  outline: 1px solid var(--border);
  outline-offset: -1px;
  background: var(--bg);
  transition: outline-color 0.2s var(--ease-fluid);
}

.history-card:hover {
  outline-color: var(--primary);
}

.history-card.unread {
  border-left: 4px solid var(--primary);
}

.card-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.item-desc {
  margin: 4px 0;
  font-size: 0.9rem;
  color: var(--text);
}

.meta-line {
  margin: 4px 0 0;
  font-size: 0.78rem;
  color: var(--text-muted);
}

.btn-primary-inline {
  height: 38px;
  padding: 0 14px;
  border-radius: 8px;
  border: none;
  background: var(--gradient-primary);
  color: white;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
}

.btn-outline {
  height: 38px;
  padding: 0 14px;
  border-radius: 8px;
  border: 1px solid var(--primary);
  background: transparent;
  color: var(--primary);
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
}

.btn-small-primary {
  padding: 6px 12px;
  border-radius: 8px;
  border: none;
  background: var(--primary);
  color: white;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
}

.btn-small-outline {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid var(--primary);
  background: transparent;
  color: var(--primary);
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
}

.notice-msg {
  padding: 10px 14px;
  border-radius: 10px;
  background: rgba(5, 150, 105, 0.12);
  color: var(--success, #059669);
  font-weight: 600;
  margin-bottom: 12px;
}

.error-msg {
  padding: 10px 14px;
  border-radius: 10px;
  background: rgba(220, 38, 38, 0.12);
  color: var(--danger, #dc2626);
  font-weight: 600;
  margin-bottom: 12px;
}

.status-msg {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin: 8px 0;
}
</style>
