<script setup>
import { computed, onMounted, shallowRef } from 'vue'
import api from '@/api/client'
import { useRotasStore } from '@/stores/useRotasStore'
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
import StatTile from '@/components/ui/StatTile.vue'
import DonutChart from '@/components/ui/DonutChart.vue'
import BaseButton from '@/components/ui/BaseButton.vue'

const store = useTransporteStore()
const rotas = useRotasStore()
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
const vehiclesLoading = shallowRef(true)
const groupsLoading = shallowRef(true)
const pendingCount = shallowRef(null)

const fleetSegments = computed(() => [
  { label: 'Ativos', value: ativos.value, color: '#22c55e' },
  { label: 'Em manutenção', value: store.veiculos.filter((v) => v.status === 'Manutenção').length, color: '#ec8314' },
  {
    label: 'Outros',
    value: store.veiculos.filter((v) => !['Ativo', 'Manutenção'].includes(v.status)).length,
    color: '#a1a1aa',
  },
])

const memberSegments = computed(() => {
  const active = rotas.vinculosAtivos || []
  return [
    { label: 'Passageiros', value: active.filter((m) => m.passenger).length, color: '#ec8314' },
    { label: 'Motoristas', value: active.filter((m) => m.driver).length, color: '#3b82f6' },
  ]
})

// Grupos com mais passageiros primeiro; a barra compara com o maior grupo.
const groupRanking = computed(() => {
  const list = (rotas.grupos || []).map((g) => ({
    id: g.id,
    name: g.name,
    destination: g.destinationName,
    members: g.members.length,
    services: g.services.length,
  }))
  const max = Math.max(1, ...list.map((g) => g.members))
  return list
    .sort((a, b) => b.members - a.members)
    .slice(0, 5)
    .map((g) => ({ ...g, width: Math.round((g.members / max) * 100) }))
})

const quickActions = [
  { to: ROUTE_PATHS.REGISTER_VEHICLE, icon: 'mdi-bus', title: 'Cadastrar veículo', text: 'Adicione um veículo à frota.' },
  { to: ROUTE_PATHS.REGISTER_ROUTE, icon: 'mdi-map-marker-path', title: 'Novo grupo', text: 'Crie um grupo de atendimento.' },
  { to: ROUTE_PATHS.OPERATIONAL_POINTS, icon: 'mdi-map-marker-radius', title: 'Pontos de destino', text: 'Escolas e campi atendidos.' },
  { to: ROUTE_PATHS.USERS, icon: 'mdi-account-group', title: 'Pedidos de vínculo', text: 'Aprove passageiros e motoristas.' },
]

async function fetchPending() {
  try {
    const { data } = await api.get('/memberships/', {
      params: { company: companyData.value.id, status: 'pending', page: 1, page_size: 1 },
    })
    // Com 1 item por página, o total de páginas é o total de pedidos (sem resultados, é zero).
    pendingCount.value = data.results?.length ? Number(data.total_pages) : 0
  } catch {
    pendingCount.value = null
  }
}

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
    fetchPending()
    store.fetchVeiculos().finally(() => (vehiclesLoading.value = false))
    rotas.fetchRotas().finally(() => (groupsLoading.value = false))
  }
})
</script>

