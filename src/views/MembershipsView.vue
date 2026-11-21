<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { state } from '@/stores/state'
import { getPublicCompany } from '@/api/companies'
import { useMemberships } from '@/features/memberships/composables/useMemberships'
import { useInputFormat } from '@/composables/useInputFormat'
import { useToast } from '@/composables/useToast'
import { sessionError } from '@/stores/session'
import { formatApiError } from '@/utils/apiErrors'
import BaseButton from '@/components/ui/BaseButton.vue'
import PageNavigation from '@/components/ui/PageNavigation.vue'
import MembershipCard from '@/features/memberships/components/MembershipCard.vue'
import MembershipActionForm from '@/features/memberships/components/MembershipActionForm.vue'
import SkeletonCard from '@/components/ui/SkeletonCard.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import '@/styles/memberships.scss'

const route = useRoute()
const scope = computed(() => {
  const role = state.role
  const id = state.profiles[role]?.id
  return state.logged && ['passenger', 'driver'].includes(role) && id ? { [role]: id } : null
})
const {
  records, openMembership, openCompany, page, totalPages, loading, busy, ready,
  error, notice, canRequest, refresh, goToPage, request, transition,
} = useMemberships(scope)

const { formatPhone } = useInputFormat()
const { showToast } = useToast()
const selectedCompany = ref(null)
const selectedGroupId = ref('')
const profilePhoneFormatted = computed(() => formatPhone(state.user?.phone || ''))
const selectionLoading = ref(false)
const selectionError = ref('')
const closingAction = ref('')

watch(notice, (msg) => {
  if (msg) showToast(msg, 'success')
})
watch(error, (msg) => {
  if (msg) showToast(msg, 'error')
})
watch(selectionError, (msg) => {
  if (msg) showToast(msg, 'error')
})
const selectedId = computed(() => {
  const value = route.query.company
  return typeof value === 'string' && /^[1-9]\d*$/.test(value) && Number.isSafeInteger(Number(value))
    ? Number(value) : null
})
const requestedGroupQueryId = computed(() => {
  const value = route.query.group
  return typeof value === 'string' && /^[1-9]\d*$/.test(value) && Number.isSafeInteger(Number(value))
    ? Number(value) : null
})

watch([selectedId, scope], async ([id, identity], _previous, onCleanup) => {
  selectedCompany.value = null
  selectedGroupId.value = ''
  selectionError.value = ''
  selectionLoading.value = false
  if (!id || !identity) return
  const controller = new AbortController()
  onCleanup(() => controller.abort())
  selectionLoading.value = true
  try {
    const company = await getPublicCompany(id, { signal: controller.signal })
    if (!controller.signal.aborted) {
      selectedCompany.value = company
      const groups = company.route_groups || []
      const matched = requestedGroupQueryId.value && groups.find((g) => g.id === requestedGroupQueryId.value)
      selectedGroupId.value = matched ? String(matched.id) : groups.length === 1 ? String(groups[0].id) : ''
    }
  } catch (cause) {
    if (!controller.signal.aborted) {
      selectionError.value = sessionError(cause, formatApiError(cause, 'A empresa não está disponível. Volte à busca.'))
    }
  } finally {
    if (!controller.signal.aborted) selectionLoading.value = false
  }
}, { immediate: true })

watch(openMembership, () => { closingAction.value = '' })

function companyName(membership) {
  return openCompany.value?.id === membership.company
    ? openCompany.value.trade_name : `Empresa nº ${membership.company}`
}

async function closeMembership(reason) {
  if (await transition(openMembership.value, closingAction.value, reason)) closingAction.value = ''
}
</script>

