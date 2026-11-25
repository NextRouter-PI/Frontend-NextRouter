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
import ThemeButton from '@/components/ui/ThemeButton.vue'
import BrandLogo from '@/components/ui/BrandLogo.vue'
import AuthPhotoPanel from '@/components/layout/AuthPhotoPanel.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import photoSmall from '@/assets/images/banner-panoramico-900.webp'
import photoLarge from '@/assets/images/banner-panoramico-1914.webp'
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

// Voltar leva sempre a um destino conhecido: history.length conta páginas de fora do app
// (ou a própria busca), e router.back() às vezes não saía do lugar.
function goBack() {
  router.push(auth.logged ? ROUTE_PATHS.HOME : ROUTE_PATHS.LOGIN)
}

// Passo a passo mostrado antes da primeira busca.
const STEPS = [
  { icon: 'mdi-magnify', title: 'Busque o grupo', text: 'Digite o nome do grupo de rota, como a escola ou o campus.' },
  { icon: 'mdi-domain', title: 'Veja a empresa', text: 'Confira quem faz o trajeto, a cidade e os grupos atendidos.' },
  { icon: 'mdi-account-check-outline', title: 'Peça seu vínculo', text: 'Com a conta criada, peça para entrar no grupo da empresa.' },
]

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
  <!-- Visitante: tela dividida como o login (foto à esquerda). Logado: cabeçalho padrão do app. -->
  <component :is="auth.logged ? 'div' : PublicShell" v-bind="auth.logged ? {} : { fullBleed: true }">
    <div class="directory-page" :class="{ authenticated: auth.logged }">
      <AuthPhotoPanel
        v-if="!auth.logged"
        class="directory-photo"
        :small="photoSmall"
        :large="photoLarge"
        position="center 60%"
        :slides="[
          { quote: 'Encontre quem faz o seu trajeto.', highlight: 'seu trajeto', caption: 'Empresas de transporte escolar e universitário perto de você.' },
          { quote: 'Busque pela escola ou campus.', highlight: 'escola ou campus', caption: 'Digite o grupo de rota e veja quem atende.' },
        ]"
        :features="[
          { icon: 'mdi-map-marker-path', text: 'Rotas em tempo real' },
          { icon: 'mdi-check-circle-outline', text: 'Confirmação de embarque' },
          { icon: 'mdi-bell-ring-outline', text: 'Avisos no celular' },
        ]"
      />

      <section class="directory-main">
        <PageHeader
          v-if="auth.logged"
          title="Encontre sua empresa"
          highlight="empresa"
          eyebrow="Empresas de transporte"
          icon="mdi-map-marker-radius"
          subtitle="Busque pelo grupo de rota que atende você e encontre a empresa que faz o seu trajeto."
        />

        <header v-else class="directory-head">
          <div class="head-bar">
            <button type="button" class="back-btn" @click="goBack">
              <BaseIcon name="mdi-arrow-left" /> Voltar
            </button>
            <ThemeButton />
          </div>
          <RouterLink to="/login" class="head-logo" aria-label="NextRouter - Entrar">
            <BrandLogo spin="always" />
          </RouterLink>
          <p class="head-eyebrow"><BaseIcon name="mdi-map-marker-radius" /> Empresas de transporte</p>
          <h1 class="head-title">Encontre sua <span>empresa</span></h1>
          <p class="head-subtitle">
            Busque pelo grupo de rota que atende você e descubra a empresa que faz o seu trajeto.
          </p>
        </header>

        <div class="directory-body">
          <div class="search-card">
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
          </div>

          <p v-if="validationError" class="validation-hint" role="alert">{{ validationError }}</p>
          <div role="alert"><ErrorMessage :message="error" /></div>

          <Transition name="fade-slide" mode="out-in">
            <SkeletonCard v-if="loading" key="loading" :count="3" avatar />

            <section v-else-if="searched && !error" key="results" aria-label="Resultados da busca">
              <div v-if="!results.length" class="empty-state" role="status">
                <span class="empty-badge"><BaseIcon name="mdi-map-search-outline" /></span>
                <p class="empty-title">Nenhuma empresa encontrada para este grupo.</p>
                <p class="empty-hint">Verifique o nome do grupo de rota ou ajuste o filtro de estado e cidade.</p>
              </div>
              <template v-else>
                <p class="results-count">
                  <strong>{{ results.length }}</strong>
                  {{ results.length === 1 ? 'empresa encontrada' : 'empresas encontradas' }}
                </p>
                <TransitionGroup name="list-stagger" tag="div" class="results-list">
                  <CompanyResultCard
                    v-for="company in results"
                    :key="company.id"
                    :company="company"
                    :logged="auth.logged"
                    :can-request-membership="personal"
                  />
                </TransitionGroup>
              </template>
              <PageNavigation :page="page" :total-pages="totalPages" :disabled="loading" @change="goToPage" />
            </section>

            <ol v-else-if="!searched" key="idle" class="how-steps" aria-label="Como funciona">
              <li v-for="(step, i) in STEPS" :key="step.title" class="how-step" :style="{ '--i': i }">
                <span class="how-icon"><BaseIcon :name="step.icon" /></span>
                <span class="how-number">{{ i + 1 }}</span>
                <strong>{{ step.title }}</strong>
                <small>{{ step.text }}</small>
              </li>
            </ol>
          </Transition>

          <nav class="context-links" aria-label="Atalhos da conta">
            <RouterLink v-if="auth.logged && personal" to="/memberships" class="context-link">
              Meus vínculos <BaseIcon name="mdi-arrow-right" />
            </RouterLink>
            <RouterLink v-else-if="auth.logged && auth.role === 'company'" to="/users" class="context-link">
              Gerenciar pedidos de vínculo <BaseIcon name="mdi-arrow-right" />
            </RouterLink>
            <template v-else-if="!auth.logged">
              <span class="context-text">Já faz parte?</span>
              <RouterLink to="/login" class="context-link">Entrar</RouterLink>
              <span class="context-dot" aria-hidden="true"></span>
              <RouterLink to="/signup" class="context-link">Criar conta</RouterLink>
            </template>
          </nav>
        </div>
      </section>
    </div>
  </component>
