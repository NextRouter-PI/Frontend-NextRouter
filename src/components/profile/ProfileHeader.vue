<script setup>
import { computed, ref } from 'vue'
import { useOwnProfile } from '@/composables/useOwnProfile'
import AvatarUpload from '@/components/layout/AvatarUpload.vue'
import BaseButton from '@/components/ui/BaseButton.vue'

const context = useOwnProfile()
const { user, profile, role, ready, busy, loading, editing } = context
const photoError = ref('')
const pendingPhoto = ref(null)
const roleLabel = computed(() => ({ passenger: 'Passageiro', driver: 'Motorista', company: 'Empresa' })[role.value])
const moderationLabel = computed(() => ({
  approved: 'Cadastro empresarial aprovado', rejected: 'Cadastro empresarial recusado',
  pending: 'Cadastro empresarial pendente de moderação',
})[profile.value?.review_status] || 'Moderação não informada')
const memberSince = computed(() => user.value?.created_at
  ? new Date(user.value.created_at).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) : '')

async function selectPhoto(file) {
  photoError.value = ''
  pendingPhoto.value = file
  if (await context.replaceAsset('photo', file)) pendingPhoto.value = null
}
</script>

<template>
  <header class="account-cover">
    <AvatarUpload :model-value="user?.profile_picture_data?.url"
      :disabled="!ready || busy || loading || Boolean(editing)" @file-select="selectPhoto" @error="photoError = $event" />
    <h1>{{ role === 'company' ? profile?.trade_name : user?.name }}</h1>
    <p>{{ roleLabel }} · {{ user?.email }}</p>
    <p v-if="memberSince">Membro desde {{ memberSince }}</p>
    <p v-if="role === 'company'">{{ moderationLabel }}. Editar dados não aprova o cadastro.</p>
    <p v-if="role === 'driver' && profile?.ratings_count != null">
      {{ profile.ratings_count }} avaliações · média {{ profile.average_rating ?? 'não disponível' }}
    </p>
    <p v-if="busy" role="status">Salvando e consultando o perfil...</p>
    <p v-if="photoError" role="alert">{{ photoError }}</p>
    <div v-if="pendingPhoto && !busy" class="account-actions">
      <span>Arquivo pendente: {{ pendingPhoto.name }}</span>
      <BaseButton type="button" variant="outline" :disabled="!ready || loading || Boolean(editing)" @click="selectPhoto(pendingPhoto)">Tentar associar novamente</BaseButton>
      <BaseButton type="button" variant="outline" @click="pendingPhoto = null">Descartar seleção local</BaseButton>
    </div>
  </header>
</template>
