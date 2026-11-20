<script setup>
import { computed, watch } from 'vue'
import { provideOwnProfile } from '@/features/profile/composables/useOwnProfile'
import { usePullToRefresh } from '@/composables/usePullToRefresh'
import { useToast } from '@/composables/useToast'
import { profileDocumentFields } from '@/api/profile'
import ProfileHeader from '@/features/profile/components/ProfileHeader.vue'
import ProfileFieldsSection from '@/features/profile/components/ProfileFieldsSection.vue'
import ProfileDocumentSlot from '@/features/profile/components/ProfileDocumentSlot.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import SkeletonCard from '@/components/ui/SkeletonCard.vue'

const { profile, role, ready, busy, loading, error, notice, editing, supported, refresh } = provideOwnProfile()
const { showToast } = useToast()
const documents = computed(() => profileDocumentFields(role.value))
const canRefresh = computed(() => supported.value && !busy.value && !loading.value && (!editing.value || !ready.value))
const { distance } = usePullToRefresh(refresh, () => canRefresh.value && !editing.value)

watch(notice, (msg) => {
  if (msg) showToast(msg, 'success')
})
watch(error, (msg) => {
  if (msg) showToast(msg, 'error')
})
</script>

<template>
  <div class="profile-tab">
    <p v-if="distance > 0" class="pull-hint" role="status">{{ distance >= 60 ? 'Solte para atualizar' : 'Puxe para atualizar' }}</p>
    <div class="account-actions">
      <BaseButton
        type="button"
        variant="outline"
        icon="mdi-refresh"
        :loading="loading && Boolean(profile)"
        :disabled="!canRefresh"
        @click="refresh"
      >
        Atualizar perfil
      </BaseButton>
    </div>
    <SkeletonCard v-if="loading && !profile" :count="2" avatar />
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
</template>
