<script setup>
import { computed, ref, watch } from 'vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import PageNavigation from '@/components/ui/PageNavigation.vue'
import MembershipCard from '@/features/memberships/components/MembershipCard.vue'
import MembershipActionForm from '@/features/memberships/components/MembershipActionForm.vue'

const props = defineProps({
  records: { type: Array, default: () => [] },
  nameFilter: { type: String, default: '' },
  page: { type: Number, required: true },
  totalPages: { type: Number, required: true },
  busy: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  ready: { type: Boolean, default: false },
  transition: { type: Function, required: true },
})

const emit = defineEmits(['page-change'])
const decision = ref(null)

const filteredRecords = computed(() =>
  props.records.filter((record) =>
    (record.applicant_name || '')
      .toLocaleLowerCase('pt-BR')
      .includes(props.nameFilter.trim().toLocaleLowerCase('pt-BR')),
  ),
)

const decisionTitle = computed(() => {
  if (!decision.value) return ''
  const action = {
    approve: 'Aprovar o vínculo',
    reject: 'Recusar o pedido',
    end: 'Encerrar o vínculo',
  }[decision.value.action]
  return `${action} de ${decision.value.membership.applicant_name}?`
})

watch(() => props.records, () => {
  decision.value = null
})

function resetDecision() {
  decision.value = null
}

async function confirmDecision(reason) {
  if (!decision.value) return
  const { membership, action } = decision.value
  if (await props.transition(membership, action, reason)) decision.value = null
}

defineExpose({ resetDecision })
</script>

<template>
  <section aria-label="Pedidos e vínculos da empresa">
    <p v-if="!records.length" role="status">Nenhum registro neste estado.</p>
    <p v-else-if="!filteredRecords.length" role="status">Nenhum nome corresponde ao filtro nesta página.</p>
    <TransitionGroup name="list-stagger" tag="div" class="membership-list">
      <MembershipCard
        v-for="membership in filteredRecords"
        :key="membership.id"
        :membership="membership"
        :title="membership.applicant_name || 'Nome não disponível'"
      >
        <template v-if="membership.status === 'active'">
          <p>Vínculo aprovado. Grupo e serviços são configurações posteriores.</p>
          <div class="membership-actions">
            <RouterLink
              :to="membership.driver ? `/users/driver/${membership.driver}` : `/users/passenger/${membership.passenger}`"
              class="btn-profile-link"
            >
              <BaseIcon name="mdi-account-details-outline" />
              <span>Consultar perfil</span>
            </RouterLink>
            <BaseButton
              v-if="decision?.membership.id !== membership.id"
              type="button"
              variant="outline"
              :disabled="busy"
              @click="decision = { membership, action: 'end' }"
            >
              Encerrar vínculo
            </BaseButton>
          </div>
        </template>
        <div
          v-if="membership.status === 'pending' && decision?.membership.id !== membership.id"
          class="membership-actions"
        >
          <BaseButton type="button" :disabled="busy" @click="decision = { membership, action: 'approve' }">
            Aprovar vínculo
          </BaseButton>
          <BaseButton type="button" variant="outline" :disabled="busy" @click="decision = { membership, action: 'reject' }">
            Recusar pedido
          </BaseButton>
        </div>
        <Transition name="fade-slide">
          <div v-if="decision?.membership.id === membership.id">
            <p v-if="decision.action === 'end'">
              Encerrar termina o acesso operacional do titular sem apagar a conta. Operação em andamento ou alocações futuras podem bloquear; a aplicação não as cancela automaticamente.
            </p>
            <MembershipActionForm
              :key="`${membership.id}-${decision.action}`"
              :title="decisionTitle"
              :busy="busy"
              :disabled="!ready"
              @confirm="confirmDecision"
              @cancel="decision = null"
            />
          </div>
        </Transition>
      </MembershipCard>
    </TransitionGroup>
    <PageNavigation :page="page" :total-pages="totalPages" :disabled="busy || loading" @change="emit('page-change', $event)" />
  </section>
</template>
