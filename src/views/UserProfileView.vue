<script setup>
import { computed, watch } from 'vue'
import { provideOwnProfile } from '@/features/profile/composables/useOwnProfile'
import { usePullToRefresh } from '@/composables/usePullToRefresh'
import { useToast } from '@/composables/useToast'
import { profileDocumentFields } from '@/api/profile'
import { PROFILE_SECTIONS } from '@/features/profile/profileFields'
import ProfileHeader from '@/features/profile/components/ProfileHeader.vue'
import ProfileFieldsSection from '@/features/profile/components/ProfileFieldsSection.vue'
import ProfileDocumentSlot from '@/features/profile/components/ProfileDocumentSlot.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import SkeletonCard from '@/components/ui/SkeletonCard.vue'

const { profile, user, role, ready, busy, loading, error, notice, editing, supported, refresh } = provideOwnProfile()
const { showToast } = useToast()
const documents = computed(() => profileDocumentFields(role.value))
const canRefresh = computed(() => supported.value && !busy.value && !loading.value && (!editing.value || !ready.value))
const { distance } = usePullToRefresh(refresh, () => canRefresh.value && !editing.value)

// Seções exibidas (empresa tem duas a mais) e atalhos para elas na coluna lateral.
const parts = computed(() =>
  role.value === 'company' ? ['personal', 'personalAddress', 'company', 'companyAddress'] : ['personal', 'personalAddress'],
)
const SHORTCUTS = {
  personal: { icon: 'mdi-account-outline', label: 'Dados pessoais' },
  personalAddress: { icon: 'mdi-map-marker-outline', label: 'Endereço' },
  company: { icon: 'mdi-domain', label: 'Empresa' },
  companyAddress: { icon: 'mdi-office-building-outline', label: 'Endereço da empresa' },
}

// Quanto do perfil está preenchido (campos editáveis + documentos), para incentivar completar.
const completion = computed(() => {
  let total = 0
  let filled = 0
  for (const part of parts.value) {
    const section = PROFILE_SECTIONS[part]
    const source = section.target === 'user' ? user.value : profile.value
    for (const field of section.fields) {
      total += 1
      if (source?.[field.key]) filled += 1
    }
  }
  for (const field of documents.value) {
    total += 1
    if (profile.value?.[`${field}_data`]) filled += 1
  }
  return total ? Math.round((filled / total) * 100) : 0
})

function goTo(part) {
  document.getElementById(`perfil-${part}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

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
    <SkeletonCard v-if="loading && !profile" :count="2" avatar />

    <div v-if="profile" class="profile-layout">
      <aside class="profile-aside">
        <ProfileHeader />

        <div class="profile-progress">
          <div class="progress-head">
            <span>Perfil completo</span>
            <strong>{{ completion }}%</strong>
          </div>
          <div class="progress-track" aria-hidden="true">
            <span class="progress-fill" :style="{ width: `${completion}%` }"></span>
          </div>
          <small v-if="completion < 100">Complete seus dados para agilizar os vínculos.</small>
          <small v-else>Tudo preenchido. Obrigado!</small>
        </div>

        <nav class="profile-shortcuts" aria-label="Seções do perfil">
          <button v-for="part in parts" :key="part" type="button" class="shortcut" @click="goTo(part)">
            <BaseIcon :name="SHORTCUTS[part].icon" />
            {{ SHORTCUTS[part].label }}
            <BaseIcon name="mdi-chevron-right" class="shortcut-arrow" />
          </button>
          <button v-if="documents.length" type="button" class="shortcut" @click="goTo('docs')">
            <BaseIcon name="mdi-file-pdf-box" />
            Documentos
            <BaseIcon name="mdi-chevron-right" class="shortcut-arrow" />
          </button>
        </nav>

        <BaseButton
          type="button"
          variant="ghost"
          size="sm"
          icon="mdi-refresh"
          class="profile-refresh"
          :loading="loading && Boolean(profile)"
          :disabled="!canRefresh"
          @click="refresh"
        >
          Atualizar dados
        </BaseButton>
      </aside>

      <div class="profile-main">
        <p v-if="!ready" class="account-notice">Os dados exibidos são da última leitura, não estão confirmados como atuais. Atualize antes de editar ou reenviar.</p>
        <p v-if="editing" class="account-hint">Há uma edição aberta. Atualizar após falha não substitui seu rascunho; revise os dados antes de salvar.</p>

        <ProfileFieldsSection v-for="part in parts" :id="`perfil-${part}`" :key="part" :part="part" />

        <section v-if="documents.length" id="perfil-docs" class="account-section docs-group">
          <div class="account-section-header">
            <h2><BaseIcon name="mdi-file-pdf-box" class="section-icon" /> Documentos</h2>
          </div>
          <p class="account-hint">PDF de até 10 MB cada. O envio e a associação são etapas separadas.</p>
          <ProfileDocumentSlot v-for="field in documents" :key="field" :field="field" />
        </section>
      </div>
    </div>
    <p v-else-if="!supported && !loading">Esta tela exige um perfil único de passageiro, motorista ou empresa. Nenhum perfil foi escolhido automaticamente.</p>
  </div>
</template>

<style lang="scss" scoped>
// Duas colunas no computador: cartão do usuário fixo à esquerda, dados à direita.
.profile-layout {
  display: grid;
  gap: $space-5;

  @include from(1100px) {
    grid-template-columns: 300px minmax(0, 1fr);
    align-items: start;
  }
}

.profile-aside {
  display: flex;
  flex-direction: column;
  gap: $space-3;

  @include from(1100px) {
    position: sticky;
    top: $space-5;
  }
}

.profile-progress {
  @include surface-card($space-4, $radius-lg);

  small {
    display: block;
    margin-top: $space-2;
    color: var(--text-muted);
    font-size: $text-xs;
  }
}

.progress-head {
  display: flex;
  justify-content: space-between;
  font-size: $text-sm;
  font-weight: $font-semibold;

  strong {
    color: var(--primary-text);
  }
}

.progress-track {
  height: 8px;
  margin-top: $space-2;
  border-radius: 999px;
  background: var(--altbg);
  overflow: hidden;
}

.progress-fill {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--gradient-brand);
  transition: width 0.8s $ease-fluid;
}

.profile-shortcuts {
  display: none;
  flex-direction: column;
  padding: $space-2;
  border-radius: $radius-lg;
  background: var(--color-surface);
  outline: 1px solid var(--border);
  outline-offset: -1px;

  @include from(1100px) {
    display: flex;
  }
}

.shortcut {
  display: flex;
  align-items: center;
  gap: $space-2;
  padding: 10px 12px;
  border-radius: $radius-md;
  color: var(--text);
  font-size: $text-sm;
  font-weight: $font-semibold;
  text-align: left;
  transition:
    background-color $duration-normal $ease-fluid,
    color $duration-normal $ease-fluid;

  :deep(.base-icon:first-child) {
    color: var(--primary);
  }

  &:hover {
    background: var(--altbg);
    color: var(--primary-text);

    .shortcut-arrow {
      transform: translateX(3px);
    }
  }
}

.shortcut-arrow {
  margin-left: auto;
  color: var(--text-muted);
  transition: transform $duration-normal $ease-fluid;
}

.profile-refresh {
  align-self: flex-start;
}

.profile-main {
  min-width: 0;

  :deep(.account-section:first-of-type) {
    margin-top: 0;
  }
}
</style>
