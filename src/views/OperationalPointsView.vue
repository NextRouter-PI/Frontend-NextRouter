<script setup>
import { onMounted, shallowRef } from 'vue'
import { ROUTE_PATHS } from '@/constants'
import { useTransporteStore } from '@/stores/useTransporteStore'
import { useAccountScope } from '@/composables/useAccountScope'
import { useInputFormat } from '@/composables/useInputFormat'
import PageHeader from '@/components/ui/PageHeader.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import StatusBanner from '@/components/ui/StatusBanner.vue'
import SkeletonCard from '@/components/ui/SkeletonCard.vue'
import OperationalPointForm from '@/features/company/components/points/OperationalPointForm.vue'

const store = useTransporteStore()
const scope = useAccountScope()
const { formatCEP } = useInputFormat()

const editingPoint = shallowRef(null)
const error = shallowRef('')
const notice = shallowRef('')

function startEdit(ponto) {
  editingPoint.value = ponto
  error.value = ''
  notice.value = ''
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function handleSaved(msg) {
  editingPoint.value = null
  error.value = ''
  notice.value = msg
}

onMounted(() => store.fetchPontosOperacionais({ signal: scope.signal }))
</script>

<template>
  <div class="points-page">
    <PageHeader
      title="Pontos Operacionais de Destino"
      subtitle="Cadastre os pontos de destino para vincular aos grupos de atendimento. Informe o CEP e ajuste a localização no mapa. As garagens ficam na seção de Veículos."
      accent
    />

    <StatusBanner variant="success" :message="notice" />
    <StatusBanner variant="danger" :message="error || store.error" />

    <OperationalPointForm
      :editing-point="editingPoint"
      @saved="handleSaved"
      @error="error = $event"
      @cancel-edit="editingPoint = null"
    />

    <BaseCard :title="`Pontos de Destino Cadastrados (${store.pontosDestino.length})`">
      <Transition name="fade-slide" mode="out-in">
        <SkeletonCard v-if="store.pointsLoading" key="loading" :count="2" />
        <p v-else-if="!store.pontosDestino.length" key="empty" class="hint">
          Nenhum ponto de destino cadastrado ainda. Preencha o formulário e selecione a localização no mapa acima.
        </p>
        <TransitionGroup v-else key="list" name="list-stagger" tag="div" class="points-list">
          <article v-for="ponto in store.pontosDestino" :key="ponto.id" class="point-card">
            <div>
              <h3>{{ ponto.name }}</h3>
              <p class="point-address">
                {{ ponto.street }}, {{ ponto.number }} — {{ ponto.neighborhood }}, {{ ponto.city }}/{{ ponto.state }}
                (CEP {{ formatCEP(ponto.cep) }})
              </p>
              <p class="point-coords">Lat {{ ponto.latitude }} · Lng {{ ponto.longitude }}</p>
            </div>
            <div class="point-card-actions">
              <RouterLink
                :to="{ path: ROUTE_PATHS.REGISTER_ROUTE, query: { destination: ponto.id } }"
                class="link-outline"
              >
                <span class="mdi mdi-routes" aria-hidden="true"></span>
                Vincular grupo
              </RouterLink>
              <BaseButton variant="outline" size="sm" icon="mdi-pencil-outline" @click="startEdit(ponto)">
                Editar
              </BaseButton>
            </div>
          </article>
        </TransitionGroup>
      </Transition>
    </BaseCard>
  </div>
</template>

<style lang="scss" scoped>
.points-page {
  @include section-container(120px);
}

.hint {
  font-size: $text-sm;
  color: var(--text-muted);
}

.points-list {
  display: flex;
  flex-direction: column;
  gap: $space-3;
}

.point-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: $space-3;
  padding: $space-4;
  border-radius: $radius-md;
  background: var(--altbg);
  border: 1px solid var(--border);

  h3 {
    font-size: $text-base;
    font-weight: $font-bold;
  }
}

.point-address,
.point-coords {
  font-size: $text-xs;
  color: var(--text-muted);
  margin-top: 2px;
}

.point-card-actions {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;
  align-items: center;
}

.link-outline {
  display: inline-flex;
  align-items: center;
  gap: $space-1;
  padding: $space-2 14px;
  border-radius: $radius-md;
  outline: 1.5px solid var(--border);
  outline-offset: -1.5px;
  font-size: $text-sm;
  font-weight: $font-semibold;
  color: var(--text);
  transition: all $duration-normal $ease-fluid;

  &:hover {
    outline-color: var(--primary);
    color: var(--primary);
    background: var(--color-primary-soft);
  }
}
</style>
