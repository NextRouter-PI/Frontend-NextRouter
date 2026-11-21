<script setup>
import { computed, shallowRef } from 'vue'
import { useRouter } from 'vue-router'
import { ROUTE_PATHS, SERVICE_DIRECTIONS } from '@/constants'
import { useRotasStore } from '@/stores/useRotasStore'
import { useDebounce } from '@/composables/useDebounce'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import StatusBanner from '@/components/ui/StatusBanner.vue'

const store = useRotasStore()
const router = useRouter()
const busca = shallowRef('')
const buscaDebounced = useDebounce(busca, 150)

const gruposFiltrados = computed(() => {
  const lista = store.grupos || []
  const termo = buscaDebounced.value.trim().toLowerCase()
  if (!termo) return lista
  return lista.filter(
    (g) => g.name.toLowerCase().includes(termo) || g.destinationName.toLowerCase().includes(termo),
  )
})
</script>

<template>
  <div class="groups-tab">
    <div class="search-container">
      <BaseIcon name="mdi-magnify" class="search-icon" />
      <input
        v-model="busca"
        type="text"
        placeholder="Busque por grupo ou ponto de destino..."
        aria-label="Buscar grupo ou ponto de destino"
      />
    </div>

    <Transition name="fade-slide" mode="out-in">
      <EmptyState v-if="store.loading" key="loading" loading description="Carregando grupos e serviços habituais..." />
      <StatusBanner v-else-if="store.error" key="error" variant="danger" :message="store.error" />
      <EmptyState
        v-else-if="!gruposFiltrados.length"
        key="empty"
        icon="mdi-map-outline"
        title="Nenhum grupo de atendimento"
        description="Cadastre o primeiro grupo para configurar serviços habituais e políticas de resposta."
      />

      <div v-else key="list" class="groups-list">
      <BaseCard
        v-for="grupo in gruposFiltrados"
        :key="grupo.id"
        :title="`${grupo.name} · #${grupo.id}`"
        :subtitle="`Destino: ${grupo.destinationName}`"
      >
        <template #actions>
          <BaseButton variant="outline" size="sm" @click="router.push(`/routes/${grupo.id}/edit/settings`)">
            Configurar grupo
          </BaseButton>
        </template>

        <div class="group-card-content">
          <div class="policy-box">
            <BaseIcon name="mdi-clock-outline" class="policy-icon" />
            <span v-if="grupo.policy" class="policy-text">
              Política: abre {{ grupo.policy.opens_days_before }}d antes às
              {{ String(grupo.policy.opens_time).slice(0, 5) }} · fecha
              {{ grupo.policy.normal_days_before }}d antes às
              {{ String(grupo.policy.normal_time).slice(0, 5) }}
              <template v-if="grupo.policy.extension_time">
                · prorrogação {{ grupo.policy.extension_days_before }}d antes às
                {{ String(grupo.policy.extension_time).slice(0, 5) }}
              </template>
            </span>
            <span v-else class="policy-missing">
              Pendência: política de respostas ainda não configurada.
            </span>
          </div>

          <div class="group-section">
            <p class="section-label">
              <BaseIcon name="mdi-bus-clock" />
              Serviços habituais ({{ grupo.services.length }})
            </p>
            <div v-if="grupo.services.length" class="services-list">
              <div v-for="s in grupo.services" :key="s.id" class="service-row">
                <span class="service-direction">
                  {{ s.direction === SERVICE_DIRECTIONS.OUTBOUND ? 'Ida' : 'Retorno' }}
                  {{ s.targetTimeLabel }}
                </span>
                <div class="service-details">
                  <strong class="service-name">{{ s.name }}</strong>
                  <span class="service-meta">
                    {{ s.weekdaysLabel }} · {{ s.vehiclePlate }} · {{ s.driverName }}
                  </span>
                </div>
              </div>
            </div>
            <p v-else class="sem-horario">Nenhum serviço habitual cadastrado neste grupo.</p>
          </div>

          <div class="secao-vinculos">
            <p class="section-label">
              <BaseIcon name="mdi-account-multiple" />
              Passageiros atribuídos ao grupo ({{ grupo.members.length }})
            </p>
            <div v-if="grupo.members.length" class="members-grid">
              <div v-for="m in grupo.members" :key="m.id" class="member-tile">
                <div class="member-info">
                  <strong class="member-name">{{ m.applicantName }}</strong>
                  <span class="member-point">{{ m.pointName }}</span>
                </div>
                <span class="member-services-badge">
                  {{ m.service_ids?.length || 0 }} serviço(s)
                </span>
              </div>
            </div>
            <span v-else class="chip-vazio">Nenhum passageiro atribuído.</span>
          </div>
        </div>
      </BaseCard>
      </div>
    </Transition>

    <button
      type="button"
      class="fab-add"
      aria-label="Cadastrar grupo"
      @click="router.push(ROUTE_PATHS.REGISTER_ROUTE)"
    >
      <BaseIcon name="mdi-plus" />
    </button>
  </div>
