<script setup>
import { useTemplateRef } from 'vue'
import { useAddressCepMap } from '@/composables/useAddressCepMap'
import BaseInput from '@/components/ui/BaseInput.vue'

const cep = defineModel('cep', { type: String, default: '' })
const street = defineModel('street', { type: String, default: '' })
const number = defineModel('number', { type: String, default: '' })
const complement = defineModel('complement', { type: String, default: '' })
const neighborhood = defineModel('neighborhood', { type: String, default: '' })
const city = defineModel('city', { type: String, default: '' })
const state = defineModel('state', { type: String, default: '' })
const latitude = defineModel('latitude', { type: [Number, String, null], default: null })
const longitude = defineModel('longitude', { type: [Number, String, null], default: null })

const props = defineProps({
  disabled: { type: Boolean, default: false },
  cepError: { type: String, default: '' },
  formatCep: { type: Function, required: true },
  complementPlaceholder: { type: String, default: 'Bloco, condomínio, apto...' },
  mapLabel: { type: String, default: 'Localização do seu Endereço' },
  // Sem mapa, as coordenadas ainda vêm do CEP (busca automática).
  showMap: { type: Boolean, default: true },
})

const emit = defineEmits(['cep-input', 'cep-blur'])

const mapEl = useTemplateRef('mapContainer')
const { loadingCep, cepFeedback, isFullscreen, hasCoordinates, toggleFullscreen } = useAddressCepMap({
  mapEl,
  cep,
  street,
  neighborhood,
  city,
  state,
  latitude,
  longitude,
  isDisabled: () => props.disabled,
})
</script>

<template>
  <div class="address-cep-map">
    <BaseInput
      v-model="cep"
      label="CEP"
      required
      only-numbers
      placeholder="00000-000"
      maxlength="9"
      :disabled="disabled"
      :format="formatCep"
      :error="cepError"
      @input="emit('cep-input')"
      @blur="emit('cep-blur')"
    />

    <p v-if="loadingCep" class="cep-status" role="status">Consultando Rua, Bairro e Cidade pelo CEP...</p>
    <p v-else-if="cepFeedback" class="cep-feedback" role="status">{{ cepFeedback }}</p>

    <BaseInput v-model="street" label="Rua" placeholder="Preenchida automaticamente pelo CEP" disabled />
    <BaseInput v-model="neighborhood" label="Bairro" placeholder="Preenchido automaticamente pelo CEP" disabled />

    <div class="city-state-row">
      <BaseInput v-model="city" label="Cidade" placeholder="Cidade do CEP" disabled class="field-cell" />
      <BaseInput v-model="state" label="UF" placeholder="UF" disabled class="field-cell" />
    </div>

    <div class="address-row">
      <BaseInput v-model="number" label="Número" placeholder="Nº" :disabled="disabled" class="field-cell" />
      <BaseInput
        v-model="complement"
        label="Complemento"
        :placeholder="complementPlaceholder"
        :disabled="disabled"
        class="field-cell"
      />
    </div>

    <div
      v-if="showMap"
      :class="['map-section', { fullscreen: isFullscreen }]"
      :role="isFullscreen ? 'dialog' : undefined"
      :aria-modal="isFullscreen ? 'true' : undefined"
      :aria-label="isFullscreen ? 'Localização do seu Endereço em tela cheia' : undefined"
    >
      <div class="map-header">
        <div class="map-title-group">
          <span class="map-label">{{ mapLabel }}</span>
          <span v-if="hasCoordinates" class="coords-badge">
            {{ Number(latitude).toFixed(5) }}, {{ Number(longitude).toFixed(5) }}
          </span>
        </div>

        <button
          type="button"
          class="btn-fullscreen"
          :aria-label="isFullscreen ? 'Sair da tela cheia' : 'Abrir mapa em tela cheia'"
          @click="toggleFullscreen"
        >
          <BaseIcon :name="isFullscreen ? 'mdi-fullscreen-exit' : 'mdi-fullscreen'" />
          <span>{{ isFullscreen ? 'Reduzir' : 'Tela cheia' }}</span>
        </button>
      </div>

      <p class="map-hint">
        Clique no mapa ou arraste o pino para salvar as coordenadas exatas do endereço.
      </p>

      <div ref="mapContainer" class="leaflet-canvas"></div>

      <button v-if="isFullscreen" type="button" class="btn-confirm-fullscreen" @click="toggleFullscreen">
        Confirmar localização no mapa
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.address-cep-map {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: $space-4;
}

.cep-status,
.cep-feedback {
  font-size: $text-xs;
  color: var(--text-muted);
  margin: -$space-2 0 $space-2;
}

.city-state-row,
.address-row {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: $space-3;
}

.address-row {
  grid-template-columns: 1fr 2fr;
}

.map-section {
  display: flex;
  flex-direction: column;
  gap: $space-2;
  padding: $space-3;
  border-radius: $radius-md;
  background: var(--altbg);
  border: 1px solid var(--border);

  &.fullscreen {
    position: fixed;
    inset: 0;
    z-index: $z-modal;
    border-radius: 0;
    padding: $space-5;
    background: var(--bg);

    .leaflet-canvas {
      flex: 1;
      height: auto;
    }
  }
}

.map-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: $space-2;
}

.map-title-group {
  display: flex;
  align-items: center;
  gap: $space-2;
  flex-wrap: wrap;
}

.map-label {
  font-size: $text-sm;
  font-weight: $font-semibold;
  color: var(--primary);
}

.coords-badge {
  font-size: $text-xs;
  padding: 2px $space-2;
  border-radius: $radius-pill;
  background: var(--color-surface);
  color: var(--text-muted);
  border: 1px solid var(--border);
}

.btn-fullscreen {
  display: inline-flex;
  align-items: center;
  gap: $space-1;
  padding: $space-1 $space-3;
  border-radius: $radius-sm;
  background: var(--color-surface);
  color: var(--text);
  border: 1px solid var(--border);
  font-size: $text-xs;
  font-weight: $font-semibold;

  &:hover {
    border-color: var(--primary);
    color: var(--primary);
  }
}

.map-hint {
  font-size: $text-xs;
  color: var(--text-muted);
}

.leaflet-canvas {
  width: 100%;
  height: 220px;
  border-radius: $radius-sm;
  border: 1px solid var(--border);
  z-index: $z-base;
}

.btn-confirm-fullscreen {
  padding: $space-3 $space-4;
  border-radius: $radius-md;
  background: var(--primary);
  color: var(--color-on-primary);
  font-weight: $font-semibold;
}
</style>
