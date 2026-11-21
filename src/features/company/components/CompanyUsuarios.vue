<script setup>
import { computed, onScopeDispose, ref, watch } from 'vue'
import api from '@/api/client'
import { state } from '@/stores/state'
import { sessionError } from '@/stores/session'
import { formatApiError } from '@/utils/apiErrors'
import { useMemberships } from '@/features/memberships/composables/useMemberships'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import ErrorMessage from '@/components/ui/ErrorMessage.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import PageNavigation from '@/components/ui/PageNavigation.vue'
import MembershipCard from '@/features/memberships/components/MembershipCard.vue'
import MembershipActionForm from '@/features/memberships/components/MembershipActionForm.vue'
import SkeletonCard from '@/components/ui/SkeletonCard.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import '@/styles/memberships.scss'

const company = ref(null)
const companyLoading = ref(false)
const companyError = ref('')
const status = ref('pending')
const nameFilter = ref('')
const decision = ref(null)
const approved = computed(() => company.value?.is_approved && company.value.review_status === 'approved')
const scope = computed(() => state.logged && state.role === 'company' && approved.value
  ? { company: company.value.id } : null)
const {
  records, page, totalPages, loading, busy, ready, error, notice, goToPage, transition,
} = useMemberships(scope, status)
const filteredRecords = computed(() => records.value.filter((record) =>
  (record.applicant_name || '').toLocaleLowerCase('pt-BR').includes(nameFilter.value.trim().toLocaleLowerCase('pt-BR')),
))
const moderationLabel = computed(() => ({
  pending: 'Pendente de moderação', approved: 'Aprovado', rejected: 'Recusado na moderação',
})[company.value?.review_status] || 'Estado cadastral não reconhecido')
const decisionTitle = computed(() => {
  if (!decision.value) return ''
  const action = { approve: 'Aprovar o vínculo', reject: 'Recusar o pedido', end: 'Encerrar o vínculo' }[decision.value.action]
  return `${action} de ${decision.value.membership.applicant_name}?`
})
let companyRequest = null
let disposed = false

async function loadCompany() {
  if (disposed || busy.value) return
  companyRequest?.abort()
  company.value = null
  companyError.value = ''
  companyLoading.value = false
  if (!state.logged || state.role !== 'company') return
  const controller = new AbortController()
  companyRequest = controller
  companyLoading.value = true
  try {
    const { data } = await api.get('/companies/me/', { signal: controller.signal })
    if (!controller.signal.aborted) company.value = data
  } catch (cause) {
    if (!controller.signal.aborted) {
      companyError.value = sessionError(cause, formatApiError(cause, 'Não foi possível consultar seu cadastro empresarial.'))
    }
  } finally {
    if (!controller.signal.aborted) companyLoading.value = false
  }
}

watch(() => `${state.logged}:${state.role}:${state.user?.id || ''}`, () => {
  // Uma troca de identidade descarta o cadastro anterior, inclusive durante uma escrita.
  companyRequest?.abort()
  company.value = null
  decision.value = null
  nameFilter.value = ''
  status.value = 'pending'
  loadCompany()
}, { immediate: true, flush: 'sync' })
watch(records, () => { decision.value = null })
onScopeDispose(() => {
  disposed = true
  companyRequest?.abort()
})

async function confirmDecision(reason) {
  if (!decision.value) return
  const { membership, action } = decision.value
  if (await transition(membership, action, reason)) decision.value = null
}
</script>

