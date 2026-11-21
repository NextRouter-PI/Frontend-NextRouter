<script setup>
import { computed, shallowRef, watch } from 'vue'
import { WINDOW_FULL_LABELS, WINDOW_STATES } from '@/constants'
import { formatDateChip, formatDateTimeBr } from '@/utils/formatters'
import { formatEligibilityServiceLabel } from '@/features/transport/utils/questionnaireMapper'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import AttendanceSummaryAxes from './AttendanceSummaryAxes.vue'
import AttendanceResponseForms from './AttendanceResponseForms.vue'

const props = defineProps({
  eligibility: { type: Object, required: true },
  busy: { type: Boolean, default: false },
  sendNormalAnswer: { type: Function, required: true },
})

const emit = defineEmits(['submit-extension', 'cancel-request', 'withdraw-leg'])

const outboundChoice = defineModel('outboundChoice', { type: String, default: '' })
const returnChoice = defineModel('returnChoice', { type: String, default: '' })
const changeLeg = defineModel('changeLeg', { type: String, default: 'outbound' })
const proposedServiceId = defineModel('proposedServiceId', { type: String, default: '' })

const editingAnswer = shallowRef(false)
const cardExpanded = shallowRef(true)

const windowLabel = computed(
  () => WINDOW_FULL_LABELS[props.eligibility.dayData?.window] || 'Estado da janela não informado',
)
const alreadyAnswered = computed(() => Boolean(props.eligibility.response?.answered_at))

watch(
  () => props.eligibility.id,
  () => {
    editingAnswer.value = false
    cardExpanded.value = !alreadyAnswered.value
  },
  { immediate: true },
)

async function handleSendNormalAnswer() {
  const ok = await props.sendNormalAnswer()
  if (ok) {
    editingAnswer.value = false
    cardExpanded.value = false
  }
}
</script>

<template>
  <BaseCard :title="`Atendimento de ${formatDateChip(eligibility.dayData.date)}`">
    <template #actions>
      <span class="window-tag">{{ windowLabel }}</span>
      <BaseButton
        variant="outline"
        size="sm"
        :icon="cardExpanded ? 'mdi-chevron-up' : 'mdi-chevron-down'"
        @click="cardExpanded = !cardExpanded"
      >
        {{ cardExpanded ? 'Recolher' : 'Ver / alterar' }}
      </BaseButton>
    </template>

    <div v-if="!cardExpanded && alreadyAnswered" class="collapsed-summary">
      <span class="mdi mdi-check-circle-outline" aria-hidden="true"></span>
      <span>
        Confirmado — Ida: <strong>{{ formatEligibilityServiceLabel(eligibility, eligibility.response?.outbound_service) }}</strong>
        · Retorno: <strong>{{ formatEligibilityServiceLabel(eligibility, eligibility.response?.return_service) }}</strong>
      </span>
    </div>

    <template v-else>
      <p
        v-if="eligibility.dayData.opens_at && eligibility.dayData.normal_deadline"
        class="sub-info"
      >
        Janela de confirmação:
        <strong>abre em {{ formatDateTimeBr(eligibility.dayData.opens_at) }}</strong> ·
        <strong>fecha em {{ formatDateTimeBr(eligibility.dayData.normal_deadline) }}</strong>
        <template v-if="eligibility.dayData.extension_deadline">
          · prorrogação até {{ formatDateTimeBr(eligibility.dayData.extension_deadline) }}
        </template>
      </p>

      <p v-if="eligibility.dayData.window === WINDOW_STATES.NOT_OPEN" class="sub-info">
        Esta janela ainda não abriu. Você poderá selecionar e confirmar ida e volta a partir de
        <strong>{{ formatDateTimeBr(eligibility.dayData.opens_at) }}</strong>.
      </p>

      <p v-if="eligibility.point_snapshot?.name" class="sub-info">
        Ponto operacional congelado: <strong>{{ eligibility.point_snapshot.name }}</strong>
        ({{ eligibility.point_snapshot.city }}/{{ eligibility.point_snapshot.state }})
      </p>

      <AttendanceSummaryAxes
        :eligibility="eligibility"
        :busy="busy"
        @withdraw-leg="emit('withdraw-leg', $event)"
      />

      <AttendanceResponseForms
        v-model:outbound-choice="outboundChoice"
        v-model:return-choice="returnChoice"
        v-model:change-leg="changeLeg"
        v-model:proposed-service-id="proposedServiceId"
        v-model:editing-answer="editingAnswer"
        :eligibility="eligibility"
        :already-answered="alreadyAnswered"
        :busy="busy"
        @submit-normal="handleSendNormalAnswer"
        @submit-extension="emit('submit-extension')"
        @cancel-request="emit('cancel-request', $event)"
      />
    </template>
  </BaseCard>
</template>

<style lang="scss" scoped>
.window-tag {
  padding: $space-1 $space-3;
  border-radius: $radius-pill;
  background: var(--color-primary-soft);
  color: var(--primary);
  font-size: $text-xs;
  font-weight: $font-bold;
}

.sub-info {
  font-size: $text-sm;
  color: var(--text-muted);
  line-height: 1.5;

  strong {
    color: var(--text);
  }
}

.collapsed-summary {
  display: flex;
  align-items: center;
  gap: $space-2;
  padding: $space-3;
  border-radius: $radius-md;
  background: var(--success-soft);
  color: var(--success);
  font-size: $text-sm;
  line-height: 1.45;

  .mdi {
    font-size: 1.15rem;
    flex-shrink: 0;
  }
}
</style>
