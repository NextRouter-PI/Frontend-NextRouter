<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/api/client'

const route = useRoute()
const isMotorista = computed(() => route.name === 'usuario-motorista')

const loading = ref(true)
const error = ref('')
const registro = ref(null)
const nomeRota = ref('')

const NOT_IN_DB = 'Nao add no Banco'

function orNotInDb(value) {
  return value === null || value === undefined || value === '' ? NOT_IN_DB : value
}

const userData = computed(() => registro.value?.user_data || {})

function formatAddress(data) {
  if (!data) return NOT_IN_DB
  return [
    data.street,
    data.number && `nº ${data.number}`,
    data.complement,
    data.neighborhood,
    data.city && data.state && `${data.city} - ${data.state}`,
  ].filter(Boolean).join(', ') || NOT_IN_DB
}

const hasLocation = computed(() => userData.value?.latitude != null && userData.value?.longitude != null)

const mapsUrl = computed(() => {
  if (!hasLocation.value) return null
  return `https://www.google.com/maps?q=${userData.value.latitude},${userData.value.longitude}`
})

async function carregar() {
  loading.value = true
  error.value = ''
  try {
    const endpoint = isMotorista.value ? `/drivers/${route.params.id}/` : `/passengers/${route.params.id}/`
    const { data } = await api.get(endpoint)
    registro.value = data

    if (data.route_group) {
      try {
        const { data: grupo } = await api.get(`/company-route-groups/${data.route_group}/`)
        nomeRota.value = grupo.name
      } catch {
        nomeRota.value = NOT_IN_DB
      }
    } else {
      nomeRota.value = 'Sem rota atribuída'
    }
  } catch {
    error.value = 'Não foi possível carregar os dados deste usuário.'
  } finally {
    loading.value = false
  }
}

onMounted(carregar)
</script>

<template>
  <div class="profile-page">
    <div class="cover">
      <div class="cover-badge">
        <span class="mdi" :class="isMotorista ? 'mdi-steering' : 'mdi-account'"></span>
      </div>
    </div>

    <div class="profile-body">
      <template v-if="loading">
        <p class="status-message">Carregando perfil...</p>
      </template>

      <template v-else-if="error">
        <div class="error-state">
          <span class="mdi mdi-cloud-alert"></span>
          <p>{{ error }}</p>
        </div>
      </template>

      <template v-else>
        <div class="top-bar">
          <button class="back-button" @click="$router.back()">
            <span class="mdi mdi-arrow-left"></span>
          </button>
        </div>

        <div class="profile-head">
          <h1 class="profile-name">{{ orNotInDb(userData.name) }}</h1>
          <p class="profile-tag">{{ orNotInDb(userData.email) }}</p>
          <div class="profile-badge">
            <span class="mdi" :class="isMotorista ? 'mdi-steering' : 'mdi-account-check'"></span>
            {{ isMotorista ? 'Motorista' : 'Passageiro' }}
          </div>
        </div>

        <div class="section">
          <div class="section-header">
            <span class="mdi mdi-map-outline"></span>
            <h2>Rota</h2>
          </div>
          <p class="rota-nome">{{ nomeRota }}</p>
        </div>

        <div class="section">
          <div class="section-header">
            <span class="mdi mdi-information-outline"></span>
            <h2>Informações Pessoais</h2>
          </div>
          <div class="info-grid">
            <div v-for="item in [
              { label: 'Nome', value: orNotInDb(userData.name) },
              { label: 'Email', value: orNotInDb(userData.email) },
              { label: 'Telefone', value: orNotInDb(userData.phone) },
              { label: 'Data de Nascimento', value: orNotInDb(userData.birthday) },
              { label: 'CPF', value: orNotInDb(userData.cpf) },
            ]" :key="item.label" class="info-item">
              <span class="info-label">{{ item.label }}</span>
              <span class="info-value">{{ item.value }}</span>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-header">
            <span class="mdi mdi-map-marker-outline"></span>
            <h2>Endereço</h2>
          </div>
          <div class="address-card">
            <div class="address-display">
              <div class="address-icon-wrap">
                <span class="mdi mdi-home-outline"></span>
              </div>
              <div class="address-text">
                <p>{{ formatAddress(userData) }}</p>
              </div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-header">
            <span class="mdi mdi-crosshairs-gps"></span>
            <h2>Localização</h2>
          </div>
          <div v-if="hasLocation" class="location-card">
            <div class="location-coords">
              <span class="mdi mdi-map-marker"></span>
              <span>{{ userData.latitude.toFixed(6) }}, {{ userData.longitude.toFixed(6) }}</span>
            </div>
            <a :href="mapsUrl" target="_blank" rel="noopener noreferrer" class="location-link">
              Ver no mapa <span class="mdi mdi-open-in-new"></span>
            </a>
          </div>
          <p v-else class="location-empty">{{ NOT_IN_DB }}</p>
        </div>

        <div v-if="isMotorista" class="section">
          <div class="section-header">
            <span class="mdi mdi-card-account-details-outline"></span>
            <h2>CNH</h2>
          </div>
          <div class="cnh-card">
            <div class="cnh-display">
              <div class="cnh-icon-wrap">
                <span class="mdi mdi-id-card"></span>
              </div>
              <div class="cnh-text">
                <p>{{ registro.cnh_data ? (registro.cnh_data.description || 'CNH enviada') : NOT_IN_DB }}</p>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.profile-page {
  min-height: 100vh;
  background: var(--bg);
  padding-bottom: 40px;
}