<template>
  <div class="membership-workspace" :class="{ authenticated: state.logged }">
    <div class="membership-content">
      <h1 class="membership-heading">Meus vínculos</h1>
      <p>Conta, vínculo empresarial, grupo de atendimento e viagem são etapas distintas.</p>
      <template v-if="scope">
        <p>Conta autenticada · perfil de {{ state.role === 'driver' ? 'motorista' : 'passageiro' }}.</p>
        <div class="membership-actions">
          <RouterLink to="/empresas">Pesquisar empresas</RouterLink>
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
            <BaseButton v-if="!closingAction" type="button" variant="outline" :disabled="busy"
              @click="closingAction = openMembership.status === 'active' ? 'end' : 'withdraw'">
              {{ openMembership.status === 'active' ? 'Encerrar vínculo' : 'Retirar pedido' }}
            </BaseButton>
            <template v-else>
              <p v-if="closingAction === 'end'">Encerrar termina seu acesso operacional à empresa, sem apagar a conta ou o histórico. Alocações futuras e operação em andamento podem bloquear a ação; nada será cancelado automaticamente.</p>
              <MembershipActionForm :key="`${openMembership.id}-${closingAction}`"
                :title="closingAction === 'end' ? 'Confirmar encerramento deste vínculo?' : 'Retirar este pedido de vínculo? Sua conta será preservada.'"
                :busy="busy" :disabled="!ready" @confirm="closeMembership" @cancel="closingAction = ''" />
            </template>
          </MembershipCard>
          <p v-else role="status">Você não tem pedido pendente nem vínculo ativo neste perfil.</p>
        </section>

        <section v-if="route.query.company" class="membership-panel" aria-label="Revisão de solicitação">
          <h2>Revisar solicitação</h2>
          <p v-if="!selectedId">Identificador de empresa inválido. Escolha uma empresa na busca.</p>
          <p v-else-if="selectionLoading" role="status">Consultando a empresa selecionada...</p>
          <template v-if="selectedCompany">
            <h3>{{ selectedCompany.trade_name }} · empresa nº {{ selectedCompany.id }}</h3>
            <div v-if="state.role === 'passenger' && selectedCompany.route_groups?.length" class="membership-filters">
              <label>
                Grupo de rota desejado
                <select v-model="selectedGroupId" class="membership-select" :disabled="busy">
                  <option value="">Sem grupo específico</option>
                  <option v-for="group in selectedCompany.route_groups" :key="group.id" :value="String(group.id)">
                    {{ group.name }}{{ group.city ? ` (${group.city}/${group.state})` : '' }}
                  </option>
                </select>
              </label>
            </div>
            <p class="membership-phone-hint">
              Telefone enviado do seu perfil:
              <strong>{{ profilePhoneFormatted || 'não informado (você pode preencher em Meu Perfil)' }}</strong>
            </p>
            <p>
              Enviar como {{ state.role === 'driver' ? 'motorista' : 'passageiro' }}.
              <template v-if="state.role === 'passenger' && selectedGroupId">
                Ao ser aprovado pela empresa, você será adicionado automaticamente ao grupo de rota escolhido.
              </template>
              <template v-else>
                O pedido depende da decisão da empresa e não altera sua conta.
              </template>
            </p>
            <BaseButton
              type="button"
              :disabled="!canRequest || selectionLoading"
              :loading="busy"
              @click="request(selectedCompany.id, selectedGroupId ? Number(selectedGroupId) : null, state.user?.phone || '')"
            >
              Enviar pedido de vínculo
            </BaseButton>
            <p v-if="ready && openMembership">Já existe um pedido pendente ou vínculo ativo. Nenhuma troca automática será realizada.</p>
          </template>
        </section>

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
      <template v-else-if="!state.logged">
        <p>Sessão ausente ou encerrada. Entre novamente; nenhuma operação foi repetida.</p>
        <RouterLink class="membership-link" :to="{ name: 'login', query: selectedId ? { company: selectedId } : {} }">Entrar novamente</RouterLink>
      </template>
      <template v-else>
        <p>Esta tela exige um perfil único de passageiro ou motorista. Nenhum pedido foi enviado.</p>
        <RouterLink v-if="state.role === 'company'" class="membership-link" to="/usuarios">Gerenciar pedidos da empresa</RouterLink>
      </template>
    </div>
  </div>
</template>
