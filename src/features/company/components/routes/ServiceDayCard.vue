<script setup>
import { shallowRef } from 'vue'
import { WINDOW_SHORT_LABELS } from '@/constants'
import { formatDateTimeBr } from '@/utils/formatters'
import BaseButton from '@/components/ui/BaseButton.vue'
import StatusBanner from '@/components/ui/StatusBanner.vue'

const props = defineProps({
  day: { type: Object, required: true },
  groupName: { type: String, required: true },
  resumo: { type: Object, required: true },
  travelsCount: { type: Number, default: 0 },
  busy: { type: Boolean, default: false },
  defaultExpanded: { type: Boolean, default: false },
})

const emit = defineEmits(['close-window', 'revise', 'cancel'])
const motivo = shallowRef('')
const expanded = shallowRef(props.defaultExpanded)

function submitCancel() {
  emit('cancel', {
    day: props.day,
    reason: motivo.value,
    onSuccess: () => {
      motivo.value = ''
    },
  })
}
</script>

<template>
  <section class="day-accordion" :class="{ expanded, canceled: Boolean(day.canceled_at) }">
    <button
      type="button"
      class="day-accordion-header"
      :aria-expanded="expanded"
      @click="expanded = !expanded"
    >
      <div class="day-header-main">
        <div class="day-title-row">
          <strong class="day-title">{{ day.date }} · {{ groupName }}</strong>
          <span class="day-pill">Dia #{{ day.id }}</span>
          <span class="day-pill" :class="`window-${day.window}`">
            {{ WINDOW_SHORT_LABELS[day.window] || day.window }}
          </span>
          <span v-if="day.canceled_at" class="day-pill canceled-pill">Cancelado</span>
        </div>
        <div class="day-meta-row">
          <span>Rev. {{ day.revision }}</span>
          <span>·</span>
          <span>Elegíveis: <strong>{{ resumo.total }}</strong></span>
          <span>·</span>
          <span>Ida: <strong>{{ resumo.comIda }}</strong></span>
          <span>·</span>
          <span>Retorno: <strong>{{ resumo.comRetorno }}</strong></span>
          <span>·</span>
          <span>Viagens: <strong>{{ travelsCount }}</strong></span>
        </div>
      </div>
      <BaseIcon :class="{ open: expanded }" name="mdi-chevron-down" class="day-chevron" />
    </button>

    <div
      class="day-accordion-collapse"
      :class="{ open: expanded }"
      :aria-hidden="!expanded"
      :inert="!expanded || undefined"
    >
      <div class="day-accordion-collapse-inner">
        <div class="day-accordion-body">
          <div v-if="day.canceled_at" class="day-canceled-note">
            Cancelado em {{ formatDateTimeBr(day.canceled_at) }}.
          </div>

          <div v-if="!day.canceled_at" class="day-top-actions">
            <BaseButton
              v-if="day.window === 'closed' || day.window === 'extension'"
              size="sm"
              :disabled="busy"
              @click="emit('close-window', day)"
            >
              Consolidar respostas e alocar
            </BaseButton>
            <BaseButton variant="outline" size="sm" :disabled="busy" @click="emit('revise', day)">
              Revisar atendimento
            </BaseButton>
          </div>

          <StatusBanner
            v-if="day.issues?.length"
            persistent
            variant="danger"
            :message="`Pendências do atendimento: ${day.issues.join(' · ')}`"
          />

          <div class="resumo-demanda">
            <span>Elegíveis: <strong>{{ resumo.total }}</strong></span>
            <span>Com ida: <strong>{{ resumo.comIda }}</strong></span>
            <span>Com retorno: <strong>{{ resumo.comRetorno }}</strong></span>
            <span>Negativas explícitas: <strong>{{ resumo.negativas }}</strong></span>
            <span>Sem resposta: <strong>{{ resumo.semResposta }}</strong></span>
          </div>

          <div v-if="!day.canceled_at" class="cancel-row">
            <input
              v-model="motivo"
              placeholder="Motivo para cancelar este atendimento..."
              maxlength="500"
              :disabled="busy"
            />
            <BaseButton variant="outline" size="sm" :disabled="busy" @click="submitCancel">
              Cancelar atendimento
            </BaseButton>
          </div>

          <div class="travels-section">
            <h3 class="travels-heading">Viagens do Atendimento ({{ travelsCount }})</h3>
            <slot />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.day-accordion {
  border-radius: $radius-lg;
  background: var(--color-surface);
  border: 1px solid var(--border);
  box-shadow: var(--shadow);
  overflow: hidden;
  transition: border-color $duration-fast $ease-fluid;

  &.expanded {
    border-color: var(--border-primary);
  }

  &.canceled {
    opacity: 0.82;
  }
}

.day-accordion-header {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $space-3;
  padding: $space-4;
  background: transparent;
  border: none;
  color: var(--text);
  text-align: left;
  cursor: pointer;
  transition: background-color $duration-fast $ease-fluid;

  &:hover {
    background: var(--altbg);
  }
}

.day-header-main {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.day-title-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: $space-2;
}

.day-title {
  font-size: $text-base;
  font-weight: $font-bold;
}

.day-pill {
  padding: 2px 8px;
  border-radius: $radius-pill;
  font-size: $text-xs;
  font-weight: $font-semibold;
  background: var(--altbg);
  color: var(--text-muted);
  border: 1px solid var(--border);

  &.window-normal {
    background: var(--success-soft);
    color: var(--success);
    border-color: transparent;
  }

  &.window-extension {
    background: var(--warning-soft);
    color: var(--warning);
    border-color: transparent;
  }

  &.window-closed {
    background: var(--color-primary-soft);
    color: var(--primary);
    border-color: transparent;
  }

  &.canceled-pill {
    background: var(--danger-soft);
    color: var(--danger);
    border-color: transparent;
  }
}

.day-meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  font-size: $text-xs;
  color: var(--text-muted);
}

.day-chevron {
  font-size: 1.4rem;
  color: var(--text-muted);
  flex-shrink: 0;
  transition:
    transform 0.36s $ease-fluid,
    color 0.25s $ease-fluid;

  &.open {
    transform: rotate(180deg);
    color: var(--primary);
  }
}

.day-accordion-collapse {
  display: grid;
  grid-template-rows: 0fr;
  opacity: 0;
  transition:
    grid-template-rows 0.38s $ease-fluid,
    opacity 0.28s $ease-fluid;

  &.open {
    grid-template-rows: 1fr;
    opacity: 1;

    .day-accordion-body {
      transform: translateY(0);
    }
  }
}

.day-accordion-collapse-inner {
  overflow: hidden;
  min-height: 0;
}

.day-accordion-body {
  padding: $space-4;
  border-top: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: $space-3;
  transform: translateY(-6px);
  transition: transform 0.36s $ease-fluid;
}

.day-canceled-note {
  font-size: $text-sm;
  color: var(--danger);
  font-weight: $font-semibold;
}

.day-top-actions {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;
}

.resumo-demanda {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2 $space-4;
  padding: $space-3;
  border-radius: $radius-md;
  background: var(--altbg);
  font-size: $text-sm;
}

.cancel-row {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;
  align-items: center;

  input {
    flex: 1 1 200px;
    padding: 9px $space-3;
    border-radius: $radius-sm;
    background: var(--color-surface);
    outline: 1.5px solid var(--border);
    outline-offset: -1.5px;
    color: var(--text);
    font-size: $text-sm;
  }
}

.travels-section {
  display: flex;
  flex-direction: column;
  gap: $space-3;
}

.travels-heading {
  font-size: $text-base;
  font-weight: $font-bold;
}
</style>
