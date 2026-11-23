<script setup>
import { useTemplateRef } from 'vue'
import { DEFAULT_EMPTY_LABEL, ROUTE_PATHS, USER_ROLES } from '@/constants'
import { state } from '@/stores/state'
import { useInputFormat } from '@/composables/useInputFormat'
import { useLinkedProfile } from '@/features/profile/composables/useLinkedProfile'
import BaseButton from '@/components/ui/BaseButton.vue'
import ErrorMessage from '@/components/ui/ErrorMessage.vue'
import SkeletonCard from '@/components/ui/SkeletonCard.vue'
import '@/styles/profile.scss'

const mapContainer = useTemplateRef('mapEl')
const { formatPhone, formatCEP } = useInputFormat()
const { driver, profile, loading, error, hasCoordinates, avatarUrl, initials, reload } =
  useLinkedProfile(mapContainer)
</script>

<template>
  <div class="account-workspace" :class="{ authenticated: state.logged }">
    <div class="account-content">
      <div class="profile-topbar">
        <h1>Perfil do titular vinculado</h1>
        <RouterLink :to="ROUTE_PATHS.USERS" class="back-btn">
          <BaseIcon name="mdi-arrow-left" />
          <span>Voltar aos vínculos</span>
        </RouterLink>
      </div>

      <SkeletonCard v-if="loading" :count="2" avatar />
      <div role="alert"><ErrorMessage :message="error" /></div>

      <template v-if="profile">
        <header class="account-cover identity-banner">
          <div class="identity-header">
            <img
              v-if="avatarUrl"
              :src="avatarUrl"
              :alt="`Foto de ${profile.name || 'usuário'}`"
              class="identity-avatar"
            />
            <div v-else class="identity-avatar identity-fallback" aria-hidden="true">{{ initials }}</div>
            <div>
              <h2>{{ profile.name || 'Nome não disponível' }}</h2>
              <p class="identity-role">
                <span class="role-badge">{{ driver ? 'Motorista' : 'Passageiro' }}</span>
                <span>perfil nº {{ profile.id }}</span>
              </p>
              <p v-if="profile.phone" class="identity-meta">
                <BaseIcon name="mdi-phone-outline" />
                <span>{{ formatPhone(profile.phone) }}</span>
              </p>
              <p v-if="driver && profile.ratings != null" class="identity-meta">
                {{ profile.ratings }} avaliações · média {{ profile.average ?? 'não disponível' }}
              </p>
            </div>
          </div>
        </header>

        <section v-if="!driver" class="account-section">
          <h2>Endereço do passageiro</h2>
          <dl class="account-grid">
            <div><dt>Rua / Logradouro</dt><dd>{{ profile.street || DEFAULT_EMPTY_LABEL }}</dd></div>
            <div><dt>Número</dt><dd>{{ profile.number || DEFAULT_EMPTY_LABEL }}</dd></div>
            <div><dt>Complemento</dt><dd>{{ profile.complement || '—' }}</dd></div>
            <div><dt>Bairro</dt><dd>{{ profile.neighborhood || DEFAULT_EMPTY_LABEL }}</dd></div>
            <div><dt>Cidade</dt><dd>{{ profile.city || DEFAULT_EMPTY_LABEL }}</dd></div>
            <div><dt>Estado (UF)</dt><dd>{{ profile.state || DEFAULT_EMPTY_LABEL }}</dd></div>
            <div><dt>CEP</dt><dd>{{ profile.cep ? formatCEP(profile.cep) : DEFAULT_EMPTY_LABEL }}</dd></div>
          </dl>
        </section>

        <section v-if="!driver" class="account-section">
          <h2>Localização no mapa</h2>
          <template v-if="hasCoordinates">
            <p class="coords-hint">
              Latitude {{ Number(profile.latitude).toFixed(6) }} · Longitude
              {{ Number(profile.longitude).toFixed(6) }}
            </p>
            <div ref="mapEl" class="profile-map"></div>
          </template>
          <p v-else class="account-hint">Coordenadas de localização não cadastradas para este passageiro.</p>
        </section>
      </template>

      <div class="account-actions">
        <BaseButton
          v-if="state.role === USER_ROLES.COMPANY"
          variant="outline"
          :disabled="loading"
          @click="reload"
        >
          Atualizar consulta
        </BaseButton>
      </div>
      <p v-if="state.role !== USER_ROLES.COMPANY">Somente uma empresa autorizada pode consultar esta tela.</p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.profile-topbar {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: $space-3;
  margin-bottom: $space-4;

  h1 {
    font-size: $text-xl;
  }
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: $space-1;
  color: var(--primary);
  font-weight: $font-semibold;
  font-size: $text-md;
}

.identity-header {
  display: flex;
  align-items: center;
  gap: $space-4;
  flex-wrap: wrap;
}

.identity-avatar {
  width: 64px;
  height: 64px;
  border-radius: $radius-round;
  object-fit: cover;
  border: 2px solid var(--color-on-primary);
  flex-shrink: 0;
}

.identity-fallback {
  @include flex-center;
  background: rgba(255, 255, 255, 0.2);
  color: var(--color-on-primary);
  font-size: 1.3rem;
  font-weight: $font-bold;
}

.identity-role,
.identity-meta {
  display: flex;
  align-items: center;
  gap: $space-2;
  font-size: $text-sm;
  margin-top: $space-1;
}

.role-badge {
  padding: 2px $space-2;
  border-radius: $radius-pill;
  background: rgba(255, 255, 255, 0.22);
  font-weight: $font-bold;
}

.coords-hint {
  font-size: $text-xs;
  color: var(--text-muted);
  margin-bottom: $space-2;
}

.profile-map {
  width: 100%;
  height: 260px;
  border-radius: $radius-md;
  border: 1px solid var(--border);
  z-index: $z-base;
}
</style>