.cover {
  position: relative;
  width: 100%;
  height: 120px;
  background: #df801a;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cover-badge {
  width: 90px;
  height: 90px;
  border-radius: 50%;
  background: var(--superfice);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.2rem;
  color: var(--primary);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  margin-top: 40px;
}

.profile-body {
  max-width: 600px;
  margin: 0 auto;
  padding: 0 20px;
}

.top-bar {
  padding: 16px 0 0;
}

.back-button {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 24px;
  color: var(--text);
}

.status-message {
  text-align: center;
  color: var(--text-muted);
  padding: 60px 0;
}

.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60px 20px;
  text-align: center;
}
.error-state .mdi {
  font-size: 3rem;
  color: var(--text-muted);
  margin-bottom: 16px;
}
.error-state p {
  color: var(--text-muted);
}

.profile-head {
  text-align: center;
  margin: 20px 0 16px;
}
.profile-name {
  font-size: 1.45rem;
  font-weight: 800;
  color: var(--text);
  margin: 0 0 3px;
}
.profile-tag {
  font-size: 0.82rem;
  color: var(--text-muted);
  margin: 0 0 6px;
}
.profile-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 14px;
  background: rgba(223, 128, 26, 0.1);
  color: var(--primary);
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 600;
}

.section {
  background: var(--superfice);
  border: 1px solid rgba(223, 128, 26, 0.12);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}
.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 18px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(223, 128, 26, 0.1);
}
.section-header .mdi {
  font-size: 1.2rem;
  color: var(--primary);
}
.section-header h2 {
  font-size: 0.82rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-muted);
  margin: 0;
}

.rota-nome {
  margin: 0;
  font-size: 0.95rem;
  color: var(--text);
  font-weight: 600;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 14px;
}
.info-item {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.info-label {
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-muted);
}
.info-value {
  font-size: 0.92rem;
  color: var(--text);
  font-weight: 500;
}

.address-card, .cnh-card {
  border-radius: 12px;
  background: var(--bg);
  border: 1px solid rgba(223, 128, 26, 0.08);
  overflow: hidden;
}
.address-display, .cnh-display {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
}
.address-icon-wrap, .cnh-icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: rgba(223, 128, 26, 0.08);
  flex-shrink: 0;
}
.address-icon-wrap .mdi, .cnh-icon-wrap .mdi {
  font-size: 1.3rem;
  color: var(--primary);
}
.address-text, .cnh-text {
  flex: 1;
  min-width: 0;
}
.address-text p, .cnh-text p {
  margin: 0;
  font-size: 0.88rem;
  color: var(--text);
  line-height: 1.4;
}

.location-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 12px;
  background: var(--bg);
  border: 1px solid rgba(223, 128, 26, 0.08);
}
.location-coords {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.88rem;
  color: var(--text);
}
.location-coords .mdi {
  color: var(--primary);
  font-size: 1.15rem;
}
.location-link {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--primary);
  text-decoration: none;
  flex-shrink: 0;
}
.location-empty {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin: 0;
  padding: 4px;
}

@media (min-width: 640px) {
  .info-grid { grid-template-columns: 1fr 1fr; }
  .section { padding: 24px; }
}
</style>
