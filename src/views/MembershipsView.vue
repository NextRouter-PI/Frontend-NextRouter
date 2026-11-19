<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { state } from '@/stores/state'
import { getPublicCompany } from '@/api/companies'
import { useMemberships } from '@/composables/useMemberships'
import { sessionError } from '@/stores/session'
import { formatApiError } from '@/utils/apiErrors'
import BaseButton from '@/components/ui/BaseButton.vue'
import ErrorMessage from '@/components/ui/ErrorMessage.vue'
import PageNavigation from '@/components/ui/PageNavigation.vue'
import MembershipCard from '@/components/memberships/MembershipCard.vue'
import MembershipActionForm from '@/components/memberships/MembershipActionForm.vue'
import '@/assets/css/memberships.css'

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

const selectedCompany = ref(null)
const selectionLoading = ref(false)
const selectionError = ref('')
const withdrawing = ref(false)
const selectedId = computed(() => {
  const value = route.query.company
  return typeof value === 'string' && /^[1-9]\d*$/.test(value) && Number.isSafeInteger(Number(value))
    ? Number(value) : null
})

watch([selectedId, scope], async ([id, identity], _previous, onCleanup) => {
  selectedCompany.value = null
  selectionError.value = ''
  selectionLoading.value = false
  if (!id || !identity) return
  const controller = new AbortController()
  onCleanup(() => controller.abort())
  selectionLoading.value = true
  try {
    const company = await getPublicCompany(id, { signal: controller.signal })
    if (!controller.signal.aborted) selectedCompany.value = company
  } catch (cause) {
    if (!controller.signal.aborted) {
      selectionError.value = sessionError(cause, formatApiError(cause, 'A empresa não está disponível. Volte à busca.'))
    }
  } finally {
    if (!controller.signal.aborted) selectionLoading.value = false
  }
}, { immediate: true })

watch(openMembership, () => { withdrawing.value = false })

function companyName(membership) {
  return openCompany.value?.id === membership.company
    ? openCompany.value.trade_name : `Empresa nº ${membership.company}`
}

async function withdraw(reason) {
  if (await transition(openMembership.value, 'withdraw', reason)) withdrawing.value = false
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
        <p v-if="notice" class="membership-notice" role="status">{{ notice }}</p>
        <div role="alert"><ErrorMessage :message="error" /></div>
        <p v-if="busy" role="status">Processando ação de vínculo e atualizando a consulta...</p>
        <p v-if="loading" role="status">Consultando vínculos...</p>
        <section v-else-if="ready" class="membership-section" aria-label="Situação atual do vínculo">
          <h2>Situação atual</h2>
          <MembershipCard v-if="openMembership" :membership="openMembership" :title="companyName(openMembership)">
            <p v-if="openMembership.status === 'active'">
              A empresa aprovou seu vínculo. Isso não atribui grupo, ponto, serviços ou viagem.
              Não é possível solicitar outra empresa enquanto este vínculo estiver ativo.
            </p>
            <template v-else>
              <p>Aguarde a decisão da empresa ou retire o pedido antes de solicitar outra empresa.</p>
              <BaseButton v-if="!withdrawing" type="button" variant="outline" :disabled="busy" @click="withdrawing = true">Retirar pedido</BaseButton>
              <MembershipActionForm v-else :key="openMembership.id" title="Retirar este pedido de vínculo? Sua conta será preservada."
                :busy="busy" :disabled="!ready" @confirm="withdraw" @cancel="withdrawing = false" />
            </template>
          </MembershipCard>
          <p v-else role="status">Você não tem pedido pendente nem vínculo ativo neste perfil.</p>
        </section>

        <section v-if="route.query.company" class="membership-panel" aria-label="Revisão de solicitação">
          <h2>Revisar solicitação</h2>
          <p v-if="!selectedId">Identificador de empresa inválido. Escolha uma empresa na busca.</p>
          <p v-else-if="selectionLoading" role="status">Consultando a empresa selecionada...</p>
          <div role="alert"><ErrorMessage :message="selectionError" /></div>
          <template v-if="selectedCompany">
            <h3>{{ selectedCompany.trade_name }} · empresa nº {{ selectedCompany.id }}</h3>
            <p>Enviar como {{ state.role === 'driver' ? 'motorista' : 'passageiro' }}. O pedido depende da decisão da empresa e não altera sua conta.</p>
            <BaseButton type="button" :disabled="!canRequest || selectionLoading" :loading="busy" @click="request(selectedCompany.id)">Enviar pedido de vínculo</BaseButton>
            <p v-if="ready && openMembership">Já existe um pedido pendente ou vínculo ativo. Nenhuma troca automática será realizada.</p>
          </template>
        </section>

        <section v-if="ready" class="membership-section" aria-label="Histórico de vínculos">
          <h2>Pedidos e vínculos</h2>
          <p>O histórico usa o identificador da empresa quando seu nome público não está disponível.</p>
          <p v-if="!records.length">Nenhum pedido registrado neste perfil.</p>
          <div class="membership-list">
            <MembershipCard v-for="membership in records" :key="membership.id" :membership="membership" :title="companyName(membership)" />
          </div>
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
