<script setup>
import { computed, shallowRef } from 'vue'
import { useRouter } from 'vue-router'
import { ROUTE_PATHS, SERVICE_DIRECTIONS } from '@/constants'
import { useRotasStore } from '@/stores/useRotasStore'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import StatusBanner from '@/components/ui/StatusBanner.vue'

const store = useRotasStore()
const router = useRouter()
const busca = shallowRef('')

const gruposFiltrados = computed(() => {
  const lista = store.grupos || []
  const termo = busca.value.trim().toLowerCase()
  if (!termo) return lista
  return lista.filter(
    (g) => g.name.toLowerCase().includes(termo) || g.destinationName.toLowerCase().includes(termo),
  )
})
</script>

<template>
  <div class="groups-tab">
    <div class="search-container">
      <span class="mdi mdi-magnify search-icon" aria-hidden="true"></span>
      <input
        v-model="busca"
        type="text"
        placeholder="Busque por grupo ou ponto de destino..."
        aria-label="Buscar grupo ou ponto de destino"
      />
    </div>

    <EmptyState v-if="store.loading" loading description="Carregando grupos e serviços habituais..." />
    <StatusBanner v-else-if="store.error" variant="danger" :message="store.error" />
    <EmptyState
      v-else-if="!gruposFiltrados.length"
      icon="mdi-map-outline"
      title="Nenhum grupo de atendimento"
      description="Cadastre o primeiro grupo para configurar serviços habituais e políticas de resposta."
    />

    <div v-else class="groups-list">
      <BaseCard
        v-for="grupo in gruposFiltrados"
        :key="grupo.id"
        :title="`${grupo.name} · #${grupo.id}`"
        :subtitle="`Destino: ${grupo.destinationName}`"
      >
        <template #actions>
          <BaseButton variant="outline" size="sm" @click="router.push(`/rotas/editar/${grupo.id}`)">
            Configurar grupo
          </BaseButton>
        </template>

        <div class="policy-box">
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

        <div v-if="grupo.services.length" class="horarios-linha">
          <span v-for="s in grupo.services" :key="s.id" class="badge-horario">
            {{ s.direction === SERVICE_DIRECTIONS.OUTBOUND ? 'Ida' : 'Retorno' }}
            {{ s.targetTimeLabel }} · {{ s.name }} · {{ s.weekdaysLabel }} ·
            {{ s.vehiclePlate }} · {{ s.driverName }}
          </span>
        </div>
        <p v-else class="sem-horario">Nenhum serviço habitual cadastrado neste grupo.</p>

        <div class="secao-vinculos">
          <p class="vinculo-titulo">
            <span class="mdi mdi-account-multiple" aria-hidden="true"></span>
            Passageiros atribuídos ao grupo ({{ grupo.members.length }})
          </p>
          <div v-if="grupo.members.length" class="chips">
            <span v-for="m in grupo.members" :key="m.id" class="chip">
              {{ m.applicantName }} · {{ m.pointName }} · {{ m.service_ids?.length || 0 }} serviço(s)
            </span>
          </div>
          <span v-else class="chip-vazio">Nenhum passageiro atribuído.</span>
        </div>
      </BaseCard>
    </div>

    <button
      type="button"
      class="fab-add"
      aria-label="Cadastrar grupo"
      @click="router.push(ROUTE_PATHS.REGISTER_ROUTE)"
    >
      <span class="mdi mdi-plus" aria-hidden="true"></span>
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

.policy-box {
  padding: $space-2 $space-3;
  border-radius: $radius-sm;
  background: var(--altbg);
  font-size: $text-sm;
}

.policy-text {
  color: var(--text);
}

.policy-missing {
  color: var(--danger);
  font-weight: $font-semibold;
}

.horarios-linha,
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;
}

.badge-horario,
.chip {
  padding: $space-1 $space-3;
  border-radius: $radius-pill;
  background: var(--color-primary-soft);
  color: var(--text);
  font-size: $text-xs;
  font-weight: $font-semibold;
}

.sem-horario,
.chip-vazio {
  font-size: $text-sm;
  color: var(--text-muted);
}

.secao-vinculos {
  display: flex;
  flex-direction: column;
  gap: $space-2;
  padding-top: $space-2;
  border-top: 1px solid var(--border);
}

.vinculo-titulo {
  display: flex;
  align-items: center;
  gap: $space-2;
  font-size: $text-sm;
  font-weight: $font-semibold;
  color: var(--text);
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
