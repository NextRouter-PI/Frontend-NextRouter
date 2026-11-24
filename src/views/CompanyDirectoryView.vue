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
import PublicShell from '@/components/layout/PublicShell.vue'
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
  <!-- Visitante recebe a moldura pública (com rodapé); logado usa a moldura do app. -->
  <component :is="auth.logged ? 'div' : PublicShell" v-bind="auth.logged ? {} : { wide: true }">
  <div class="directory-page" :class="{ authenticated: auth.logged }">
    <div class="directory-container">
      <div class="title-bar">
        <button type="button" class="back-btn" aria-label="Voltar" @click="goBack">
          <BaseIcon name="mdi-chevron-left" />
        </button>
        <h1 class="page-title">Encontre sua <span>empresa</span></h1>
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
            <span class="empty-badge"><BaseIcon name="mdi-map-search-outline" class="empty-icon" /></span>
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
          <span class="empty-badge"><BaseIcon name="mdi-routes" class="empty-icon" /></span>
          <p class="empty-title">Procure pelo nome do grupo de rota</p>
          <p class="empty-hint">
            Digite o nome do grupo de rota que você precisa ou filtre por estado e cidade no botão ao lado da busca.
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
  </component>
</template>

<style lang="scss" scoped>
.directory-page {
  color: var(--text);

  &.authenticated {
    min-height: 100vh;
    padding-bottom: 96px;
  }
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
  font-size: 1.45rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--text);
  text-align: center;

  span {
    background: var(--gradient-brand);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }
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
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 28px 0;
  padding: 40px 20px;
  border: 1.5px dashed var(--border);
  border-radius: $radius-xl;
  background: var(--color-surface);
  text-align: center;
}

.empty-badge {
  @include flex-center;
  position: relative;
  width: 72px;
  height: 72px;
  margin-bottom: $space-4;
  border-radius: $radius-round;
  background: var(--gradient-brand);
  box-shadow: var(--shadow-primary);
  animation: float-soft 4s ease-in-out infinite;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    border: 2px solid var(--primary);
    animation: pulse-ring 2.4s ease-out infinite;
  }
}

.empty-icon {
  font-size: 34px;
  color: var(--color-on-primary);
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
    font-size: 2rem;
  }
}
</style>
