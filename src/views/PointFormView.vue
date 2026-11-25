<script setup>
import { computed, onMounted, shallowRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ROUTE_PATHS } from '@/constants'
import { useTransporteStore } from '@/stores/useTransporteStore'
import { useAccountScope } from '@/composables/useAccountScope'
import { useToast } from '@/composables/useToast'
import PageHeader from '@/components/ui/PageHeader.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import StatusBanner from '@/components/ui/StatusBanner.vue'
import SkeletonCard from '@/components/ui/SkeletonCard.vue'
import OperationalPointForm from '@/features/company/components/points/OperationalPointForm.vue'
import GarageFormCard from '@/features/company/components/vehicles/GarageFormCard.vue'

// Página própria para cadastrar ou editar um ponto: destino (escolas/campi) ou garagem.
const route = useRoute()
const router = useRouter()
const store = useTransporteStore()
const scope = useAccountScope()
const { showToast } = useToast()

const isGarage = computed(() => route.meta.pointKind === 'garage')
const editingId = computed(() => (route.params.id ? Number(route.params.id) : null))
const backTo = computed(() => (isGarage.value ? ROUTE_PATHS.TRANSPORT_GARAGES : ROUTE_PATHS.OPERATIONAL_POINTS))
const loading = shallowRef(Boolean(editingId.value))
const error = shallowRef('')

const editingPoint = computed(() =>
  editingId.value ? store.pontosOperacionais.find((p) => p.id === editingId.value) || null : null,
)

const title = computed(() => {
  if (isGarage.value) return editingId.value ? 'Editar garagem' : 'Nova garagem'
  return editingId.value ? 'Editar ponto de destino' : 'Novo ponto de destino'
})

function done(message) {
  showToast(message || (isGarage.value ? 'Garagem salva com sucesso.' : 'Ponto salvo com sucesso.'), 'success')
  router.push(backTo.value)
}

onMounted(async () => {
  await store.fetchPontosOperacionais({ signal: scope.signal })
  loading.value = false
})
</script>

<template>
  <div class="point-form-page">
    <PageHeader
      :title="title"
      :highlight="isGarage ? 'garagem' : 'destino'"
      eyebrow="Painel da empresa"
      :icon="isGarage ? 'mdi-garage' : 'mdi-map-marker-radius'"
      :subtitle="
        isGarage
          ? 'De onde os veículos saem. Informe o CEP e ajuste o ponto no mapa.'
          : 'Escola, campus ou parada final de um grupo. Informe o CEP e ajuste o ponto no mapa.'
      "
    >
      <template #actions>
        <BaseButton variant="outline" size="sm" icon="mdi-arrow-left" @click="router.push(backTo)">
          Voltar à lista
        </BaseButton>
      </template>
    </PageHeader>

    <StatusBanner variant="danger" :message="error" />

    <SkeletonCard v-if="loading" :count="1" :lines="5" />
    <StatusBanner
      v-else-if="editingId && !editingPoint"
      variant="warning"
      message="Não encontramos esse ponto. Ele pode ter sido removido."
    />
    <template v-else>
      <GarageFormCard
        v-if="isGarage"
        :key="`garage-${editingId || 'new'}`"
        :editing-point="editingPoint"
        @saved="done()"
        @cancel-edit="router.push(backTo)"
      />
      <OperationalPointForm
        v-else
        :key="`point-${editingId || 'new'}`"
        :editing-point="editingPoint"
        @saved="done"
        @error="error = $event"
        @cancel-edit="router.push(backTo)"
      />
    </template>
  </div>
</template>

<style lang="scss" scoped>
.point-form-page {
  @include section-container(120px);
}
</style>
