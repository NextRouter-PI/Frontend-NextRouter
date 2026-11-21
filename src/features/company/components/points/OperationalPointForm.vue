<script setup>
import { ref, shallowRef, watch } from 'vue'
import { useTransporteStore } from '@/stores/useTransporteStore'
import { useAccountScope } from '@/composables/useAccountScope'
import { useInputFormat } from '@/composables/useInputFormat'
import {
  buildDestinationPointPayload,
  createEmptyPointForm,
  mapPointToForm,
  parseValidPointCoords,
} from '@/features/company/utils/pointPayload'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import AddressCepMapField from '@/components/ui/AddressCepMapField.vue'

const props = defineProps({
  editingPoint: { type: Object, default: null },
})

const emit = defineEmits(['saved', 'error', 'cancel-edit'])

const store = useTransporteStore()
const scope = useAccountScope()
const { formatCEP } = useInputFormat()

const form = ref(createEmptyPointForm())
const saving = shallowRef(false)

watch(
  () => props.editingPoint,
  (ponto) => {
    form.value = mapPointToForm(ponto, formatCEP)
  },
  { immediate: true },
)

async function handleSubmit() {
  if (!scope.current() || saving.value) return
  emit('error', '')

  const coords = parseValidPointCoords(form.value.latitude, form.value.longitude)
  if (!coords) {
    emit('error', 'Clique no mapa ou informe um CEP válido para definir as coordenadas do ponto de destino.')
    return
  }

  saving.value = true
  const payload = buildDestinationPointPayload(form.value, coords)

  const editingId = props.editingPoint?.id
  const saved = editingId
    ? await store.atualizarPontoOperacional(editingId, payload, { signal: scope.signal })
    : await store.adicionarPontoOperacional(payload, { signal: scope.signal })

  if (!scope.current()) return
  saving.value = false

  if (!saved) {
    emit('error', typeof store.error === 'string' ? store.error : 'Não foi possível salvar o ponto de destino.')
    return
  }

  form.value = createEmptyPointForm()
  emit('saved', editingId ? 'Ponto de destino atualizado com sucesso.' : 'Ponto de destino cadastrado com sucesso.')
}
</script>

<template>
  <BaseCard :title="editingPoint ? 'Editar Ponto de Destino' : 'Novo Ponto de Destino'">
    <form class="point-form" @submit.prevent="handleSubmit">
      <BaseInput
        v-model="form.name"
        label="Nome do destino"
        required
        placeholder="Ex.: IFC Campus Araquari"
        :disabled="saving"
      />

      <AddressCepMapField
        v-model:cep="form.cep"
        v-model:street="form.street"
        v-model:number="form.number"
        v-model:complement="form.complement"
        v-model:neighborhood="form.neighborhood"
        v-model:city="form.city"
        v-model:state="form.state"
        v-model:latitude="form.latitude"
        v-model:longitude="form.longitude"
        :format-cep="formatCEP"
        :disabled="saving"
        complement-placeholder="Portão principal, bloco..."
        map-label="Localização do Ponto de Destino"
      />

      <div class="form-actions">
        <BaseButton type="submit" size="sm" :loading="saving">
          {{ saving ? 'Salvando...' : editingPoint ? 'Salvar Alterações' : 'Cadastrar Ponto' }}
        </BaseButton>
        <BaseButton v-if="editingPoint" variant="outline" size="sm" :disabled="saving" @click="emit('cancel-edit')">
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

.form-actions {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;
}
</style>
