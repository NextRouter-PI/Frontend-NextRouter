<script setup>
import { computed, ref, useTemplateRef, watch } from 'vue'
import { useCompanyModerationStatus } from '@/features/company/composables/useCompanyModerationStatus'
import { useMemberships } from '@/features/memberships/composables/useMemberships'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import ErrorMessage from '@/components/ui/ErrorMessage.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import CompanyMembershipList from '@/features/company/components/CompanyMembershipList.vue'
import SkeletonCard from '@/components/ui/SkeletonCard.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import '@/styles/memberships.scss'

const status = ref('pending')
const nameFilter = ref('')
const busyRef = ref(false)
const listRef = useTemplateRef('membershipList')

const {
  auth,
  company,
  companyLoading,
  companyError,
  approved,
  moderationLabel,
  loadCompany,
} = useCompanyModerationStatus({
  canLoad: () => !busyRef.value,
  onIdentityReset: () => {
    listRef.value?.resetDecision()
    nameFilter.value = ''
    status.value = 'pending'
  },
})

const scope = computed(() =>
  auth.logged && auth.role === 'company' && approved.value ? { company: company.value.id } : null,
)
const {
  records, page, totalPages, loading, busy, ready, error, notice, goToPage, transition,
} = useMemberships(scope, status)
watch(busy, (val) => {
  busyRef.value = val
}, { immediate: true, flush: 'sync' })
</script>

<template>
  <div class="membership-workspace" :class="{ authenticated: auth.logged }">
    <div class="membership-content">
      <PageHeader
        title="Usuários e vínculos"
        subtitle="Aprovar um vínculo não aprova a conta empresarial, não atribui grupo e não publica viagens."
      >
        <template v-if="auth.role === 'company'" #actions>
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
      <template v-if="auth.role === 'company'">
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
          <CompanyMembershipList
            v-else-if="ready"
            ref="membershipList"
            :records="records"
            :name-filter="nameFilter"
            :page="page"
            :total-pages="totalPages"
            :busy="busy"
            :loading="loading"
            :ready="ready"
            :transition="transition"
            @page-change="goToPage"
          />
        </template>
      </template>
      <template v-else-if="!auth.logged">
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
