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
  return (user.value?.name || '').trim() || 'Meu perfil'
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
  <header class="profile-banner">
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
        <span class="role-pill">{{ roleLabel }}</span>
        <h1>{{ displayName }}</h1>
        <p class="banner-email">{{ user?.email }}</p>
        <ul class="banner-facts">
          <li v-if="memberSince"><BaseIcon name="mdi-calendar-outline" /> Membro desde {{ memberSince }}</li>
          <li v-if="role === 'company'" :class="`status-${profile?.review_status || 'none'}`">
            <BaseIcon name="mdi-check-circle-outline" /> {{ moderationLabel }}
          </li>
        </ul>
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
// Cartão do usuário: faixa laranja no topo, foto sobreposta e dados centralizados.
.profile-banner {
  position: relative;
  overflow: hidden;
  padding: 0 0 $space-5;
  border-radius: $radius-xl;
  background: var(--color-surface);
  outline: 1px solid var(--border);
  outline-offset: -1px;
  box-shadow: var(--shadow);
  color: var(--text);
  text-align: center;

  &::before {
    content: '';
    display: block;
    height: 92px;
    background:
      linear-gradient(120deg, rgba(212, 113, 12, 0.94), rgba(236, 131, 20, 0.88) 55%, rgba(245, 154, 50, 0.8)),
      url('@/assets/images/banner-panoramico-900.webp') center 60% / cover;
  }
}

.banner-main {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $space-2;
  margin-top: -52px;
  padding: 0 $space-4;
}

.banner-avatar-wrap {
  position: relative;
  flex-shrink: 0;
  padding: 4px;
  border-radius: $radius-round;
  background: var(--color-surface);
}

.avatar-busy-overlay {
  position: absolute;
  inset: 4px;
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
  border-top-color: #fff;
  animation: avatar-spin 0.65s linear infinite;
}

@keyframes avatar-spin {
  to {
    transform: rotate(360deg);
  }
}

.banner-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  min-width: 0;

  h1 {
    margin: 4px 0 0;
    font-size: 1.25rem;
    font-weight: $font-extrabold;
    color: var(--text);
  }
}

.role-pill {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  border-radius: 999px;
  background: var(--color-primary-soft);
  color: var(--primary-text);
  font-size: 0.72rem;
  font-weight: $font-bold;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.banner-email {
  color: var(--text-muted);
  font-size: $text-sm;
  word-break: break-word;
}

.banner-facts {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: $space-3 0 0;
  padding: $space-3 0 0;
  border-top: 1px solid var(--border);
  list-style: none;
  width: 100%;

  li {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    color: var(--text-muted);
    font-size: $text-xs;
  }

  .status-approved {
    color: var(--success);
  }

  .status-pending {
    color: #d97706;
  }

  .status-rejected {
    color: var(--danger);
  }
}

.banner-pending {
  margin: $space-3 $space-4 0;
  padding: 10px 12px;
  border-radius: 10px;
  background: var(--altbg);
  font-size: 0.85rem;
}

.banner-pending-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  margin-top: 8px;
}
</style>
