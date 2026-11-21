<script setup>
import { computed, onMounted } from 'vue'
import { ROUTE_PATHS } from '@/constants'
import { useTransporteStore } from '@/stores/useTransporteStore'
import { useCompanyModerationStatus } from '@/features/company/composables/useCompanyModerationStatus'
import { useCompanyStats } from '@/features/company/composables/useCompanyStats'
import {
  formatAddress,
  formatCnpjDisplay as formatCNPJDisplay,
  formatOrEmpty as orNotInDb,
} from '@/utils/formatters'
import PageHeader from '@/components/ui/PageHeader.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import StatusBanner from '@/components/ui/StatusBanner.vue'
import SkeletonCard from '@/components/ui/SkeletonCard.vue'
import CompanyStatsChart from '@/features/company/components/CompanyStatsChart.vue'

const store = useTransporteStore()
const {
  auth,
  company: companyData,
  companyLoading,
  loadCompany: fetchCompany,
} = useCompanyModerationStatus({ watchIdentity: false })
const {
  routesToday,
  statsDate,
  serviceSlots,
  statsLoading,
  todayLabel,
  passageirosHoje,
  fetchStats,
} = useCompanyStats()

const ativos = computed(() => store.veiculos.filter((v) => v.status === 'Ativo').length)
const total = computed(() => store.veiculos.length)

const companyInfoItems = computed(() => [
  { label: 'Nome Fantasia', value: orNotInDb(companyData.value?.trade_name) },
  { label: 'Razão Social', value: orNotInDb(companyData.value?.legal_name) },
  { label: 'CNPJ', value: formatCNPJDisplay(companyData.value?.cnpj) },
  { label: 'Endereço', value: formatAddress(companyData.value) },
])

onMounted(async () => {
  await fetchCompany()
  if (companyData.value?.is_approved) {
    fetchStats()
    store.fetchVeiculos()
  }
})
</script>

<template>
  <div class="company-home-page">
    <PageHeader :title="`Gerenciamento: ${companyData?.trade_name || auth.user?.name || ''}`" accent>
      <template #actions>
        <span class="date-pill">{{ todayLabel }}</span>
      </template>
    </PageHeader>

    <StatusBanner
      v-if="companyData && !companyData.is_approved"
      persistent
      :variant="companyData.registration_status === 'rejected' ? 'danger' : 'warning'"
      icon="mdi-clock-outline"
    >
      <strong>
        {{
          companyData.registration_status === 'rejected'
            ? 'Cadastro empresarial recusado'
            : 'Cadastro empresarial em análise'
        }}
      </strong>
      <p class="moderation-copy">
        <template v-if="companyData.registration_status === 'rejected'">
          A moderação da plataforma não aprovou o cadastro da empresa. Revise seus dados e documentos no perfil ou contate o suporte.
        </template>
        <template v-else>
          Sua conta empresarial está ativa, mas aguarda aprovação da moderação. Enquanto estiver pendente, a empresa não aparece na busca pública e o gerenciamento permanece bloqueado.
        </template>
      </p>
      <RouterLink :to="ROUTE_PATHS.USER" class="moderation-link">Revisar dados e documentos</RouterLink>
    </StatusBanner>

    <BaseCard title="Dados da Empresa">
      <template v-if="companyData" #actions>
        <span class="approval-badge" :class="{ approved: companyData.is_approved }">
          {{ companyData.is_approved ? 'Aprovada' : 'Pendente' }}
        </span>
      </template>

      <Transition name="fade-slide" mode="out-in">
        <SkeletonCard v-if="companyLoading" key="loading" :count="1" :lines="3" />
        <dl v-else key="content" class="info-grid">
          <div v-for="item in companyInfoItems" :key="item.label" class="info-item">
            <dt class="info-label">{{ item.label }}</dt>
            <dd class="info-value">{{ item.value }}</dd>
          </div>
        </dl>
      </Transition>
    </BaseCard>

    <template v-if="!companyData || companyData.is_approved">
      <div class="stats-grid">
        <div class="stat-card">
          <span class="mdi mdi-account-group stat-icon" aria-hidden="true"></span>
          <div>
            <span class="stat-label">Passageiros Hoje</span>
            <p class="stat-value">{{ passageirosHoje }}</p>
          </div>
        </div>

        <div class="stat-card">
          <span class="mdi mdi-map-marker-path stat-icon" aria-hidden="true"></span>
          <div>
            <span class="stat-label">Rotas Hoje</span>
            <p class="stat-value">{{ routesToday ?? '—' }}</p>
          </div>
        </div>

        <div class="stat-card stat-wide">
          <span class="mdi mdi-van-passenger stat-icon" aria-hidden="true"></span>
          <div>
            <span class="stat-label">Transportes Ativos</span>
            <p class="stat-value">{{ ativos }} / {{ total }}</p>
          </div>
        </div>
      </div>

      <CompanyStatsChart
        :service-slots="serviceSlots"
        :date-label="statsDate || todayLabel"
        :loading="statsLoading"
      />
    </template>
  </div>
</template>

<style lang="scss" scoped>
.company-home-page {
  @include section-container(120px);
}

.date-pill {
  padding: $space-1 $space-3;
  border-radius: $radius-pill;
  background: var(--color-primary-soft);
  color: var(--primary);
  font-size: $text-sm;
  font-weight: $font-bold;
}

.moderation-copy {
  margin: $space-1 0 $space-2;
  font-size: $text-sm;
  color: var(--text-muted);
}

.moderation-link {
  color: var(--primary);
  font-weight: $font-semibold;
  font-size: $text-sm;

  &:hover {
    text-decoration: underline;
  }
}

.approval-badge {
  padding: $space-1 $space-3;
  border-radius: $radius-pill;
  font-size: $text-xs;
  font-weight: $font-bold;
  background: var(--warning-soft);
  color: var(--warning);

  &.approved {
    background: var(--success-soft);
    color: var(--success);
  }
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: $space-3;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.info-label {
  font-size: $text-xs;
  font-weight: $font-semibold;
  color: var(--primary);
}

.info-value {
  font-size: $text-md;
  color: var(--text);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: $space-3;
}

.stat-card {
  @include surface-card($space-4, $radius-lg);
  display: flex;
  align-items: center;
  gap: $space-3;
  transition:
    transform $duration-normal $ease-fluid,
    box-shadow $duration-normal $ease-fluid,
    outline-color $duration-normal $ease-fluid;

  &:hover {
    transform: translateY(-2px);
    outline-color: var(--border-primary);
  }

  &.stat-wide {
    grid-column: 1 / -1;
  }
}

.stat-icon {
  font-size: 2rem;
  color: var(--primary);
}

.stat-label {
  font-size: $text-xs;
  font-weight: $font-semibold;
  color: var(--text-muted);
}

.stat-value {
  font-size: 1.4rem;
  font-weight: $font-extrabold;
  color: var(--text);
}
</style>
