<script setup>
import { computed } from 'vue'
import { state } from '@/stores/state'
import { useCompanyDirectory } from '@/composables/useCompanyDirectory'
import AuthBranding from '@/components/ui/AuthBranding.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import FormField from '@/components/ui/FormField.vue'
import ErrorMessage from '@/components/ui/ErrorMessage.vue'
import PageNavigation from '@/components/ui/PageNavigation.vue'
import '@/assets/css/memberships.css'

const { filters, results, loading, searched, error, page, totalPages, search, goToPage } = useCompanyDirectory()
const personal = computed(() => ['passenger', 'driver'].includes(state.role))
</script>

<template>
  <div class="membership-workspace" :class="{ authenticated: state.logged }">
    <div class="membership-content">
      <AuthBranding v-if="!state.logged" />
      <h1 class="membership-heading">Encontre uma empresa</h1>
      <p>A busca é pública. Criar uma conta ou escolher uma empresa não envia um pedido de vínculo.</p>
      <div class="membership-actions">
        <RouterLink v-if="state.logged && personal" to="/vinculos">Meus vínculos</RouterLink>
        <RouterLink v-else-if="state.logged && state.role === 'company'" to="/usuarios">Gerenciar pedidos de vínculo</RouterLink>
        <template v-else-if="!state.logged">
          <RouterLink to="/login">Entrar</RouterLink>
          <RouterLink to="/signup">Criar conta</RouterLink>
        </template>
      </div>

      <form class="membership-panel" @submit.prevent="search">
        <FormField v-model="filters.trade_name" label="Nome da empresa" />
        <div class="directory-region">
          <FormField v-model="filters.city" label="Cidade atendida (nome completo)" />
          <FormField v-model="filters.state" label="UF atendida" :maxlength="2" />
        </div>
        <FormField v-model="filters.destination" label="Nome do grupo ou destino" />
        <p>Os filtros de cidade e UF consultam destinos atendidos, não o endereço cadastral da empresa.</p>
        <BaseButton type="submit" :loading="loading" icon="mdi-magnify">Pesquisar</BaseButton>
      </form>

      <div role="alert"><ErrorMessage :message="error" /></div>
      <p v-if="loading" role="status">Pesquisando empresas...</p>
      <section v-else-if="searched && !error" aria-label="Resultados da busca">
        <p>Resultados da última busca enviada. Após alterar os filtros, clique em Pesquisar.</p>
        <p v-if="!results.length" role="status">Nenhuma empresa encontrada. Revise ou remova os filtros.</p>
        <div v-else class="membership-list">
          <article v-for="company in results" :key="company.id" class="directory-card">
            <h2>{{ company.trade_name }}</h2>
            <p>Empresa nº {{ company.id }} · disponível para receber pedidos</p>
            <p v-if="company.city || company.state">Cidade cadastral: {{ [company.city, company.state].filter(Boolean).join(' / ') }}</p>
            <p>O atendimento é filtrado pelo servidor. Endereços operacionais, contatos privados e documentos não são apresentados nesta busca.</p>
            <div class="membership-actions">
              <RouterLink v-if="state.logged && personal" :to="{ name: 'vinculos', query: { company: company.id } }">
                Revisar pedido de vínculo
              </RouterLink>
              <RouterLink v-else-if="!state.logged" :to="{ name: 'login', query: { company: company.id } }">
                Entrar para solicitar vínculo
              </RouterLink>
              <p v-else>Somente uma conta com perfil de passageiro ou motorista pode solicitar vínculo.</p>
            </div>
          </article>
        </div>
        <PageNavigation :page="page" :total-pages="totalPages" :disabled="loading" @change="goToPage" />
      </section>
      <p v-else-if="!searched">Informe os filtros desejados ou pesquise sem filtros para consultar as empresas disponíveis.</p>
    </div>
  </div>
</template>

<style scoped>
.directory-region { display: grid; grid-template-columns: minmax(0, 1fr) 130px; gap: 16px; }
.directory-card {
  background: var(--superfice);
  border: 1px solid var(--border-primary);
  border-radius: 12px;
  padding: 20px;
  overflow-wrap: anywhere;
}
.directory-card h2 { color: var(--primary); margin: 0; font-size: 1.2rem; }
@media (max-width: 420px) { .directory-region { grid-template-columns: minmax(0, 1fr); gap: 0; } }
</style>
