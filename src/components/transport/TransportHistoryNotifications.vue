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
const droppedOffTravelIds = ref(new Set())

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

function nextOperationId() {
  return (
    globalThis.crypto?.randomUUID?.() ||
    `00000000-0000-4000-8000-${String(Date.now()).padStart(12, '0').slice(-12)}`
  )
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
        ? listTravelParticipations({ status: 'dropped_off' }, { signal: scope.signal })
        : Promise.resolve([]),
    ])
    if (!scope.current()) return
    notifications.value = notifs
    ratings.value = rats
    lostItems.value = items
    finishedTravels.value = travels
    droppedOffTravelIds.value = new Set(parts.map((p) => p.travel))
  } catch (cause) {
    if (scope.current()) {
      error.value = sessionError(cause, formatApiError(cause, 'Não foi possível consultar avisos, avaliações e objetos perdidos.'))
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
    notice.value = 'Relato de objeto perdido registrado.'
    lostItemForm.value = { travel_id: '', item_description: '' }
    await refresh()
  } catch (cause) {
    if (scope.current()) {
      error.value = sessionError(cause, formatApiError(cause, 'Não foi possível registrar o relato de objeto perdido.'))
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
        <h2>Avisos, Avaliações e Objetos Perdidos</h2>
        <p class="history-sub">
          Avisos são restritos ao destinatário. Ex-vinculados não acessam histórico operacional.
        </p>
      </div>
      <button type="button" class="btn-outline" :disabled="loading || busy" @click="refresh">
        Atualizar
      </button>
    </div>

    <p v-if="notice" class="notice-msg" role="status">{{ notice }}</p>
    <p v-if="error" class="error-msg" role="alert">{{ error }}</p>
    <p v-if="loading" class="status-msg">Consultando avisos e histórico autorizado...</p>

    <!-- 1. Avisos persistentes (6.6) -->
    <section class="history-section">
      <h3>Avisos Persistentes ({{ notifications.length }} · não lidos: {{ unreadCount }})</h3>
      <p class="history-hint">
        O payload mínimo do aviso informa a transição (`kind`, `resource_type`, `resource_id`, `payload`), sem conceder acesso indevido ao recurso.
      </p>
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

    <!-- 2. Avaliações de viagens finalizadas (6.5) -->
    <section class="history-section">
      <h3>Avaliações de Viagens Finalizadas ({{ ratings.length }})</h3>
      <p class="history-hint">
        Somente passageiros com desembarque registrado (`dropped_off`) em viagem finalizada e vínculo ativo podem avaliar o motorista (nota de 1 a 5). Não há edição ou exclusão.
      </p>

      <form v-if="role === 'passenger' && rateableTravels.length" class="inline-form" @submit.prevent="submitRating">
        <select v-model="ratingForm.travel_id" required :disabled="busy">
          <option value="">Selecionar viagem finalizada com desembarque...</option>
          <option v-for="t in rateableTravels" :key="t.id" :value="t.id">
            Viagem #{{ t.id }} · {{ t.date }} ({{ t.direction === 'outbound' ? 'Ida' : 'Retorno' }})
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

      <p v-if="!ratings.length && !loading" class="status-msg">Nenhuma avaliação registrada no seu escopo autorizado.</p>
      <div v-else class="item-list">
        <div v-for="r in ratings" :key="r.id" class="history-card">
          <strong>Viagem #{{ r.travel }} · Motorista #{{ r.driver }} · Nota {{ r.score }}/5 ★</strong>
          <p v-if="r.comment" class="meta-line">“{{ r.comment }}”</p>
          <p class="meta-line">Registrada em {{ new Date(r.created_at).toLocaleString('pt-BR') }}</p>
        </div>
      </div>
    </section>

    <!-- 3. Objetos perdidos e cadeia de custódia (6.5) -->
    <section class="history-section">
      <h3>Objetos Perdidos ({{ lostItems.length }})</h3>
      <p class="history-hint">
        Relatos podem ser abertos pelo passageiro desembarcado ou motorista da viagem finalizada. Outros alunos não veem relatos de terceiros. Somente a empresa avança a custódia na sequência `reported → found → returned`, sem reabertura ou exclusão.
      </p>

      <form
        v-if="['passenger', 'driver'].includes(role) && reportableTravels.length"
        class="inline-form"
        @submit.prevent="submitLostItem"
      >
        <select v-model="lostItemForm.travel_id" required :disabled="busy">
          <option value="">Selecionar viagem finalizada...</option>
          <option v-for="t in reportableTravels" :key="t.id" :value="t.id">
            Viagem #{{ t.id }} · {{ t.date }} ({{ t.direction === 'outbound' ? 'Ida' : 'Retorno' }})
          </option>
        </select>
        <input
          v-model="lostItemForm.item_description"
          placeholder="Descrição do objeto perdido (até 255 caracteres)"
          maxlength="255"
          required
          :disabled="busy"
        />
        <button type="submit" class="btn-primary-inline" :disabled="busy">Relatar objeto</button>
      </form>

      <p v-if="!lostItems.length && !loading" class="status-msg">Nenhum relato de objeto perdido disponível.</p>
      <div v-else class="item-list">
        <div v-for="item in lostItems" :key="item.id" class="history-card">
          <div class="card-row">
            <div>
              <strong>Objeto #{{ item.id }} · Viagem #{{ item.travel }} · Estado: {{ item.status }}</strong>
              <p class="item-desc">{{ item.item_description }}</p>
              <p class="meta-line">
                Eventos de custódia:
                <span v-for="ev in item.events || []" :key="ev.id">
                  [{{ ev.status }} em {{ new Date(ev.occurred_at).toLocaleString('pt-BR') }}]
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
                Marcar encontrado (`found`)
              </button>
              <button
                v-else-if="item.status === 'found'"
                type="button"
                class="btn-small-primary"
                :disabled="busy"
                @click="advanceLostItem(item, 'returned')"
              >
                Marcar devolvido (`returned`)
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.history-panel {
  margin-top: 24px;
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
  font-size: 1.25rem;
  color: var(--text);
}

.history-sub {
  margin: 4px 0 0;
  font-size: 0.85rem;
  color: var(--text-muted);
}

.history-section {
  background: var(--superfice);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 18px;
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
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: var(--bg);
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