</template>

<style lang="scss" scoped>
.directory-page {
  color: var(--text);

  &:not(.authenticated) {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    min-height: 100dvh;

    @include from($bp-desktop + 1px) {
      flex-direction: row;
    }
  }

  &.authenticated {
    min-height: 100vh;
    padding-bottom: 96px;
  }
}

// Foto presa ao lado enquanto a lista rola.
.directory-photo {
  @include from($bp-desktop + 1px) {
    flex-basis: 55%;
    position: sticky;
    top: 0;
    height: 100vh;
    height: 100dvh;
  }
}

.directory-main {
  flex: 1;
  min-width: 0;

  .directory-page:not(.authenticated) & {
    padding: $space-5 $space-4 $space-10;

    @include from($bp-md) {
      padding: $space-6 $space-8 $space-12;
    }
  }
}

.directory-head,
.directory-body {
  width: 100%;
  max-width: 720px;
  margin: 0 auto;
}

.authenticated .directory-body {
  @include section-container(120px);
  display: block;
}

.directory-head {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  animation: rise-in $duration-reveal $ease-fluid backwards;
}

.head-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  margin-bottom: $space-4;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px 8px 10px;
  border-radius: $radius-pill;
  border: 1px solid var(--border);
  background: var(--color-surface);
  color: var(--text);
  font-size: $text-sm;
  font-weight: $font-semibold;
  transition:
    border-color $duration-normal $ease-fluid,
    color $duration-normal $ease-fluid,
    transform $duration-normal $ease-fluid;

  &:hover {
    border-color: var(--primary);
    color: var(--primary-text);
    transform: translateX(-2px);
  }
}

.head-logo {
  --wheel-speed: 2.4s;
  display: inline-block;
  width: 108px;

  @include from($bp-md) {
    width: 128px;
  }

  :deep(.brand-logo) {
    width: 100%;
  }
}

