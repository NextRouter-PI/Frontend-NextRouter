<script setup>
import { computed, shallowRef, watch } from 'vue'
import { WINDOW_FULL_LABELS, WINDOW_STATES } from '@/constants'
import { formatDateChip, formatDateTimeBr } from '@/utils/formatters'
import { useTransportQuestionnaire } from '@/features/transport/composables/useTransportQuestionnaire'
import { useToast } from '@/composables/useToast'
import PageHeader from '@/components/ui/PageHeader.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import PassengerRoutesCard from '@/features/transport/components/PassengerRoutesCard.vue'
import AttendanceDayTabs from '@/features/passenger/components/attendance/AttendanceDayTabs.vue'
import AttendanceSummaryAxes from '@/features/passenger/components/attendance/AttendanceSummaryAxes.vue'
import AttendanceResponseForms from '@/features/passenger/components/attendance/AttendanceResponseForms.vue'

const editingAnswer = shallowRef(false)
const { showToast } = useToast()

const {
  loading,
  busy,
  error,
  notice,
  enrichedEligibilities,
  selectedEligibility,
  outboundChoice,
  returnChoice,
  changeLeg,
  proposedServiceId,
  selectEligibility,
  refresh,
  sendNormalAnswer,
  sendExtensionRequest,
  cancelPendingRequest,
  withdrawLeg,
} = useTransportQuestionnaire()

watch(notice, (msg) => {
  if (msg) showToast(msg, 'success')
})
watch(error, (msg) => {
  if (msg) showToast(msg, 'error')
})

const windowLabel = computed(() => {
  const w = selectedEligibility.value?.dayData?.window
  return WINDOW_FULL_LABELS[w] || 'Estado da janela não informado'
})

const alreadyAnswered = computed(() => Boolean(selectedEligibility.value?.response?.answered_at))

function serviceLabel(elig, serviceId) {
  if (!serviceId) return 'Não vou neste trecho'
  const all = [...(elig?.outboundServices || []), ...(elig?.returnServices || [])]
  const found = all.find((s) => s.id === serviceId)
  if (!found) return `Serviço #${serviceId}`
  const tipo = found.is_shared ? 'Compartilhado' : 'Habitual'
  return `${found.name} (${found.targetTimeLabel} · ${tipo})`
}

watch(
  () => selectedEligibility.value?.id,
  () => {
    editingAnswer.value = false
  },
)

async function handleSendNormalAnswer() {
  const ok = await sendNormalAnswer()
  if (ok) editingAnswer.value = false
}
</script>

<template>
  <div class="passenger-list-page">
    <PageHeader
      title="Atendimentos e Respostas por Data"
      subtitle="Intenção enviada, pedido na prorrogação, alocação e viagem publicada são estados distintos. Ida e retorno são independentes e usam somente seus serviços autorizados."
      accent
    >
      <template #actions>
        <BaseButton
          variant="outline"
          size="sm"
          icon="mdi-refresh"
          :loading="loading"
          :disabled="loading || busy"
          @click="refresh"
        >
          Atualizar atendimentos
        </BaseButton>
      </template>
    </PageHeader>

    <PassengerRoutesCard />

    <EmptyState
      v-if="loading"
      loading
      description="Consultando elegibilidades e atendimentos no servidor..."
    />

    <EmptyState
      v-else-if="!enrichedEligibilities.length"
      icon="mdi-calendar-blank-outline"
      title="Nenhum atendimento disponível"
      description="Você ainda não possui elegibilidades geradas para datas de atendimento. É necessário vínculo ativo, atribuição a um grupo de atendimento, serviços autorizados e geração de datas pela empresa."
    />

    <template v-else-if="selectedEligibility">
      <AttendanceDayTabs
        :eligibilities="enrichedEligibilities"
        :selected-id="selectedEligibility.id"
        :disabled="busy"
        @select="selectEligibility"
      />

      <BaseCard :title="`Atendimento de ${formatDateChip(selectedEligibility.dayData.date)}`">
        <template #actions>
          <span class="window-tag">{{ windowLabel }}</span>
        </template>

        <p
          v-if="selectedEligibility.dayData.opens_at && selectedEligibility.dayData.normal_deadline"
          class="sub-info"
        >
          Janela de confirmação:
          <strong>abre em {{ formatDateTimeBr(selectedEligibility.dayData.opens_at) }}</strong> ·
          <strong>fecha em {{ formatDateTimeBr(selectedEligibility.dayData.normal_deadline) }}</strong>
          <template v-if="selectedEligibility.dayData.extension_deadline">
            · prorrogação até {{ formatDateTimeBr(selectedEligibility.dayData.extension_deadline) }}
          </template>
        </p>

        <p v-if="selectedEligibility.dayData.window === WINDOW_STATES.NOT_OPEN" class="sub-info">
          Esta janela ainda não abriu. Você poderá selecionar e confirmar ida e volta a partir de
          <strong>{{ formatDateTimeBr(selectedEligibility.dayData.opens_at) }}</strong>.
        </p>

        <p v-if="selectedEligibility.point_snapshot?.name" class="sub-info">
          Ponto operacional congelado: <strong>{{ selectedEligibility.point_snapshot.name }}</strong>
          ({{ selectedEligibility.point_snapshot.city }}/{{ selectedEligibility.point_snapshot.state }})
        </p>

        <AttendanceSummaryAxes
          :eligibility="selectedEligibility"
          :busy="busy"
          @withdraw-leg="withdrawLeg"
        />

        <AttendanceResponseForms
          v-model:outbound-choice="outboundChoice"
          v-model:return-choice="returnChoice"
          v-model:change-leg="changeLeg"
          v-model:proposed-service-id="proposedServiceId"
          v-model:editing-answer="editingAnswer"
          :eligibility="selectedEligibility"
          :already-answered="alreadyAnswered"
          :busy="busy"
          :service-label="serviceLabel"
          @submit-normal="handleSendNormalAnswer"
          @submit-extension="sendExtensionRequest"
          @cancel-request="cancelPendingRequest"
        />
      </BaseCard>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.passenger-list-page {
  padding: $space-6 $space-4 120px;
  min-height: 100vh;
  max-width: 680px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: $space-3;
}

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
</style>
