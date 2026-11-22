<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/useAuthStore'
import { PERSONAL_ROLES, ROUTE_PATHS } from '@/constants'
import { useCompanyDirectory } from '@/features/directory/composables/useCompanyDirectory'
import CompanySearchToolbar from '@/features/directory/components/CompanySearchToolbar.vue'
import CompanyResultCard from '@/features/directory/components/CompanyResultCard.vue'
import ErrorMessage from '@/components/ui/ErrorMessage.vue'
import PageNavigation from '@/components/ui/PageNavigation.vue'
import SkeletonCard from '@/components/ui/SkeletonCard.vue'
import '@/styles/memberships.scss'

const router = useRouter()
const auth = useAuthStore()
const {
  filters,
  results,
  loading,
  searched,
  error,
  validationError,
  page,
  totalPages,
  servedCities,
  citiesLoading,
  citiesError,
  activeFilterCount,
  search,
  clearFilters,
  goToPage,
} = useCompanyDirectory()

const personal = computed(() => PERSONAL_ROLES.includes(auth.role))

function goBack() {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push(auth.logged ? ROUTE_PATHS.HOME : ROUTE_PATHS.LOGIN)
  }
}

function removeStateFilter() {
  filters.state = ''
  filters.city = ''
  if (filters.destination.trim()) search()
}

function removeCityFilter() {
  filters.city = ''
  if (filters.destination.trim() || filters.state) search()
}
</script>

<template>
  <div class="directory-page" :class="{ authenticated: auth.logged }">
    <div class="directory-container">
      <div class="title-bar">
        <button type="button" class="back-btn" aria-label="Voltar" @click="goBack">
          <BaseIcon name="mdi-chevron-left" />
        </button>
        <h1 class="page-title">Escolha de Empresa</h1>
        <span class="title-spacer" aria-hidden="true"></span>
      </div>

      <p class="page-subtitle">
        Busque pelo grupo de rota que atende você para encontrar uma empresa:
      </p>

      <CompanySearchToolbar
        v-model:destination="filters.destination"
        v-model:state="filters.state"
        v-model:city="filters.city"
        v-model:ordering="filters.ordering"
        :served-cities="servedCities"
        :cities-loading="citiesLoading"
        :cities-error="citiesError"
        :active-filter-count="activeFilterCount"
        :disabled="loading"
        @search="search"
        @clear="clearFilters"
        @remove-state="removeStateFilter"
        @remove-city="removeCityFilter"
      />

      <p v-if="validationError" class="validation-hint" role="alert">{{ validationError }}</p>
      <div role="alert"><ErrorMessage :message="error" /></div>

      <Transition name="fade-slide" mode="out-in">
        <SkeletonCard v-if="loading" key="loading" :count="3" avatar />

        <section v-else-if="searched && !error" key="results" aria-label="Resultados da busca">
          <div v-if="!results.length" class="empty-state" role="status">
            <BaseIcon name="mdi-map-search-outline" class="empty-icon" />
            <p class="empty-title">Nenhuma empresa encontrada para este grupo.</p>
            <p class="empty-hint">Verifique o nome do grupo de rota ou ajuste o filtro de estado e cidade.</p>
          </div>
          <TransitionGroup v-else name="list-stagger" tag="div" class="results-list">
            <CompanyResultCard
              v-for="company in results"
              :key="company.id"
              :company="company"
              :logged="auth.logged"
              :can-request-membership="personal"
            />
          </TransitionGroup>
          <PageNavigation :page="page" :total-pages="totalPages" :disabled="loading" @change="goToPage" />
        </section>

        <div v-else-if="!searched" key="idle" class="empty-state">
          <BaseIcon name="mdi-routes" class="empty-icon" />
          <p class="empty-title">Procure pelo nome do grupo de rota</p>
          <p class="empty-hint">
            Digite o nome do grupo de rota que você precisa ou filtre por estado e cidade na caixa de seleção ao lado.
          </p>
        </div>
      </Transition>

      <nav class="context-links" aria-label="Atalhos da conta">
        <RouterLink v-if="auth.logged && personal" to="/memberships" class="context-link">
          Meus vínculos
        </RouterLink>
        <RouterLink v-else-if="auth.logged && auth.role === 'company'" to="/users" class="context-link">
          Gerenciar pedidos de vínculo
        </RouterLink>
        <template v-else-if="!auth.logged">
          <RouterLink to="/login" class="context-link">Entrar</RouterLink>
          <RouterLink to="/signup" class="context-link">Criar conta</RouterLink>
        </template>
      </nav>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.directory-page {
  min-height: 100vh;
  background: var(--bg);
  color: var(--text);
  padding-bottom: 96px;
}

.directory-container {
  @include section-container(120px);
  display: block;
}

.title-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 10px;
  background: transparent;
  color: var(--text);
  font-size: 1.9rem;
  cursor: pointer;

  &:hover {
    background: var(--altbg);
  }
}

.page-title {
  margin: 0;
  font-size: 1.35rem;
  font-weight: 700;
  color: var(--primary);
  text-align: center;
}

.title-spacer {
  width: 40px;
}

.page-subtitle {
  margin: 0 0 16px;
  font-size: 0.98rem;
  line-height: 1.45;
  color: var(--text);
}

.validation-hint {
  position: relative;
  overflow: hidden;
  margin: 0 0 12px;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--color-surface);
  font-size: 0.88rem;
  color: var(--text);
}

.results-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin: 16px 0;
}

.empty-state {
  margin: 28px 0;
  padding: 24px 16px;
  border: 1px dashed var(--border);
  border-radius: 12px;
  background: var(--color-surface);
  text-align: center;
}

.empty-icon {
  font-size: 42px;
  color: var(--primary);
  display: block;
  margin-bottom: 8px;
}

.empty-title {
  margin: 0 0 6px;
  font-size: 1rem;
  font-weight: 700;
  color: var(--text);
}

.empty-hint {
  margin: 0;
  font-size: 0.88rem;
  line-height: 1.45;
  color: var(--text-muted);
}

.context-links {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 16px;
  margin-top: 24px;
}

.context-link {
  color: var(--primary);
  font-size: 0.9rem;
  font-weight: 600;
  text-decoration: none;
}

@media (min-width: 768px) {
  .directory-container {
    padding: 28px 24px 40px;
  }

  .page-title {
    font-size: 1.6rem;
  }
}
</style>
