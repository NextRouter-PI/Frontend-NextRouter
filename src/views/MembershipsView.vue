<script setup>
import { computed, shallowRef, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/useAuthStore'
import { useMemberships } from '@/features/memberships/composables/useMemberships'
import { useMembershipCompanyPreview } from '@/features/memberships/composables/useMembershipCompanyPreview'
import { useToast } from '@/composables/useToast'
import BaseButton from '@/components/ui/BaseButton.vue'
import PageNavigation from '@/components/ui/PageNavigation.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import MembershipCard from '@/features/memberships/components/MembershipCard.vue'
import MembershipActionForm from '@/features/memberships/components/MembershipActionForm.vue'
import MembershipRequestPreviewCard from '@/features/memberships/components/MembershipRequestPreviewCard.vue'
import SkeletonCard from '@/components/ui/SkeletonCard.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import '@/styles/memberships.scss'

const route = useRoute()
const auth = useAuthStore()
const { showToast } = useToast()

const scope = computed(() => {
  const role = auth.role
  const id = auth.profiles[role]?.id
  return auth.logged && ['passenger', 'driver'].includes(role) && id ? { [role]: id } : null
})

const {
  records, openMembership, openCompany, page, totalPages, loading, busy, ready,
  error, notice, canRequest, refresh, goToPage, request, transition,
} = useMemberships(scope)

const {
  selectedId,
  selectedCompany,
  selectedGroupId,
  selectionLoading,
  selectionError,
} = useMembershipCompanyPreview({ route, scope })

const closingAction = shallowRef('')

watch(notice, (msg) => {
  if (msg) showToast(msg, 'success')
})
watch(error, (msg) => {
  if (msg) showToast(msg, 'error')
})
watch(selectionError, (msg) => {
  if (msg) showToast(msg, 'error')
})
watch(openMembership, () => {
  closingAction.value = ''
})

// Jornada do titular: conta → pedido → aprovação. Grupo e viagens dependem da empresa.
const journey = computed(() => {
  const status = openMembership.value?.status
  return [
    { label: 'Conta criada', done: true, icon: 'mdi-account-check-outline' },
    { label: 'Pedido enviado', done: Boolean(openMembership.value) || records.value.length > 0, icon: 'mdi-email-fast-outline' },
    { label: 'Vínculo aprovado', done: status === 'active', icon: 'mdi-domain' },
    { label: 'Grupo e viagens', done: false, icon: 'mdi-bus-clock', hint: 'Definidos pela empresa' },
  ]
})

function companyName(membership) {
  return openCompany.value?.id === membership.company
    ? openCompany.value.trade_name
    : `Empresa nº ${membership.company}`
}

async function closeMembership(reason) {
  if (await transition(openMembership.value, closingAction.value, reason)) closingAction.value = ''
}
</script>

<template>
  <div class="membership-workspace" :class="{ authenticated: auth.logged }">
    <div class="membership-content">
      <PageHeader
        title="Meus vínculos"
        subtitle="Conta, vínculo empresarial, grupo de atendimento e viagem são etapas distintas."
      >
        <template v-if="scope" #actions>
          <RouterLink class="membership-cta" to="/companies">
            <BaseIcon name="mdi-magnify" /> Pesquisar empresas
          </RouterLink>
          <BaseButton type="button" variant="outline" size="sm" :disabled="busy || loading" @click="refresh(1)">Atualizar</BaseButton>
        </template>
      </PageHeader>
      <template v-if="scope">
        <ol class="journey" aria-label="Etapas até usar o transporte">
          <li
            v-for="(step, i) in journey"
            :key="step.label"
            class="journey-step"
            :class="{ done: step.done, current: !step.done && (i === 0 || journey[i - 1].done) }"
            :style="{ animationDelay: `${i * 90}ms` }"
          >
            <span class="journey-dot"><BaseIcon :name="step.done ? 'mdi-check' : step.icon" /></span>
            <span class="journey-label">{{ step.label }}</span>
            <small v-if="step.hint" class="journey-hint">{{ step.hint }}</small>
          </li>
        </ol>
        <p class="membership-role">
          <BaseIcon :name="auth.role === 'driver' ? 'mdi-steering' : 'mdi-account'" />
          Perfil de {{ auth.role === 'driver' ? 'motorista' : 'passageiro' }}
        </p>
        <LoadingSpinner v-if="busy" size="sm" inline text="Processando ação de vínculo..." />
        <Transition name="fade-slide" mode="out-in">
          <SkeletonCard v-if="loading" key="loading" :count="2" avatar />
          <section v-else-if="ready" key="content" class="membership-section" aria-label="Situação atual do vínculo">
          <h2>Situação atual</h2>
          <MembershipCard v-if="openMembership" :membership="openMembership" :title="companyName(openMembership)">
            <p v-if="openMembership.status === 'active'">
              A empresa aprovou seu vínculo. Isso não atribui grupo, ponto, serviços ou viagem.
              Não é possível solicitar outra empresa enquanto este vínculo estiver ativo.
            </p>
            <p v-else>Aguarde a decisão da empresa ou retire o pedido antes de solicitar outra empresa.</p>
            <BaseButton
              v-if="!closingAction"
              type="button"
              variant="outline"
              :disabled="busy"
              @click="closingAction = openMembership.status === 'active' ? 'end' : 'withdraw'"
            >
              {{ openMembership.status === 'active' ? 'Encerrar vínculo' : 'Retirar pedido' }}
            </BaseButton>
            <template v-else>
              <p v-if="closingAction === 'end'">
                Encerrar termina seu acesso operacional à empresa, sem apagar a conta ou o histórico. Alocações futuras e operação em andamento podem bloquear a ação; nada será cancelado automaticamente.
              </p>
              <MembershipActionForm
                :key="`${openMembership.id}-${closingAction}`"
                :title="closingAction === 'end' ? 'Confirmar encerramento deste vínculo?' : 'Retirar este pedido de vínculo? Sua conta será preservada.'"
                :busy="busy"
                :disabled="!ready"
                @confirm="closeMembership"
                @cancel="closingAction = ''"
              />
            </template>
          </MembershipCard>
          <p v-else role="status" class="membership-empty">Você não tem pedido pendente nem vínculo ativo neste perfil.</p>
          </section>
        </Transition>

        <MembershipRequestPreviewCard
          v-if="route.query.company"
          v-model:selected-group-id="selectedGroupId"
          :selected-id="selectedId"
          :selected-company="selectedCompany"
          :selection-loading="selectionLoading"
          :role="auth.role"
          :user-phone="auth.user?.phone || ''"
          :busy="busy"
          :can-request="canRequest"
          :ready="ready"
          :open-membership="openMembership"
          @submit="request(selectedCompany.id, selectedGroupId ? Number(selectedGroupId) : null, auth.user?.phone || '')"
        />

        <section v-if="ready" class="membership-section" aria-label="Histórico de vínculos">
          <h2>Pedidos e vínculos</h2>
          <p class="membership-hint">O histórico usa o identificador da empresa quando seu nome público não está disponível.</p>
          <p v-if="!records.length" class="membership-empty">Nenhum pedido registrado neste perfil.</p>
          <TransitionGroup name="list-stagger" tag="div" class="membership-list">
            <MembershipCard v-for="membership in records" :key="membership.id" :membership="membership" :title="companyName(membership)" />
          </TransitionGroup>
          <PageNavigation :page="page" :total-pages="totalPages" :disabled="loading || busy" @change="goToPage" />
        </section>
      </template>
      <template v-else-if="!auth.logged">
        <p>Sessão ausente ou encerrada. Entre novamente; nenhuma operação foi repetida.</p>
        <RouterLink class="membership-link" :to="{ name: 'login', query: selectedId ? { company: selectedId } : {} }">Entrar novamente</RouterLink>
      </template>
      <template v-else>
        <p>Esta tela exige um perfil único de passageiro ou motorista. Nenhum pedido foi enviado.</p>
        <RouterLink v-if="auth.role === 'company'" class="membership-link" to="/users">Gerenciar pedidos da empresa</RouterLink>
      </template>
    </div>
  </div>
</template>
