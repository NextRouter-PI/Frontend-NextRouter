<script setup>
import { computed } from 'vue'
import { state } from '@/stores/state'
import { provideOwnProfile } from '@/composables/useOwnProfile'
import { usePullToRefresh } from '@/composables/usePullToRefresh'
import { profileDocumentFields } from '@/api/profile'
import ProfileHeader from '@/components/profile/ProfileHeader.vue'
import ProfileFieldsSection from '@/components/profile/ProfileFieldsSection.vue'
import ProfileDocumentSlot from '@/components/profile/ProfileDocumentSlot.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import ErrorMessage from '@/components/ui/ErrorMessage.vue'
import '@/assets/css/profile.css'

const { profile, role, ready, busy, loading, error, notice, editing, supported, refresh } = provideOwnProfile()
const documents = computed(() => profileDocumentFields(role.value))
const canRefresh = computed(() => supported.value && !busy.value && !loading.value && (!editing.value || !ready.value))
const { distance } = usePullToRefresh(refresh, () => canRefresh.value && !editing.value)
</script>

<template>
  <div class="account-workspace" :class="{ authenticated: state.logged }">
    <div class="account-content">
      <p v-if="distance > 0" role="status">{{ distance >= 60 ? 'Solte para atualizar' : 'Puxe para atualizar' }}</p>
      <div class="account-actions">
        <BaseButton type="button" variant="outline" :disabled="!canRefresh" @click="refresh">Atualizar perfil</BaseButton>
        <RouterLink to="/seguranca">Senha, e-mail e sessões</RouterLink>
        <RouterLink v-if="role === 'company'" to="/usuarios">Vínculos da empresa</RouterLink>
        <RouterLink v-else-if="supported" to="/vinculos">Meu vínculo empresarial</RouterLink>
      </div>
      <p v-if="notice" class="account-notice" role="status">{{ notice }}</p>
      <div role="alert"><ErrorMessage :message="error" /></div>
      <p v-if="loading" role="status">Consultando perfil atualizado...</p>
      <p v-if="profile && !ready" class="account-notice">Os dados exibidos são da última leitura, não estão confirmados como atuais. Atualize antes de editar ou reenviar.</p>
      <p v-if="editing" class="account-hint">Há uma edição aberta. Atualizar após falha não substitui seu rascunho; revise os dados antes de salvar.</p>
      <template v-if="profile">
        <ProfileHeader />
        <ProfileFieldsSection part="personal" />
        <ProfileFieldsSection part="personalAddress" />
        <template v-if="role === 'company'">
          <ProfileFieldsSection part="company" />
          <ProfileFieldsSection part="companyAddress" />
        </template>
        <ProfileDocumentSlot v-for="field in documents" :key="field" :field="field" />
      </template>
      <p v-else-if="!supported && !loading">Esta tela exige um perfil único de passageiro, motorista ou empresa. Nenhum perfil foi escolhido automaticamente.</p>
    </div>
  </div>
</template>
