<script setup>
import { onMounted, shallowRef } from 'vue'
import api from '@/api/client'
import { formatApiError } from '@/utils/apiErrors'
import BaseButton from '@/components/ui/BaseButton.vue'

// Consentimento do motorista para compartilhar a localização (só durante as viagens).
// v-model: data do consentimento (ISO) ou null.
const consentAt = defineModel({ type: String, default: null })
const loading = shallowRef(true)
const saving = shallowRef(false)
const error = shallowRef('')

async function load() {
  try {
    const { data } = await api.get('/drivers/me/')
    consentAt.value = data.location_consent_at || null
  } catch (cause) {
    error.value = formatApiError(cause, 'Não foi possível consultar seu consentimento.')
  } finally {
    loading.value = false
  }
}

async function setConsent(consent) {
  saving.value = true
  error.value = ''
  try {
    const { data } = await api.post('/drivers/me/location-consent/', { consent })
    consentAt.value = data.location_consent_at || null
  } catch (cause) {
    error.value = formatApiError(cause, 'Não foi possível salvar sua escolha.')
  } finally {
    saving.value = false
  }
}

const since = (iso) => new Date(iso).toLocaleDateString('pt-BR')

onMounted(load)
</script>

<template>
  <section v-if="!loading" class="consent-card" :class="{ granted: consentAt }" aria-live="polite">
    <span class="consent-icon"><BaseIcon :name="consentAt ? 'mdi-check-circle-outline' : 'mdi-crosshairs-gps'" /></span>
    <div class="consent-body">
      <template v-if="!consentAt">
        <strong>Autorize o compartilhamento da sua localização</strong>
        <p>
          A empresa e os passageiros da viagem veem a posição do veículo <b>somente enquanto a viagem estiver em
          andamento</b>. Fora das viagens nada é enviado. Você pode revogar quando quiser.
        </p>
        <BaseButton size="sm" icon="mdi-crosshairs-gps" :loading="saving" @click="setConsent(true)">
          Autorizar localização
        </BaseButton>
      </template>
      <template v-else>
        <strong>Localização autorizada desde {{ since(consentAt) }}</strong>
        <p>Sua posição só é enviada durante as viagens em andamento.</p>
        <button type="button" class="consent-revoke" :disabled="saving" @click="setConsent(false)">Revogar autorização</button>
      </template>
      <p v-if="error" class="consent-error" role="alert">{{ error }}</p>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.consent-card {
  display: flex;
  gap: $space-3;
  padding: $space-4;
  border-radius: $radius-lg;
  background: var(--color-primary-soft);
  outline: 1px solid var(--color-primary-tint);
  outline-offset: -1px;

  &.granted {
    background: var(--color-surface);
    outline-color: var(--border);
  }

  p {
    margin: 4px 0 $space-3;
    color: var(--text-muted);
    font-size: $text-sm;
    line-height: 1.5;
  }
}

.consent-icon {
  @include flex-center;
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: $radius-md;
  background: var(--gradient-brand);
  color: #fff;
  font-size: 1.3rem;

  .granted & {
    background: var(--success);
  }
}

.consent-body {
  min-width: 0;
}

.consent-revoke {
  @include action-button;
  color: var(--danger);
  font-size: $text-sm;
  font-weight: $font-semibold;
  text-decoration: underline;
}

.consent-error {
  color: var(--danger);
}
</style>
