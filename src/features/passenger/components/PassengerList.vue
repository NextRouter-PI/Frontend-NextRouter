<script setup>
import { computed, watch } from 'vue'
import { useTransportQuestionnaire } from '@/features/transport/composables/useTransportQuestionnaire'
import { useToast } from '@/composables/useToast'
import PageHeader from '@/components/ui/PageHeader.vue'
import StatTile from '@/components/ui/StatTile.vue'
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

// Resumo dos dias de atendimento: quantos estão abertos e quantos você já respondeu.
const resumo = computed(() => {
  const list = enrichedEligibilities.value
  const abertos = list.filter((e) => ['normal', 'extension'].includes(e.dayData?.window))
  return {
    dias: list.length,
    abertos: abertos.length,
    respondidos: list.filter((e) => e.response?.answered_at).length,
    pendentes: abertos.filter((e) => !e.response?.answered_at).length,
  }
})

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
      title="Seus atendimentos"
      highlight="atendimentos"
      eyebrow="Passageiro"
      icon="mdi-seat-passenger"
      subtitle="Confirme ida e retorno de cada dia. Enviar a resposta não garante vaga: a empresa ainda aloca e publica a viagem."
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

    <section class="stat-grid" aria-label="Resumo dos atendimentos">
      <StatTile icon="mdi-calendar-clock" label="Dias de atendimento" :value="loading ? null : resumo.dias" :loading="loading" />
      <StatTile icon="mdi-calendar-check-outline" label="Abertos para resposta" :value="loading ? null : resumo.abertos" :loading="loading" tone="blue" />
      <StatTile
        icon="mdi-check-circle-outline"
        label="Respondidos"
        :value="loading ? null : resumo.respondidos"
        :total="loading ? null : resumo.dias || null"
        :loading="loading"
        tone="green"
      />
      <StatTile
        icon="mdi-alert-circle-outline"
        label="Faltam responder"
        :value="loading ? null : resumo.pendentes"
        :loading="loading"
        tone="gray"
        hint="Janelas abertas sem resposta"
      />
    </section>

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
  --page-max: 1040px;
  @include section-container(120px);
}
</style>
