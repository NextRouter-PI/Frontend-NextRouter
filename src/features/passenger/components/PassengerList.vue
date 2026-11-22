<script setup>
import { watch } from 'vue'
import { useTransportQuestionnaire } from '@/features/transport/composables/useTransportQuestionnaire'
import { useToast } from '@/composables/useToast'
import PageHeader from '@/components/ui/PageHeader.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import PassengerRoutesCard from '@/features/transport/components/PassengerRoutesCard.vue'
import AttendanceDayTabs from '@/features/passenger/components/attendance/AttendanceDayTabs.vue'
import AttendanceDayDetailCard from '@/features/passenger/components/attendance/AttendanceDayDetailCard.vue'

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

    <Transition name="fade-slide" mode="out-in">
      <EmptyState
        v-if="loading"
        key="loading"
        loading
        description="Consultando elegibilidades e atendimentos no servidor..."
      />

      <EmptyState
        v-else-if="!enrichedEligibilities.length"
        key="empty"
        icon="mdi-calendar-blank-outline"
        title="Nenhum atendimento disponível"
        description="Você ainda não possui elegibilidades geradas para datas de atendimento. É necessário vínculo ativo, atribuição a um grupo de atendimento, serviços autorizados e geração de datas pela empresa."
      />

      <div v-else-if="selectedEligibility" key="content" class="list-stack">
        <AttendanceDayTabs
          :eligibilities="enrichedEligibilities"
          :selected-id="selectedEligibility.id"
          :disabled="busy"
          @select="selectEligibility"
        />

        <AttendanceDayDetailCard
          v-model:outbound-choice="outboundChoice"
          v-model:return-choice="returnChoice"
          v-model:change-leg="changeLeg"
          v-model:proposed-service-id="proposedServiceId"
          :eligibility="selectedEligibility"
          :busy="busy"
          :send-normal-answer="sendNormalAnswer"
          @submit-extension="sendExtensionRequest"
          @cancel-request="cancelPendingRequest"
          @withdraw-leg="withdrawLeg"
        />
      </div>
    </Transition>
  </div>
</template>

<style lang="scss" scoped>
.passenger-list-page,
.list-stack {
  display: flex;
  flex-direction: column;
  gap: $space-3;
}

.passenger-list-page {
  @include section-container(120px);
}
</style>
