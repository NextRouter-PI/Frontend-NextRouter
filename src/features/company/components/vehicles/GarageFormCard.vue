<script setup>
import { ref, shallowRef, watch } from 'vue'
import { POINT_TYPES } from '@/constants'
import { useTransporteStore } from '@/stores/useTransporteStore'
import { useAccountScope } from '@/composables/useAccountScope'
import { useInputFormat } from '@/composables/useInputFormat'
import {
  createEmptyPointForm,
  mapPointToForm,
  parseValidPointCoords,
} from '@/features/company/utils/pointPayload'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import StatusBanner from '@/components/ui/StatusBanner.vue'
import AddressCepMapField from '@/components/ui/AddressCepMapField.vue'

const props = defineProps({
  editingPoint: { type: Object, default: null },
})

const emit = defineEmits(['saved', 'cancel-edit'])

const store = useTransporteStore()
const scope = useAccountScope()
const { formatCEP } = useInputFormat()

const salvandoPonto = shallowRef(false)
const erroPonto = shallowRef('')
const avisoPonto = shallowRef('')
const pontoForm = ref(createEmptyPointForm(POINT_TYPES.GARAGE))

watch(
  () => props.editingPoint,
  (ponto) => {
    erroPonto.value = ''
    avisoPonto.value = ''
    pontoForm.value = mapPointToForm(ponto, formatCEP, POINT_TYPES.GARAGE)
  },
  { immediate: true },
)

function cancelarEdicao() {
  erroPonto.value = ''
  emit('cancel-edit')
}

async function salvarPonto() {
  if (!scope.current() || salvandoPonto.value) return
  erroPonto.value = ''
  avisoPonto.value = ''

  if (!parseValidPointCoords(pontoForm.value.latitude, pontoForm.value.longitude)) {
    erroPonto.value = 'Clique no mapa ou informe um CEP válido para definir as coordenadas da garagem.'
    return
  }

  salvandoPonto.value = true
  const editingId = props.editingPoint?.id
  const payload = { ...pontoForm.value, point_type: POINT_TYPES.GARAGE }
  const resultado = editingId
    ? await store.atualizarPontoOperacional(editingId, payload, { signal: scope.signal })
    : await store.adicionarPontoOperacional(payload, { signal: scope.signal })
  if (!scope.current()) return
  salvandoPonto.value = false

  if (resultado) {
    avisoPonto.value = editingId ? 'Garagem atualizada com sucesso.' : 'Garagem cadastrada com sucesso.'
    pontoForm.value = createEmptyPointForm(POINT_TYPES.GARAGE)
    emit('saved')
  } else {
    erroPonto.value = store.error || 'Não foi possível salvar a garagem.'
  }
}
</script>

<template>
  <BaseCard
    :title="editingPoint ? 'Editar garagem' : 'Nova garagem'"
    subtitle="Cadastre as garagens da frota com endereço completo e coordenadas para vinculá-las aos veículos. Pontos de destino continuam na seção de Pontos Operacionais."
  >
    <form class="point-form" @submit.prevent="salvarPonto">
      <BaseInput
        v-model="pontoForm.name"
        label="Identificação da garagem"
        placeholder="Ex.: Garagem Central Joinville"
        required
        :disabled="salvandoPonto"
      />

      <AddressCepMapField
        v-model:cep="pontoForm.cep"
        v-model:street="pontoForm.street"
        v-model:number="pontoForm.number"
        v-model:complement="pontoForm.complement"
        v-model:neighborhood="pontoForm.neighborhood"
        v-model:city="pontoForm.city"
        v-model:state="pontoForm.state"
        v-model:latitude="pontoForm.latitude"
        v-model:longitude="pontoForm.longitude"
        :disabled="salvandoPonto"
        :format-cep="formatCEP"
        complement-placeholder="Galpão, referência..."
      />

      <StatusBanner variant="danger" :message="erroPonto" />
      <StatusBanner variant="success" :message="avisoPonto" />

      <div class="point-actions">
        <BaseButton type="submit" size="sm" :loading="salvandoPonto">
          {{ salvandoPonto ? 'Salvando...' : editingPoint ? 'Salvar garagem' : 'Cadastrar garagem' }}
        </BaseButton>
        <BaseButton
          v-if="editingPoint"
          variant="outline"
          size="sm"
          :disabled="salvandoPonto"
          @click="cancelarEdicao"
        >
          Cancelar edição
        </BaseButton>
      </div>
    </form>
  </BaseCard>
</template>

<style lang="scss" scoped>
.point-form {
  display: flex;
  flex-direction: column;
  gap: $space-2;
}

.point-actions {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;
}
</style>
