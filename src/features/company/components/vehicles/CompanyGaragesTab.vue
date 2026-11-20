<script setup>
import { ref, shallowRef } from 'vue'
import { POINT_TYPES } from '@/constants'
import { useTransporteStore } from '@/stores/useTransporteStore'
import { useAccountScope } from '@/composables/useAccountScope'
import { useInputFormat } from '@/composables/useInputFormat'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import StatusBanner from '@/components/ui/StatusBanner.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import AddressCepMapField from '@/components/ui/AddressCepMapField.vue'

const store = useTransporteStore()
const scope = useAccountScope()
const { formatCEP } = useInputFormat()

function emptyPoint() {
  return {
    point_type: POINT_TYPES.GARAGE,
    name: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    cep: '',
    latitude: null,
    longitude: null,
  }
}

const editandoPontoId = shallowRef(null)
const salvandoPonto = shallowRef(false)
const erroPonto = shallowRef('')
const avisoPonto = shallowRef('')
const pontoForm = ref(emptyPoint())

function iniciarEdicao(ponto) {
  editandoPontoId.value = ponto.id
  erroPonto.value = ''
  avisoPonto.value = ''
  pontoForm.value = {
    point_type: POINT_TYPES.GARAGE,
    name: ponto.name || '',
    street: ponto.street || '',
    number: ponto.number || '',
    complement: ponto.complement || '',
    neighborhood: ponto.neighborhood || '',
    city: ponto.city || '',
    state: ponto.state || '',
    cep: formatCEP(ponto.cep || ''),
    latitude: ponto.latitude ?? null,
    longitude: ponto.longitude ?? null,
  }
}

function cancelarEdicao() {
  editandoPontoId.value = null
  erroPonto.value = ''
  pontoForm.value = emptyPoint()
}

function veiculosDaGaragem(garageId) {
  return (store.veiculos || []).filter((v) => v.garagePointId === garageId)
}

async function salvarPonto() {
  if (!scope.current() || salvandoPonto.value) return
  erroPonto.value = ''
  avisoPonto.value = ''

  const lat = Number(pontoForm.value.latitude)
  const lng = Number(pontoForm.value.longitude)
  if (
    pontoForm.value.latitude == null ||
    pontoForm.value.latitude === '' ||
    pontoForm.value.longitude == null ||
    pontoForm.value.longitude === '' ||
    !Number.isFinite(lat) ||
    lat < -90 ||
    lat > 90 ||
    !Number.isFinite(lng) ||
    lng < -180 ||
    lng > 180
  ) {
    erroPonto.value = 'Clique no mapa ou informe um CEP válido para definir as coordenadas da garagem.'
    return
  }

  salvandoPonto.value = true
  const payload = { ...pontoForm.value, point_type: POINT_TYPES.GARAGE }
  const resultado = editandoPontoId.value
    ? await store.atualizarPontoOperacional(editandoPontoId.value, payload, { signal: scope.signal })
    : await store.adicionarPontoOperacional(payload, { signal: scope.signal })
  if (!scope.current()) return
  salvandoPonto.value = false

  if (resultado) {
    avisoPonto.value = editandoPontoId.value
      ? 'Garagem atualizada com sucesso.'
      : 'Garagem cadastrada com sucesso.'
    editandoPontoId.value = null
    pontoForm.value = emptyPoint()
  } else {
    erroPonto.value = store.error || 'Não foi possível salvar a garagem.'
  }
}
</script>

<template>
  <div class="garages-tab">
    <BaseCard
      :title="editandoPontoId ? 'Editar garagem' : 'Nova garagem'"
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
            {{ salvandoPonto ? 'Salvando...' : editandoPontoId ? 'Salvar garagem' : 'Cadastrar garagem' }}
          </BaseButton>
          <BaseButton
            v-if="editandoPontoId"
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

    <EmptyState v-if="store.pointsLoading" loading description="Carregando garagens..." />
    <EmptyState
      v-else-if="!store.garagens.length"
      icon="mdi-garage-outline"
      description="Nenhuma garagem cadastrada ainda. Cadastre uma garagem acima para vinculá-la aos veículos da frota."
    />

    <div v-else class="garages-list">
      <BaseCard
        v-for="ponto in store.garagens"
        :key="ponto.id"
        :title="`${ponto.name} · #${ponto.id}`"
        :subtitle="`${ponto.street}, ${ponto.number}${ponto.complement ? ` (${ponto.complement})` : ''} — ${ponto.neighborhood}, ${ponto.city}/${ponto.state} · CEP ${ponto.cep}`"
      >
        <template #actions>
          <BaseButton variant="outline" size="sm" @click="iniciarEdicao(ponto)">Editar</BaseButton>
        </template>

        <div class="card-details">
          <div class="detail-item">
            <span class="mdi mdi-crosshairs-gps" aria-hidden="true"></span>
            <span>{{ ponto.latitude }}, {{ ponto.longitude }}</span>
          </div>
          <div class="detail-item">
            <span class="mdi mdi-bus-multiple" aria-hidden="true"></span>
            <span v-if="veiculosDaGaragem(ponto.id).length">
              Veículos vinculados: {{ veiculosDaGaragem(ponto.id).map((v) => v.placa).join(', ') }}
            </span>
            <span v-else>Nenhum veículo vinculado</span>
          </div>
        </div>
      </BaseCard>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.garages-tab,
.garages-list {
  display: flex;
  flex-direction: column;
  gap: $space-4;
}

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

.card-details {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2 $space-4;
}

.detail-item {
  display: inline-flex;
  align-items: center;
  gap: $space-1;
  font-size: $text-sm;
  color: var(--text-muted);

  .mdi {
    color: var(--primary);
  }
}
</style>