.head-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: $space-4;
  padding: 5px 12px;
  border-radius: $radius-pill;
  background: var(--color-primary-soft);
  border: 1px solid var(--color-primary-tint);
  color: var(--primary-text);
  font-size: 0.7rem;
  font-weight: $font-bold;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.head-title {
  margin-top: $space-3;
  font-size: clamp(2rem, 1.5rem + 1.8vw, 2.9rem);
  font-weight: $font-extrabold;
  line-height: 1.06;
  letter-spacing: -0.03em;

  span {
    color: var(--primary);
  }
}

.head-subtitle {
  max-width: 46ch;
  margin-top: $space-2;
  color: var(--text-muted);
  font-size: $text-md;
  line-height: 1.55;
}

.search-card {
  position: relative;
  z-index: 2;
  margin: $space-6 0 $space-5;
  padding: $space-4;
  border-radius: $radius-xl;
  background: var(--color-surface);
  outline: 1px solid var(--border);
  outline-offset: -1px;
  box-shadow: var(--shadow-hover);
  animation: rise-in $duration-reveal $ease-fluid 0.15s backwards;

  @include from($bp-md) {
    padding: $space-5;
  }

  .authenticated & {
    margin-top: 0;
  }
}

.validation-hint {
  margin: 0 0 12px;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--color-surface);
  font-size: 0.88rem;
}

.results-count {
  margin: $space-2 0 0;
  color: var(--text-muted);
  font-size: $text-sm;

  strong {
    color: var(--primary-text);
  }
}

.results-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin: 12px 0 16px;
}

// Como funciona: três passos com número e ícone.
.how-steps {
  display: grid;
  gap: $space-3;
  margin: 0;
  padding: 0;
  list-style: none;

  @include from($bp-md) {
    grid-template-columns: repeat(3, 1fr);
  }
}

.how-step {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: $space-4;
  border-radius: $radius-lg;
  background: var(--color-surface);
  outline: 1px solid var(--border);
  outline-offset: -1px;
  animation: rise-in $duration-reveal $ease-fluid backwards;
  animation-delay: calc(var(--i) * 90ms + 250ms);
  transition:
    transform $duration-slow $ease-fluid,
    outline-color $duration-normal $ease-fluid;

  &:hover {
    transform: translateY(-3px);
    outline-color: var(--primary);
  }

  strong {
    margin-top: $space-2;
    font-size: $text-md;
  }

  small {
    color: var(--text-muted);
    font-size: $text-sm;
    line-height: 1.45;
  }
}

.how-step:hover .how-icon {
  transform: none;
}

.how-icon {
  @include flex-center;
  transition: transform 0.45s $ease-spring;
  width: 42px;
  height: 42px;
  border-radius: $radius-md;
  background: var(--gradient-brand);
  color: #fff;
  font-size: 1.3rem;
}

.how-number {
  position: absolute;
  top: $space-3;
  right: $space-4;
  color: var(--border);
  font-size: 2rem;
  font-weight: $font-extrabold;
  line-height: 1;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 12px 0 28px;
  padding: 36px 20px;
  border: 1.5px dashed var(--border);
  border-radius: $radius-xl;
  background: var(--color-surface);
  text-align: center;
}

.empty-badge {
  @include flex-center;
  width: 64px;
  height: 64px;
  margin-bottom: $space-3;
  border-radius: $radius-round;
  background: var(--gradient-brand);
  color: #fff;
  font-size: 30px;
}

.empty-title {
  margin: 0 0 6px;
  font-weight: 700;
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
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-top: $space-6;
}

.context-text {
  color: var(--text-muted);
  font-size: 0.9rem;
}

.context-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--border);
}

.context-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--primary-text);
  font-size: 0.9rem;
  font-weight: 700;
  text-decoration: none;
  background: linear-gradient(currentColor, currentColor) 0 100% / 0 2px no-repeat;
  transition: background-size $duration-normal $ease-fluid;

  &:hover {
    background-size: 100% 2px;
  }
}
</style>
