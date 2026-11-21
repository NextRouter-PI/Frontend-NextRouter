<script setup>
import { computed, shallowRef, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/useAuthStore'
import { useMemberships } from '@/features/memberships/composables/useMemberships'
import { useMembershipCompanyPreview } from '@/features/memberships/composables/useMembershipCompanyPreview'
import { useToast } from '@/composables/useToast'
import BaseButton from '@/components/ui/BaseButton.vue'
import PageNavigation from '@/components/ui/PageNavigation.vue'
import MembershipCard from '@/features/memberships/components/MembershipCard.vue'
import MembershipActionForm from '@/features/memberships/components/MembershipActionForm.vue'
import MembershipRequestPreviewCard from '@/features/memberships/components/MembershipRequestPreviewCard.vue'
import SkeletonCard from '@/components/ui/SkeletonCard.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import '@/styles/memberships.scss'

const route = useRoute()
const auth = useAuthStore()
const { showToast } = useToast()

const scope = computed(() => {
  const role = auth.role
  const id = auth.profiles[role]?.id
  return auth.logged && ['passenger', 'driver'].includes(role) && id ? { [role]: id } : null
})

const {
  records, openMembership, openCompany, page, totalPages, loading, busy, ready,
  error, notice, canRequest, refresh, goToPage, request, transition,
} = useMemberships(scope)

const {
  selectedId,
  selectedCompany,
  selectedGroupId,
  selectionLoading,
  selectionError,
} = useMembershipCompanyPreview({ route, scope })

const closingAction = shallowRef('')

watch(notice, (msg) => {
  if (msg) showToast(msg, 'success')
})
watch(error, (msg) => {
  if (msg) showToast(msg, 'error')
})
watch(selectionError, (msg) => {
  if (msg) showToast(msg, 'error')
})
watch(openMembership, () => {
  closingAction.value = ''
})

function companyName(membership) {
  return openCompany.value?.id === membership.company
    ? openCompany.value.trade_name
    : `Empresa nº ${membership.company}`
}

async function closeMembership(reason) {
  if (await transition(openMembership.value, closingAction.value, reason)) closingAction.value = ''
}
</script>

<template>
  <div class="membership-workspace" :class="{ authenticated: auth.logged }">
    <div class="membership-content">
      <h1 class="membership-heading">Meus vínculos</h1>
      <p>Conta, vínculo empresarial, grupo de atendimento e viagem são etapas distintas.</p>
      <template v-if="scope">
        <p>Conta autenticada · perfil de {{ auth.role === 'driver' ? 'motorista' : 'passageiro' }}.</p>
        <div class="membership-actions">
          <RouterLink to="/companies">Pesquisar empresas</RouterLink>
          <BaseButton type="button" variant="outline" :disabled="busy || loading" @click="refresh(1)">Atualizar vínculos</BaseButton>
        </div>
        <LoadingSpinner v-if="busy" size="sm" inline text="Processando ação de vínculo..." />
        <SkeletonCard v-if="loading" :count="2" avatar />
        <section v-else-if="ready" class="membership-section" aria-label="Situação atual do vínculo">
          <h2>Situação atual</h2>
          <MembershipCard v-if="openMembership" :membership="openMembership" :title="companyName(openMembership)">
            <p v-if="openMembership.status === 'active'">
              A empresa aprovou seu vínculo. Isso não atribui grupo, ponto, serviços ou viagem.
              Não é possível solicitar outra empresa enquanto este vínculo estiver ativo.
            </p>
            <p v-else>Aguarde a decisão da empresa ou retire o pedido antes de solicitar outra empresa.</p>
            <BaseButton
              v-if="!closingAction"
              type="button"
              variant="outline"
              :disabled="busy"
              @click="closingAction = openMembership.status === 'active' ? 'end' : 'withdraw'"
            >
              {{ openMembership.status === 'active' ? 'Encerrar vínculo' : 'Retirar pedido' }}
            </BaseButton>
            <template v-else>
              <p v-if="closingAction === 'end'">
                Encerrar termina seu acesso operacional à empresa, sem apagar a conta ou o histórico. Alocações futuras e operação em andamento podem bloquear a ação; nada será cancelado automaticamente.
              </p>
              <MembershipActionForm
                :key="`${openMembership.id}-${closingAction}`"
                :title="closingAction === 'end' ? 'Confirmar encerramento deste vínculo?' : 'Retirar este pedido de vínculo? Sua conta será preservada.'"
                :busy="busy"
                :disabled="!ready"
                @confirm="closeMembership"
                @cancel="closingAction = ''"
              />
            </template>
          </MembershipCard>
          <p v-else role="status">Você não tem pedido pendente nem vínculo ativo neste perfil.</p>
        </section>

        <MembershipRequestPreviewCard
          v-if="route.query.company"
          v-model:selected-group-id="selectedGroupId"
          :selected-id="selectedId"
          :selected-company="selectedCompany"
          :selection-loading="selectionLoading"
          :role="auth.role"
          :user-phone="auth.user?.phone || ''"
          :busy="busy"
          :can-request="canRequest"
          :ready="ready"
          :open-membership="openMembership"
          @submit="request(selectedCompany.id, selectedGroupId ? Number(selectedGroupId) : null, auth.user?.phone || '')"
        />

        <section v-if="ready" class="membership-section" aria-label="Histórico de vínculos">
          <h2>Pedidos e vínculos</h2>
          <p>O histórico usa o identificador da empresa quando seu nome público não está disponível.</p>
          <p v-if="!records.length">Nenhum pedido registrado neste perfil.</p>
          <TransitionGroup name="list-stagger" tag="div" class="membership-list">
            <MembershipCard v-for="membership in records" :key="membership.id" :membership="membership" :title="companyName(membership)" />
          </TransitionGroup>
          <PageNavigation :page="page" :total-pages="totalPages" :disabled="loading || busy" @change="goToPage" />
        </section>
      </template>
      <template v-else-if="!auth.logged">
        <p>Sessão ausente ou encerrada. Entre novamente; nenhuma operação foi repetida.</p>
        <RouterLink class="membership-link" :to="{ name: 'login', query: selectedId ? { company: selectedId } : {} }">Entrar novamente</RouterLink>
      </template>
      <template v-else>
        <p>Esta tela exige um perfil único de passageiro ou motorista. Nenhum pedido foi enviado.</p>
        <RouterLink v-if="auth.role === 'company'" class="membership-link" to="/users">Gerenciar pedidos da empresa</RouterLink>
      </template>
    </div>
  </div>
</template>
