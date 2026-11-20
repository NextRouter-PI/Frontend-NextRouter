<script setup>
import { onMounted, ref, shallowRef } from 'vue'
import { useRouter } from 'vue-router'
import { ROUTE_PATHS } from '@/constants'
import { useTransporteStore } from '@/stores/useTransporteStore'
import { useAccountScope } from '@/composables/useAccountScope'
import PageHeader from '@/components/ui/PageHeader.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import VehicleForm from '@/features/company/components/vehicles/VehicleForm.vue'

const router = useRouter()
const stores = useTransporteStore()
const scope = useAccountScope()

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
const erro = shallowRef('')
const salvando = shallowRef(false)

onMounted(() => stores.fetchPontosOperacionais({ signal: scope.signal }))

async function salvar() {
  if (!scope.current() || salvando.value) return
  erro.value = ''

  if (!veiculo.value.placa.trim() || !veiculo.value.capacidade || Number(veiculo.value.capacidade) < 1) {
    erro.value = 'Informe a placa e uma capacidade positiva.'
    return
  }

  salvando.value = true
  const sucesso = await stores.adicionarVeiculo(
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
    router.push(ROUTE_PATHS.TRANSPORT)
  } else {
    erro.value = typeof stores.error === 'string' ? stores.error : 'Erro ao cadastrar veículo.'
  }
}
</script>

<template>
  <div class="vehicle-page">
    <PageHeader
      title="Cadastrar Veículo"
      subtitle="Veículos pertencem à frota da empresa. A designação de veículo e motorista acontece explicitamente em cada serviço habitual ou viagem datada, não no cadastro do veículo."
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
      :disabled="salvando"
      :saving="salvando"
      :error="erro"
      submit-label="Salvar veículo"
      @submit="salvar"
      @cancel="router.back()"
    />
  </div>
</template>

<style lang="scss" scoped>
.vehicle-page {
  margin: 0 auto;
  max-width: 600px;
  padding: $space-5 18px 120px;
}
</style>
