<script setup>
import { shallowRef } from 'vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import StatusBanner from '@/components/ui/StatusBanner.vue'

const vehicle = defineModel('vehicle', { type: Object, required: true })
const features = defineModel('features', { type: Array, required: true })

defineProps({
  garages: { type: Array, default: () => [] },
  garagesLoading: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  saving: { type: Boolean, default: false },
  error: { type: String, default: '' },
  submitLabel: { type: String, default: 'Salvar' },
})

const emit = defineEmits(['submit', 'cancel'])

const featureInput = shallowRef('')

function adicionarFeature() {
  const value = featureInput.value.trim()
  if (value && !features.value.includes(value)) {
    features.value = [...features.value, value]
  }
  featureInput.value = ''
}

function removerFeature(feature) {
  features.value = features.value.filter((f) => f !== feature)
}
</script>

<template>
  <BaseCard>
    <form class="vehicle-form" @submit.prevent="emit('submit')">
      <div class="field">
        <label>Placa<span>*</span></label>
        <input v-model="vehicle.placa" placeholder="ABC1D23" maxlength="10" required :disabled="disabled" />
      </div>

      <div class="field">
        <label>Modelo</label>
        <input v-model="vehicle.modelo" placeholder="Mercedes Sprinter" :disabled="disabled" />
      </div>

      <div class="grid-2">
        <div class="field">
          <label>Ano</label>
          <input v-model="vehicle.ano" type="number" min="1950" max="2100" placeholder="2020" :disabled="disabled" />
        </div>
        <div class="field">
          <label>Capacidade (lugares)<span>*</span></label>
          <input v-model="vehicle.capacidade" type="number" min="1" placeholder="15" required :disabled="disabled" />
        </div>
      </div>

      <div class="grid-2">
        <div class="field">
          <label>Cor</label>
          <input v-model="vehicle.cor" placeholder="Branco" :disabled="disabled" />
        </div>
        <div class="field">
          <label>Status</label>
          <select v-model="vehicle.status" :disabled="disabled">
            <option value="Ativo">Ativo</option>
            <option value="Manutenção">Manutenção</option>
          </select>
        </div>
      </div>

      <div class="field">
        <label>Garagem (opcional)</label>
        <select v-model="vehicle.garagePointId" :disabled="disabled">
          <option value="">Sem garagem vinculada</option>
          <option v-for="ponto in garages" :key="ponto.id" :value="ponto.id">
            {{ ponto.name }} — {{ ponto.city }}/{{ ponto.state }}
          </option>
        </select>
        <p v-if="!garagesLoading && !garages.length" class="field-hint">
          Nenhuma garagem cadastrada. Cadastre uma na aba Garagens da seção de Veículos.
        </p>
      </div>

      <div class="field">
        <label>Características</label>
        <div class="feature-row">
          <input
            v-model="featureInput"
            placeholder="Ex.: Ar-condicionado"
            :disabled="disabled"
            @keydown.enter.prevent="adicionarFeature"
          />
          <BaseButton variant="outline" size="sm" :disabled="disabled" @click="adicionarFeature">
            Adicionar
          </BaseButton>
        </div>
        <div v-if="features.length" class="feature-chips">
          <span v-for="feature in features" :key="feature" class="feature-chip">
            {{ feature }}
            <button type="button" class="chip-remove" :disabled="disabled" @click="removerFeature(feature)">
              <span class="mdi mdi-close" aria-hidden="true"></span>
            </button>
          </span>
        </div>
      </div>

      <StatusBanner variant="danger" :message="error" />

      <div class="form-actions">
        <BaseButton type="submit" block size="lg" :loading="saving" :disabled="disabled">
          {{ saving ? 'Salvando...' : submitLabel }}
        </BaseButton>
        <BaseButton variant="outline" block :disabled="saving" @click="emit('cancel')">
          Cancelar
        </BaseButton>
      </div>
    </form>
  </BaseCard>
</template>

<style lang="scss" scoped>
.vehicle-form {
  display: flex;
  flex-direction: column;
  gap: $space-4;
}

.grid-2 {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
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

.field-hint {
  font-size: $text-xs;
  color: var(--text-muted);
}

.feature-row {
  display: flex;
  gap: $space-2;

  input {
    flex: 1;
  }
}

.feature-chips {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;
  margin-top: $space-1;
}

.feature-chip {
  display: inline-flex;
  align-items: center;
  gap: $space-1;
  padding: $space-1 $space-3;
  border-radius: $radius-pill;
  background: var(--color-primary-soft);
  color: var(--primary);
  font-size: $text-xs;
  font-weight: $font-semibold;
}

.chip-remove {
  color: inherit;
  display: inline-flex;
  align-items: center;
}

.form-actions {
  display: flex;
  flex-direction: column;
  gap: $space-2;
  margin-top: $space-2;
}
</style>