<template>
  <div class="company-home-page">
    <PageHeader
      eyebrow="Painel da empresa"
      icon="mdi-office-building-outline"
      :title="companyData?.trade_name || auth.user?.name || 'Sua empresa'"
      subtitle="Acompanhe passageiros, rotas e frota do dia em um só lugar."
    >
      <template #actions>
        <span class="date-pill"><BaseIcon name="mdi-calendar-outline" /> {{ todayLabel }}</span>
        <BaseButton
          v-if="companyData?.is_approved"
          variant="outline"
          size="sm"
          icon="mdi-plus"
          @click="$router.push(ROUTE_PATHS.REGISTER_ROUTE)"
        >
          Novo grupo
        </BaseButton>
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

    <template v-if="!companyData || companyData.is_approved">
      <section class="stat-grid" aria-label="Números de hoje">
        <StatTile
          icon="mdi-account-group"
          label="Passageiros hoje"
          :value="statsLoading ? null : passageirosHoje"
          :loading="statsLoading"
          hint="Alocados, a bordo e entregues"
        />
        <StatTile
          icon="mdi-map-marker-path"
          label="Rotas hoje"
          :value="routesToday ?? null"
          :loading="statsLoading"
          tone="blue"
          hint="Viagens datadas do dia"
          :to="ROUTE_PATHS.LIST_OPERATIONS"
        />
        <StatTile
          icon="mdi-van-passenger"
          label="Frota ativa"
          :value="vehiclesLoading ? null : ativos"
          :total="vehiclesLoading ? null : total"
          :loading="vehiclesLoading"
          tone="green"
          :to="ROUTE_PATHS.TRANSPORT_FLEET"
        />
        <StatTile
          icon="mdi-account-clock-outline"
          label="Pedidos pendentes"
          :value="pendingCount"
          :loading="pendingCount === null && !companyData"
          tone="gray"
          hint="Vínculos aguardando você"
          :to="ROUTE_PATHS.USERS"
        />
      </section>

      <CompanyStatsChart
        :service-slots="serviceSlots"
        :date-label="statsDate || todayLabel"
        :loading="statsLoading"
      />

      <div class="chart-grid">
        <DonutChart
          title="Frota por situação"
          subtitle="Veículos cadastrados na empresa"
          center-label="veículos"
          :segments="fleetSegments"
          :loading="vehiclesLoading"
          empty-text="Nenhum veículo cadastrado ainda."
        />
        <DonutChart
          title="Vínculos ativos"
          subtitle="Quem já foi aprovado pela empresa"
          center-label="pessoas"
          :segments="memberSegments"
          :loading="groupsLoading"
          empty-text="Nenhum vínculo ativo ainda."
        />
      </div>

      <BaseCard title="Grupos de atendimento" subtitle="Passageiros e serviços habituais em cada grupo">
        <template #actions>
          <RouterLink :to="ROUTE_PATHS.LIST_GROUPS" class="card-link">Ver todos <BaseIcon name="mdi-arrow-right" /></RouterLink>
        </template>
        <SkeletonCard v-if="groupsLoading" :count="2" :lines="1" />
        <p v-else-if="!groupRanking.length" class="muted-empty">Nenhum grupo criado ainda.</p>
        <ul v-else class="group-ranking">
          <li v-for="(g, i) in groupRanking" :key="g.id" :style="{ animationDelay: `${i * 80}ms` }">
            <RouterLink :to="`/routes/${g.id}/edit/settings`" class="group-row">
              <span class="group-rank">{{ i + 1 }}</span>
              <span class="group-info">
                <strong>{{ g.name }}</strong>
                <small>{{ g.destination }}</small>
                <span class="group-bar"><span :style="{ width: `${g.width}%` }"></span></span>
              </span>
              <span class="group-numbers">
                <strong>{{ g.members }}</strong> passageiros
                <small>{{ g.services }} serviços</small>
              </span>
            </RouterLink>
          </li>
        </ul>
      </BaseCard>

      <section class="quick-actions" aria-label="Atalhos">
        <RouterLink v-for="action in quickActions" :key="action.to" :to="action.to" class="quick-action">
          <span class="quick-icon"><BaseIcon :name="action.icon" /></span>
          <strong>{{ action.title }}</strong>
          <small>{{ action.text }}</small>
          <BaseIcon name="mdi-arrow-right" class="quick-arrow" />
        </RouterLink>
      </section>
    </template>

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

  </div>
</template>

<style lang="scss" scoped>
.company-home-page {
  --page-max: #{$container-xl};
  @include section-container(120px);
}

.date-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: $radius-pill;
  background: var(--color-surface);
  outline: 1px solid var(--border);
  color: var(--text);
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
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
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
    transform: translateY(-3px);
    outline-color: var(--border-primary);
    box-shadow: var(--shadow-hover);

    .stat-icon-wrap {
      transform: rotate(-8deg) scale(1.08);
    }
  }
}