</template>

<style lang="scss" scoped>
.groups-tab {
  display: flex;
  flex-direction: column;
  gap: $space-4;
}

.search-container {
  position: relative;
  display: flex;
  align-items: center;

  .search-icon {
    position: absolute;
    left: 14px;
    font-size: 1.2rem;
    color: var(--text-muted);
    pointer-events: none;
  }

  input {
    width: 100%;
    padding: $space-3 $space-4 $space-3 42px;
    border-radius: $radius-md;
    background: var(--color-surface);
    outline: 1.5px solid var(--border);
    outline-offset: -1.5px;
    color: var(--text);
    font-size: $text-md;

    &:focus {
      outline: 2px solid var(--primary);
      outline-offset: -2px;
    }
  }
}

.groups-list {
  display: flex;
  flex-direction: column;
  gap: $space-4;
}

.group-card-content {
  display: flex;
  flex-direction: column;
  gap: $space-4;
}

.policy-box {
  display: flex;
  align-items: flex-start;
  gap: $space-2;
  padding: $space-3 $space-4;
  border-radius: $radius-md;
  background: var(--altbg);
  border: 1px solid var(--border);
  font-size: $text-sm;
  line-height: 1.45;
}

.policy-icon {
  color: var(--primary);
  font-size: 1.05rem;
  margin-top: 1px;
  flex-shrink: 0;
}

.policy-text {
  color: var(--text);
}

.policy-missing {
  color: var(--danger);
  font-weight: $font-semibold;
}

.group-section {
  display: flex;
  flex-direction: column;
  gap: $space-2;
}

.section-label {
  display: flex;
  align-items: center;
  gap: $space-2;
  font-size: $text-sm;
  font-weight: $font-semibold;
  color: var(--text);

  .mdi {
    color: var(--primary);
    font-size: 1.05rem;
  }
}

.services-list {
  display: flex;
  flex-direction: column;
  gap: $space-2;
}

.service-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: $space-3;
  padding: $space-3;
  border-radius: $radius-md;
  background: var(--altbg);
  border: 1px solid var(--border);
}

.service-direction {
  display: inline-flex;
  align-items: center;
  padding: $space-1 $space-3;
  border-radius: $radius-pill;
  background: var(--color-primary-soft);
  color: var(--primary);
  font-size: $text-xs;
  font-weight: $font-bold;
  white-space: nowrap;
}

.service-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1 1 200px;
}

.service-name {
  font-size: $text-sm;
  font-weight: $font-semibold;
  color: var(--text);
}

.service-meta {
  font-size: $text-xs;
  color: var(--text-muted);
  line-height: 1.4;
}

.sem-horario,
.chip-vazio {
  font-size: $text-sm;
  color: var(--text-muted);
}

.secao-vinculos {
  display: flex;
  flex-direction: column;
  gap: $space-3;
  padding-top: $space-3;
  border-top: 1px solid var(--border);
}

.members-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: $space-2;
}

.member-tile {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $space-3;
  padding: $space-2 $space-3;
  border-radius: $radius-md;
  background: var(--altbg);
  border: 1px solid var(--border);
}

.member-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.member-name {
  font-size: $text-sm;
  font-weight: $font-semibold;
  color: var(--text);
  @include truncate;
}

.member-point {
  font-size: $text-xs;
  color: var(--text-muted);
  @include truncate;
}

.member-services-badge {
  flex-shrink: 0;
  padding: 2px $space-2;
  border-radius: $radius-pill;
  background: var(--color-primary-soft);
  color: var(--primary);
  font-size: $text-xs;
  font-weight: $font-semibold;
  white-space: nowrap;
}

.fab-add {
  position: fixed;
  right: $space-6;
  bottom: calc(var(--bottom-nav-height) + #{$space-5});
  width: 56px;
  height: 56px;
  border-radius: $radius-round;
  @include flex-center;
  background: var(--primary);
  color: var(--color-on-primary);
  font-size: 1.7rem;
  box-shadow: var(--shadow-primary);
  z-index: $z-sticky;
  transition: transform $duration-fast $ease-fluid, background-color $duration-normal $ease-fluid;

  &:hover {
    background: var(--primary-hover);
    transform: scale(1.06);
  }

  @include from($bp-desktop + 1px) {
    bottom: $space-6;
  }
}
</style>