<template>
  <div class="membership-workspace" :class="{ authenticated: state.logged }">
    <div class="membership-content">
      <PageHeader
        title="Usuários e vínculos"
        subtitle="Aprovar um vínculo não aprova a conta empresarial, não atribui grupo e não publica viagens."
      >
        <template v-if="state.role === 'company'" #actions>
          <BaseButton
            type="button"
            variant="outline"
            size="sm"
            :disabled="busy || companyLoading || loading"
            @click="loadCompany"
          >
            Atualizar cadastro e vínculos
          </BaseButton>
        </template>
      </PageHeader>
      <template v-if="state.role === 'company'">
        <div role="alert"><ErrorMessage :message="companyError" /></div>
        <SkeletonCard v-if="companyLoading" :count="1" :lines="2" />
        <section v-else-if="company" class="membership-panel" aria-label="Situação cadastral da empresa">
          <h2>{{ company.trade_name }}</h2>
          <p>Conta autenticada · cadastro empresarial: {{ moderationLabel }}.</p>
          <p v-if="!approved">A moderação cadastral é feita pela plataforma no admin Django. Não é possível decidir pedidos enquanto a empresa não estiver aprovada e ativa.</p>
        </section>

        <template v-if="scope">
          <div class="membership-filters">
            <label>
              Estado do vínculo
              <select v-model="status" class="membership-select" :disabled="busy">
                <option value="pending">Pedidos pendentes</option>
                <option value="active">Vínculos ativos</option>
                <option value="rejected">Pedidos recusados</option>
                <option value="withdrawn">Pedidos retirados</option>
                <option value="ended">Vínculos encerrados</option>
                <option value="">Todos os estados</option>
              </select>
            </label>
          </div>
          <BaseInput v-model="nameFilter" label="Filtrar por nome somente nesta página" />
          <p>Solicitantes são identificados pelo nome e perfil, sem consulta a CPF, endereço ou documentos.</p>
          <Transition name="fade-slide">
            <p v-if="notice" class="membership-notice" role="status">{{ notice }}</p>
          </Transition>
          <div role="alert"><ErrorMessage :message="error" /></div>
          <LoadingSpinner v-if="busy" size="sm" inline text="Processando ação de vínculo..." />
          <SkeletonCard v-if="loading" :count="3" avatar />
          <section v-else-if="ready" aria-label="Pedidos e vínculos da empresa">
            <p v-if="!records.length" role="status">Nenhum registro neste estado.</p>
            <p v-else-if="!filteredRecords.length" role="status">Nenhum nome corresponde ao filtro nesta página.</p>
            <TransitionGroup name="list-stagger" tag="div" class="membership-list">
              <MembershipCard v-for="membership in filteredRecords" :key="membership.id"
                :membership="membership" :title="membership.applicant_name || 'Nome não disponível'">
                <template v-if="membership.status === 'active'">
                  <p>Vínculo aprovado. Grupo e serviços são configurações posteriores.</p>
                  <div class="membership-actions">
                    <RouterLink
                      :to="membership.driver ? `/users/driver/${membership.driver}` : `/users/passenger/${membership.passenger}`"
                      class="btn-profile-link"
                    >
                      <span class="mdi mdi-account-details-outline" aria-hidden="true"></span>
                      <span>Consultar perfil</span>
                    </RouterLink>
                    <BaseButton v-if="decision?.membership.id !== membership.id" type="button" variant="outline" :disabled="busy"
                      @click="decision = { membership, action: 'end' }">Encerrar vínculo</BaseButton>
                  </div>
                </template>
                <div v-if="membership.status === 'pending' && decision?.membership.id !== membership.id" class="membership-actions">
                  <BaseButton type="button" :disabled="busy" @click="decision = { membership, action: 'approve' }">Aprovar vínculo</BaseButton>
                  <BaseButton type="button" variant="outline" :disabled="busy" @click="decision = { membership, action: 'reject' }">Recusar pedido</BaseButton>
                </div>
                <Transition name="fade-slide">
                  <div v-if="decision?.membership.id === membership.id">
                    <p v-if="decision.action === 'end'">Encerrar termina o acesso operacional do titular sem apagar a conta. Operação em andamento ou alocações futuras podem bloquear; a aplicação não as cancela automaticamente.</p>
                    <MembershipActionForm :key="`${membership.id}-${decision.action}`" :title="decisionTitle"
                      :busy="busy" :disabled="!ready" @confirm="confirmDecision" @cancel="decision = null" />
                  </div>
                </Transition>
              </MembershipCard>
            </TransitionGroup>
            <PageNavigation :page="page" :total-pages="totalPages" :disabled="busy || loading" @change="goToPage" />
          </section>
        </template>
      </template>
      <template v-else-if="!state.logged">
        <p>Sessão ausente ou encerrada. Entre novamente; nenhuma operação foi repetida.</p>
        <RouterLink class="membership-link" to="/login">Entrar novamente</RouterLink>
      </template>
      <p v-else>Esta tela é exclusiva do titular de uma empresa. Nenhum dado empresarial foi solicitado.</p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.btn-profile-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 18px;
  border-radius: 10px;
  border: 1px solid var(--primary);
  background: var(--gradient-primary);
  color: var(--color-on-primary);
  font-size: 0.92rem;
  font-weight: 600;
  text-decoration: none;
  transition: opacity 0.2s ease, transform 0.15s ease, box-shadow 0.2s ease;
  box-shadow: var(--shadow-primary);
}

.btn-profile-link:hover {
  opacity: 0.92;
  transform: translateY(-1px);
}

.btn-profile-link .mdi {
  font-size: 1.1rem;
}
</style>