.stat-icon-wrap {
  @include flex-center;
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  border-radius: $radius-lg;
  background: var(--gradient-brand);
  box-shadow: var(--shadow-primary);
  transition: transform $duration-slow $ease-spring;
}

.stat-icon {
  font-size: 1.5rem;
  color: var(--color-on-primary);
}

.stat-label {
  font-size: 0.7rem;
  font-weight: $font-bold;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-muted);
}

.stat-value {
  font-size: 1.7rem;
  line-height: 1.15;
  letter-spacing: -0.02em;
  font-weight: $font-extrabold;
  color: var(--text);
}

.card-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--primary-text);
  font-size: $text-sm;
  font-weight: $font-semibold;

  .mdi {
    transition: transform $duration-normal $ease-fluid;
  }

  &:hover .mdi {
    transform: translateX(4px);
  }
}

.muted-empty {
  padding: $space-5;
  text-align: center;
  color: var(--text-muted);
  border: 1.5px dashed var(--border);
  border-radius: $radius-lg;
}

.group-ranking {
  display: flex;
  flex-direction: column;
  gap: $space-2;

  li {
    animation: rise-in $duration-reveal $ease-fluid backwards;
  }
}

.group-row {
  display: grid;
  grid-template-columns: 34px 1fr auto;
  align-items: center;
  gap: $space-3;
  padding: $space-3;
  border-radius: $radius-md;
  color: var(--text);
  transition:
    background-color $duration-normal $ease-fluid,
    transform $duration-normal $ease-fluid;

  &:hover {
    background: var(--color-primary-soft);
    transform: translateX(4px);
  }
}

.group-rank {
  @include flex-center;
  width: 34px;
  height: 34px;
  border-radius: $radius-round;
  background: var(--gradient-brand);
  color: #fff;
  font-weight: $font-extrabold;
}

.group-info {
  display: flex;
  flex-direction: column;
  min-width: 0;

  strong {
    @include truncate;
  }

  small {
    @include truncate;
    color: var(--text-muted);
    font-size: $text-xs;
  }
}

.group-bar {
  display: block;
  height: 6px;
  margin-top: 6px;
  border-radius: $radius-pill;
  background: var(--altbg);
  overflow: hidden;

  span {
    display: block;
    height: 100%;
    border-radius: inherit;
    background: var(--gradient-brand);
    transform-origin: left;
    animation: grow-x 1s $ease-fluid both;
  }
}

@keyframes grow-x {
  from {
    transform: scaleX(0);
  }
}

.group-numbers {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  font-size: $text-xs;
  color: var(--text-muted);

  strong {
    font-size: 1.2rem;
    color: var(--text);
  }
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
  gap: $space-3;
}

.quick-action {
  @include surface-card($space-4, $radius-lg);
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 4px;
  color: var(--text);
  transition:
    transform $duration-slow $ease-fluid,
    box-shadow $duration-slow $ease-fluid,
    outline-color $duration-normal $ease-fluid;

  small {
    color: var(--text-muted);
    font-size: $text-xs;
  }

  &:hover {
    transform: translateY(-3px);
    outline-color: var(--primary);
    box-shadow: var(--shadow-hover);

    .quick-icon {
      background: var(--gradient-brand);
      color: #fff;
      transform: rotate(-8deg) scale(1.08);
    }

    .quick-arrow {
      opacity: 1;
      transform: none;
    }
  }
}

.quick-icon {
  @include flex-center;
  width: 40px;
  height: 40px;
  margin-bottom: $space-2;
  border-radius: $radius-md;
  background: var(--color-primary-soft);
  color: var(--primary);
  font-size: 1.3rem;
  transition:
    background-color $duration-normal $ease-fluid,
    color $duration-normal $ease-fluid,
    transform $duration-slow $ease-spring;
}

.quick-arrow {
  position: absolute;
  top: $space-4;
  right: $space-4;
  color: var(--primary);
  opacity: 0;
  transform: translateX(-6px);
  transition:
    opacity $duration-normal $ease-fluid,
    transform $duration-normal $ease-fluid;
}
</style>
