<script setup>
import { onMounted, ref, shallowRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ROUTE_PATHS } from '@/constants'
import { useTransporteStore } from '@/stores/useTransporteStore'
import { useAccountScope } from '@/composables/useAccountScope'
import PageHeader from '@/components/ui/PageHeader.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import VehicleForm from '@/features/company/components/vehicles/VehicleForm.vue'

const router = useRouter()
const route = useRoute()
const stores = useTransporteStore()
const scope = useAccountScope()

const id = Number(route.params.id)
const erro = shallowRef('')
const carregando = shallowRef(true)
const salvando = shallowRef(false)

const veiculo = ref({
  placa: '',
  modelo: '',
  ano: '',
  capacidade: '',
  garagePointId: '',
  cor: '',
  status: 'Ativo',
})
const caracteristicas = ref([])

onMounted(async () => {
  await stores.fetchVeiculos({ signal: scope.signal })
  if (!scope.current()) return
  const encontrado = stores.veiculos.find((v) => v.id === id)

  if (encontrado) {
    veiculo.value = {
      placa: encontrado.placa,
      modelo: encontrado.modelo,
      ano: encontrado.ano,
      capacidade: encontrado.capacidade,
      garagePointId: encontrado.garagePointId ?? '',
      cor: encontrado.cor || '',
      status: encontrado.status,
    }
    caracteristicas.value = [...(encontrado.caracteristicas || [])]
  } else {
    erro.value = 'Veículo não encontrado.'
  }

  carregando.value = false
})

async function salvar() {
  if (!scope.current() || salvando.value || carregando.value) return
  erro.value = ''

  if (!veiculo.value.placa.trim() || !veiculo.value.capacidade || Number(veiculo.value.capacidade) < 1) {
    erro.value = 'Informe a placa e uma capacidade positiva.'
    return
  }

  salvando.value = true
  const sucesso = await stores.atualizarVeiculo(
    id,
    {
      ...veiculo.value,
      garagePointId: veiculo.value.garagePointId || null,
      caracteristicas: caracteristicas.value,
    },
    { signal: scope.signal },
  )
  if (!scope.current()) return
  salvando.value = false

  if (sucesso) {
    router.push(ROUTE_PATHS.TRANSPORT_FLEET)
  } else {
    erro.value = typeof stores.error === 'string' ? stores.error : 'Erro ao salvar alterações.'
  }
}
</script>

<template>
  <div class="vehicle-page">
    <PageHeader
      title="Editar Veículo"
      subtitle="Alterar dados ou ponto de garagem do veículo regenera dias futuros e invalida prontidão de viagens agendadas. Veículos em operação não podem ser editados."
      accent
    >
      <template #actions>
        <BaseButton variant="outline" size="sm" icon="mdi-arrow-left" @click="router.back()">
          Voltar
        </BaseButton>
      </template>
    </PageHeader>

    <VehicleForm
      v-model:vehicle="veiculo"
      v-model:features="caracteristicas"
      :garages="stores.garagens"
      :garages-loading="stores.pointsLoading"
      :disabled="salvando || carregando"
      :saving="salvando"
      :error="erro"
      submit-label="Salvar alterações"
      @submit="salvar"
      @cancel="router.back()"
    />
  </div>
</template>

<style lang="scss" scoped>
.vehicle-page {
  @include section-container(120px);
}
</style>
