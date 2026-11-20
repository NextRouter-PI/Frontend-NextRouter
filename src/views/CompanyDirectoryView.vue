<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { state } from '@/stores/state'
import { useCompanyDirectory } from '@/composables/useCompanyDirectory'
import ThemeButton from '@/components/buttons/ThemeButton.vue'
import CompanyFilterDropdown from '@/components/directory/CompanyFilterDropdown.vue'
import CompanyResultCard from '@/components/directory/CompanyResultCard.vue'
import ErrorMessage from '@/components/ui/ErrorMessage.vue'
import PageNavigation from '@/components/ui/PageNavigation.vue'
import Logo from '@/assets/images/logo.png'
import '@/assets/css/memberships.css'

const router = useRouter()
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

const personal = computed(() => ['passenger', 'driver'].includes(state.role))

function goBack() {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push(state.logged ? '/' : '/login')
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
  <div class="directory-page" :class="{ authenticated: state.logged }">
    <header v-if="!state.logged" class="public-header">
      <RouterLink to="/login" class="public-logo">
        <img :src="Logo" alt="NextRouter" />
      </RouterLink>
      <ThemeButton />
    </header>

    <div class="directory-container">
      <div class="title-bar">
        <button type="button" class="back-btn" aria-label="Voltar" @click="goBack">
          <span class="mdi mdi-chevron-left" aria-hidden="true"></span>
        </button>
        <h1 class="page-title">Escolha de Empresa</h1>
        <span class="title-spacer" aria-hidden="true"></span>
      </div>

      <p class="page-subtitle">
        Busque pelo grupo de rota que atende você para encontrar uma empresa:
      </p>

      <form class="search-row" @submit.prevent="search">
        <div class="search-input-wrap">
          <button
            type="submit"
            class="search-icon-btn"
            aria-label="Pesquisar grupo de rota"
            :disabled="loading"
          >
            <span class="mdi mdi-magnify" aria-hidden="true"></span>
          </button>
          <input
            v-model="filters.destination"
            type="search"
            class="search-input"
            placeholder="Buscar grupo de rota..."
            aria-label="Nome do grupo de rota"
            autocomplete="off"
          />
        </div>

        <CompanyFilterDropdown
          v-model:state="filters.state"
          v-model:city="filters.city"
          v-model:ordering="filters.ordering"
          :served-cities="servedCities"
          :cities-loading="citiesLoading"
          :cities-error="citiesError"
          :active-filter-count="activeFilterCount"
          :disabled="loading"
          @apply="search"
          @clear="clearFilters"
        />
      </form>

      <div v-if="filters.state || filters.city" class="active-chips" aria-label="Filtros aplicados">
        <button v-if="filters.state" type="button" class="filter-chip" @click="removeStateFilter">
          UF: {{ filters.state }}
          <span class="mdi mdi-close" aria-hidden="true"></span>
        </button>
        <button v-if="filters.city" type="button" class="filter-chip" @click="removeCityFilter">
          Cidade: {{ filters.city }}
          <span class="mdi mdi-close" aria-hidden="true"></span>
        </button>
      </div>

      <p v-if="validationError" class="validation-hint" role="alert">{{ validationError }}</p>
      <div role="alert"><ErrorMessage :message="error" /></div>

      <Transition name="fade-slide" mode="out-in">
        <p v-if="loading" key="loading" class="status-text" role="status">Pesquisando empresas...</p>

        <section v-else-if="searched && !error" key="results" aria-label="Resultados da busca">
          <div v-if="!results.length" class="empty-state" role="status">
            <span class="mdi mdi-map-search-outline empty-icon" aria-hidden="true"></span>
            <p class="empty-title">Nenhuma empresa encontrada para este grupo.</p>
            <p class="empty-hint">Verifique o nome do grupo de rota ou ajuste o filtro de estado e cidade.</p>
          </div>
          <div v-else class="results-list">
            <CompanyResultCard
              v-for="company in results"
              :key="company.id"
              :company="company"
              :logged="state.logged"
              :can-request-membership="personal"
            />
          </div>
          <PageNavigation :page="page" :total-pages="totalPages" :disabled="loading" @change="goToPage" />
        </section>

        <div v-else-if="!searched" key="idle" class="empty-state">
          <span class="mdi mdi-routes empty-icon" aria-hidden="true"></span>
          <p class="empty-title">Procure pelo nome do grupo de rota</p>
          <p class="empty-hint">
            Digite o nome do grupo de rota que você precisa ou filtre por estado e cidade na caixa de seleção ao lado.
          </p>
        </div>
      </Transition>

      <nav class="context-links" aria-label="Atalhos da conta">
        <RouterLink v-if="state.logged && personal" to="/vinculos" class="context-link">
          Meus vínculos
        </RouterLink>
        <RouterLink v-else-if="state.logged && state.role === 'company'" to="/usuarios" class="context-link">
          Gerenciar pedidos de vínculo
        </RouterLink>
        <template v-else-if="!state.logged">
          <RouterLink to="/login" class="context-link">Entrar</RouterLink>
          <RouterLink to="/signup" class="context-link">Criar conta</RouterLink>
        </template>
      </nav>
    </div>
  </div>
</template>

<style scoped>
.directory-page {
  min-height: 100vh;
  background: var(--bg);
  color: var(--text);
  padding-bottom: 96px;
}

.public-header {
  position: sticky;
  top: 0;
  z-index: 40;
  height: var(--header-height);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  background: var(--chrome-bg);
  border-bottom: 2px solid var(--primary);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.22);
}

.public-logo img {
  height: 36px;
  width: auto;
  display: block;
}

.directory-container {
  width: 100%;
  max-width: 680px;
  margin: 0 auto;
  padding: 16px 16px 24px;
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
}

.back-btn:hover {
  background: var(--altbg);
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

.search-row {
  display: flex;
  align-items: stretch;
  gap: 8px;
  margin-bottom: 12px;
}

.search-input-wrap {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  min-height: 46px;
  padding: 0 10px 0 4px;
  border: 1.5px solid var(--border-primary);
  border-radius: 10px;
  background: var(--superfice);
  transition: box-shadow 0.2s ease;
}

.search-input-wrap:focus-within {
  box-shadow: 0 0 0 3px rgba(223, 128, 26, 0.15);
}

.search-icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border: none;
  background: transparent;
  color: var(--text-muted);
  font-size: 1.35rem;
  cursor: pointer;
  flex-shrink: 0;
}

.search-icon-btn:hover:not(:disabled) {
  color: var(--primary);
}

.search-input {
  flex: 1;
  min-width: 0;
  border: none;
  background: transparent;
  color: var(--text);
  font-size: 0.95rem;
  padding: 8px 4px;
}

.search-input:focus {
  outline: none;
}

.search-input::placeholder {
  color: var(--text-muted);
}

.active-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.filter-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  border: 1px solid var(--border-primary);
  border-radius: 999px;
  background: var(--superfice);
  color: var(--text);
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
}

.validation-hint {
  margin: 0 0 12px;
  padding: 10px 12px;
  border-left: 3px solid var(--primary);
  border-radius: 6px;
  background: var(--superfice);
  font-size: 0.88rem;
  color: var(--text);
}

.status-text {
  margin: 24px 0;
  text-align: center;
  color: var(--text-muted);
  font-size: 0.95rem;
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
  background: var(--superfice);
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
