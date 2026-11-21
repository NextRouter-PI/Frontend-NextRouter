<script setup>
import { SERVICE_DIRECTIONS } from '@/constants'
import { useRecurringServiceForm } from '@/features/company/composables/useRecurringServiceForm'
import BaseButton from '@/components/ui/BaseButton.vue'
import StatusBanner from '@/components/ui/StatusBanner.vue'
import ServiceStopsPicker from '@/features/company/components/route-editor/ServiceStopsPicker.vue'
import ServiceWeekdaySelector from '@/features/company/components/route-editor/ServiceWeekdaySelector.vue'

const props = defineProps({
  groupId: { type: Number, required: true },
  isShared: { type: Boolean, default: false },
  editingService: { type: Object, default: null },
})

const emit = defineEmits(['saved', 'cancel-edit'])

const {
  store,
  salvando,
  erro,
  aviso,
  form,
  paradasSelecionadas,
  motoristasAtivos,
  veiculosAtivos,
  pontosOrigemDestino,
  labelPontoOrigemDestino,
  salvar,
} = useRecurringServiceForm(props, emit)
</script>

<template>
  <form class="service-form" @submit.prevent="salvar">
    <h3 class="sub-heading">
      {{
        editingService
          ? `Editar serviço #${editingService.id}`
          : isShared
            ? 'Novo serviço compartilhado'
            : 'Novo serviço habitual'
      }}
    </h3>

    <div class="grid-2">
      <div class="field">
        <label>Nome do serviço<span>*</span></label>
        <input
          v-model="form.name"
          :placeholder="isShared ? 'Ex.: Volta Intermediária 12:00' : 'Ex.: Ida Manhã 07:30'"
          required
          :disabled="salvando"
        />
      </div>
      <div class="field">
        <label>Sentido<span>*</span></label>
        <select v-model="form.direction" :disabled="salvando || Boolean(editingService)">
          <option :value="SERVICE_DIRECTIONS.OUTBOUND">Ida (outbound)</option>
          <option :value="SERVICE_DIRECTIONS.RETURN">Retorno (return)</option>
        </select>
      </div>
      <div class="field">
        <label>Horário-alvo<span>*</span></label>
        <input v-model="form.target_time" type="time" required :disabled="salvando" />
        <p class="field-explain">Na ida é o horário de chegada ao destino; no retorno é o horário de saída.</p>
      </div>
      <div class="field">
        <label>Motorista habitual (vínculo ativo)</label>
        <select v-model="form.driver_membership_id" :disabled="salvando">
          <option value="">Sem motorista designado</option>
          <option v-for="m in motoristasAtivos" :key="m.id" :value="m.id">
            {{ m.applicant_name }} (vínculo #{{ m.id }})
          </option>
        </select>
      </div>
      <div class="field">
        <label>Veículo habitual (ativo)</label>
        <select v-model="form.vehicle_id" :disabled="salvando">
          <option value="">Sem veículo designado</option>
          <option v-for="v in veiculosAtivos" :key="v.id" :value="v.id">
            {{ v.plate }} — {{ v.model || 'Veículo' }} ({{ v.capacity }} lug.)
          </option>
        </select>
      </div>
      <div class="field">
        <label>Ponto de origem<span>*</span></label>
        <select v-model="form.origin_id" required :disabled="salvando">
          <option value="" disabled>Selecione uma garagem ou destino...</option>
          <option v-for="p in pontosOrigemDestino" :key="p.id" :value="p.id">
            {{ labelPontoOrigemDestino(p) }}
          </option>
        </select>
      </div>
      <div class="field">
        <label>Ponto de destino<span>*</span></label>
        <select v-model="form.destination_id" required :disabled="salvando">
          <option value="" disabled>Selecione uma garagem ou destino...</option>
          <option v-for="p in pontosOrigemDestino" :key="p.id" :value="p.id">
            {{ labelPontoOrigemDestino(p) }}
          </option>
        </select>
      </div>
    </div>

    <ServiceWeekdaySelector v-model="form.weekdays" :disabled="salvando" />

    <ServiceStopsPicker
      v-if="!isShared"
      v-model="paradasSelecionadas"
      :points="store.pontosOperacionais"
      :disabled="salvando"
    />

    <StatusBanner variant="danger" :message="erro" />
    <StatusBanner variant="success" :message="aviso" />

    <div class="inline-row">
      <BaseButton type="submit" size="sm" :loading="salvando">
        {{
          salvando
            ? 'Salvando...'
            : editingService
              ? 'Atualizar serviço'
              : isShared
                ? 'Criar serviço compartilhado'
                : 'Criar serviço habitual'
        }}
      </BaseButton>
      <BaseButton
        v-if="editingService"
        variant="outline"
        size="sm"
        :disabled="salvando"
        @click="emit('cancel-edit')"
      >
        Cancelar edição
      </BaseButton>
    </div>
  </form>
</template>

<style lang="scss" scoped>
.service-form {
  display: flex;
  flex-direction: column;
  gap: $space-3;
  padding-top: $space-3;
  border-top: 1px solid var(--border);
}

.sub-heading {
  font-size: $text-base;
  font-weight: $font-bold;
}

.field-explain {
  font-size: $text-xs;
  color: var(--text-muted);
}

.grid-2 {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: $space-3;
}

.field {
  display: flex;
  flex-direction: column;
  gap: $space-1;

  label {
    font-size: $text-sm;
    font-weight: $font-semibold;
    color: var(--primary);

    span {
      margin-left: 2px;
    }
  }

  input,
  select {
    padding: 10px $space-3;
    border-radius: $radius-sm;
    background: var(--color-surface);
    outline: 1.5px solid var(--border);
    outline-offset: -1.5px;
    color: var(--text);
    font-size: $text-sm;

    &:focus {
      outline: 2px solid var(--primary);
      outline-offset: -2px;
    }
  }
}

.inline-row {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;
  align-items: center;
}
</style>
