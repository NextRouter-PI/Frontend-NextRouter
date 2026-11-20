<script setup>
import { computed, ref } from 'vue'
import { useOwnProfile } from '@/features/profile/composables/useOwnProfile'
import { useToast } from '@/composables/useToast'
import AvatarUpload from '@/components/layout/AvatarUpload.vue'
import BaseButton from '@/components/ui/BaseButton.vue'

const context = useOwnProfile()
const { showToast } = useToast()
const { user, profile, role, ready, busy, loading, editing } = context
const pendingPhoto = ref(null)

const roleLabel = computed(() => ({ passenger: 'Passageiro', driver: 'Motorista', company: 'Empresa' })[role.value])
const displayName = computed(() => {
  if (role.value === 'company') return profile.value?.trade_name || user.value?.name || 'Empresa'
  const first = (user.value?.name || '').trim().split(/\s+/)[0]
  return first ? `Olá, ${first}!` : 'Meu Perfil'
})
const moderationLabel = computed(() => ({
  approved: 'Cadastro empresarial aprovado',
  rejected: 'Cadastro empresarial recusado',
  pending: 'Cadastro empresarial pendente de moderação',
})[profile.value?.review_status] || 'Moderação não informada')
const memberSince = computed(() =>
  user.value?.created_at
    ? new Date(user.value.created_at).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    : '',
)

async function selectPhoto(file) {
  pendingPhoto.value = file
  if (await context.replaceAsset('photo', file)) pendingPhoto.value = null
}

function handlePhotoError(message) {
  if (message) showToast(message, 'error')
}
</script>

<template>
  <header class="account-cover profile-banner">
    <div class="banner-main">
      <div class="banner-avatar-wrap">
        <AvatarUpload
          :model-value="user?.profile_picture_data?.url"
          :disabled="!ready || busy || loading || Boolean(editing)"
          @file-select="selectPhoto"
          @error="handlePhotoError"
        />
        <Transition name="fade-scale">
          <div v-if="busy" class="avatar-busy-overlay" role="status" aria-label="Salvando perfil">
            <span class="avatar-busy-spinner" aria-hidden="true"></span>
          </div>
        </Transition>
      </div>

      <div class="banner-info">
        <h1>{{ displayName }}</h1>
        <p class="banner-sub">
          <span class="role-pill">{{ roleLabel }}</span>
          <span class="banner-email">{{ user?.email }}</span>
        </p>
        <p v-if="memberSince" class="banner-meta">Membro desde {{ memberSince }}</p>
        <p v-if="role === 'company'" class="banner-meta">
          {{ moderationLabel }}. Editar dados não aprova o cadastro.
        </p>
        <p v-if="role === 'driver' && profile?.ratings_count != null" class="banner-meta">
          {{ profile.ratings_count }} avaliações · média {{ profile.average_rating ?? 'não disponível' }}
        </p>
      </div>
    </div>

    <div v-if="pendingPhoto && !busy" class="banner-pending">
      <span>Arquivo pendente: {{ pendingPhoto.name }}</span>
      <div class="banner-pending-actions">
        <BaseButton
          type="button"
          variant="outline"
          size="sm"
          :disabled="!ready || loading || Boolean(editing)"
          @click="selectPhoto(pendingPhoto)"
        >
          Tentar associar novamente
        </BaseButton>
        <BaseButton type="button" variant="outline" size="sm" @click="pendingPhoto = null">
          Descartar seleção local
        </BaseButton>
      </div>
    </div>
  </header>
</template>

<style lang="scss" scoped>
.profile-banner {
  text-align: left;
}

.banner-main {
  display: flex;
  align-items: center;
  gap: 18px;
  flex-wrap: wrap;
}

.banner-avatar-wrap {
  position: relative;
  flex-shrink: 0;
}

.avatar-busy-overlay {
  position: absolute;
  inset: 0;
  border-radius: $radius-round;
  background: rgba(0, 0, 0, 0.48);
  @include flex-center;
  pointer-events: none;
}

.avatar-busy-spinner {
  width: 28px;
  height: 28px;
  border-radius: $radius-round;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top-color: var(--color-on-primary);
  animation: avatar-spin 0.65s linear infinite;
}

@keyframes avatar-spin {
  to {
    transform: rotate(360deg);
  }
}

.banner-info {
  flex: 1;
  min-width: 200px;
}

.banner-sub {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin: 6px 0 4px;
  font-size: 0.9rem;
}

.role-pill {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.22);
  color: var(--color-on-primary);
  font-size: 0.78rem;
  font-weight: 700;
}

.banner-email {
  color: rgba(255, 255, 255, 0.94);
  font-weight: 500;
  word-break: break-word;
}

.banner-meta {
  margin: 4px 0 0;
  font-size: 0.82rem;
  color: rgba(255, 255, 255, 0.88);
}

.banner-status,
.banner-error {
  margin: 12px 0 0;
  padding: 8px 12px;
  border-radius: 10px;
  font-size: 0.85rem;
  font-weight: 600;
}

.banner-status {
  background: rgba(255, 255, 255, 0.18);
  color: var(--color-on-primary);
}

.banner-error {
  background: rgba(0, 0, 0, 0.28);
  color: var(--color-on-primary);
}

.banner-pending {
  margin-top: 12px;
  padding: 10px 12px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.16);
  font-size: 0.85rem;
}

.banner-pending-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}
</style>
