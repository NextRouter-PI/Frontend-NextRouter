<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { state } from '@/stores/state.js'
import api from '@/api/client'
import { useUploadImage } from '@/stores/useUploadImage'
import { useInputFormat } from '@/composables/useInputFormat'
import { useValidator } from '@/composables/useValidation'
import { useTransporteStore } from '@/stores/useTransporteStore'
import AvatarUploader from '@/components/layout/AvatarUpload.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import FormField from '@/components/ui/FormField.vue'
import FormattedField from '@/components/ui/FormattedField.vue'

const { formatPhone } = useInputFormat()
const { getCEP } = useValidator()
const { state: uploadState, upload: uploadImage } = useUploadImage()
const transporteStore = useTransporteStore()

const loading = ref(true)
const saving = ref(false)
const error = ref('')
const toast = ref(null)
const profileData = ref(null)
const isEditingProfile = ref(false)
const isEditingAddress = ref(false)

const refreshing = ref(false)
const pullDistance = ref(0)
const touchStartY = ref(0)
const pulling = ref(false)

const memberSince = computed(() => {
  if (!profileData.value?.created_at) return ''
  return new Date(profileData.value.created_at).toLocaleString('pt-BR', {
    month: 'long',
    year: 'numeric',
  })
})

const completionPercent = computed(() => {
  if (!profileData.value) return 0
  const fields = ['name', 'email', 'phone', 'bio', 'cnpj', 'company_name', 'address']
  return Math.round((fields.filter((f) => profileData.value[f]).length / fields.length) * 100)
})

const editForm = reactive({
  name: '',
  email: '',
  password: '',
  phone: '',
  bio: '',
  cnpj: '',
  company_name: '',
})

const addressForm = reactive({
  cep: '',
  street: '',
  number: '',
  neighborhood: '',
  city: '',
  state: '',
})

const companyData = ref(null)

const veiculosTotal = computed(() => transporteStore.veiculos.length)
const veiculosAtivos = computed(
  () => transporteStore.veiculos.filter((v) => v.status === 'Ativo').length,
)
const veiculosManutencao = computed(
  () => transporteStore.veiculos.filter((v) => v.status === 'Manutenção').length,
)

const motoristasTotal = computed(() => {
  const nomes = new Set(transporteStore.veiculos.map((v) => v.motorista).filter(Boolean))
  return nomes.size
})

function formatCNPJDisplay(cnpj) {
  if (!cnpj) return '—'
  const d = cnpj.replace(/\D/g, '')
  if (d.length !== 14) return cnpj
  return d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
}

function parseAddress(addr) {
  if (!addr) return {}
  if (typeof addr === 'object') return addr
  try {
    return JSON.parse(addr)
  } catch {
    return { raw: addr }
  }
}

function formatAddress(addr) {
  const p = parseAddress(addr)
  if (p.raw) return p.raw
  return (
    [
      p.street,
      p.number && `nº ${p.number}`,
      p.neighborhood,
      p.city && p.state && `${p.city} - ${p.state}`,
    ]
      .filter(Boolean)
      .join(', ') || 'Nenhum endereço cadastrado'
  )
}

function showToast(message, type = 'success') {
  toast.value = { message, type }
  setTimeout(() => {
    toast.value = null
  }, 3000)
}

async function fetchProfile() {
  loading.value = true
  error.value = ''
  try {
    const [userRes, companyRes] = await Promise.all([
      api.get('/users/me/'),
      api.get('/companies/me/').catch(() => null),
    ])
    const userData = userRes.data
    userData.avatar = userData.profile_picture?.url || null
    profileData.value = userData
    companyData.value = companyRes?.data || null
    Object.assign(state.user, userData)
    if (companyRes?.data) {
      state.user.cnpj = companyRes.data.cnpj
      state.user.company_name = companyRes.data.legal_name
      state.user.trade_name = companyRes.data.trade_name
      state.user.is_approved = companyRes.data.is_approved
      profileData.value.cnpj = companyRes.data.cnpj
      profileData.value.company_name = companyRes.data.legal_name
    }
    localStorage.setItem('user', JSON.stringify(state.user))
  } catch {
    error.value = 'Erro ao carregar perfil'
    profileData.value = state.user
  } finally {
    loading.value = false
  }
}

async function handleRefresh() {
  refreshing.value = true
  await fetchProfile()
  refreshing.value = false
}

function onTouchStart(e) {
  if (window.scrollY > 0) return
  touchStartY.value = e.touches[0].clientY
  pulling.value = true
}

function onTouchMove(e) {
  if (!pulling.value) return
  const dy = e.touches[0].clientY - touchStartY.value
  if (dy > 0) pullDistance.value = Math.min(dy * 0.5, 100)
}

function onTouchEnd() {
  if (!pulling.value) return
  pulling.value = false
  if (pullDistance.value >= 60) handleRefresh()
  pullDistance.value = 0
}

onMounted(() => {
  fetchProfile()
  window.addEventListener('touchstart', onTouchStart, { passive: true })
  window.addEventListener('touchmove', onTouchMove, { passive: true })
  window.addEventListener('touchend', onTouchEnd, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('touchstart', onTouchStart)
  window.removeEventListener('touchmove', onTouchMove)
  window.removeEventListener('touchend', onTouchEnd)
})

async function handlePhoto(file) {
  try {
    const data = await uploadImage(file, 'avatar')
    if (data?.url) {
      profileData.value.avatar = data.url
      state.user.avatar = data.url
    }
    showToast('Foto atualizada!')
  } catch {
    showToast('Erro ao enviar foto', 'error')
  }
}

function toggleEditProfile() {
  isEditingProfile.value = !isEditingProfile.value
  if (!isEditingProfile.value) return
  Object.assign(editForm, {
    name: state.user.name,
    email: state.user.email,
    password: '',
    phone: state.user.phone,
    bio: state.user.bio,
    cnpj: state.user.cnpj,
    company_name: state.user.company_name,
  })
}

async function saveChanges() {
  saving.value = true
  const payload = {
    name: editForm.name,
    email: editForm.email,
    phone: editForm.phone.replace(/\D/g, ''),
    bio: editForm.bio,
    cnpj: editForm.cnpj.replace(/\D/g, ''),
    company_name: editForm.company_name,
  }
  if (editForm.password) payload.password = editForm.password
  try {
    const { data } = await api.patch('/users/me/', payload)
    Object.assign(state.user, data)
    localStorage.setItem('user', JSON.stringify(data))
    profileData.value = data
    isEditingProfile.value = false
    editForm.password = ''
    showToast('Perfil atualizado!')
  } catch {
    showToast('Erro ao salvar', 'error')
  } finally {
    saving.value = false
  }
}

function toggleEditAddress() {
  isEditingAddress.value = !isEditingAddress.value
  if (!isEditingAddress.value) return
  const p = parseAddress(state.user.address)
  Object.assign(addressForm, {
    cep: p.cep || '',
    street: p.street || '',
    number: p.number || '',
    neighborhood: p.neighborhood || '',
    city: p.city || '',
    state: p.state || '',
  })
}

async function lookupCep() {
  if (addressForm.cep.replace(/\D/g, '').length !== 8) return
  await getCEP(addressForm)
}

async function saveAddress() {
  saving.value = true
  try {
    const addr = JSON.stringify({
      cep: addressForm.cep.replace(/\D/g, ''),
      street: addressForm.street,
      number: addressForm.number,
      neighborhood: addressForm.neighborhood,
      city: addressForm.city,
      state: addressForm.state,
    })
    const { data } = await api.patch('/users/me/', { address: addr })
    state.user.address = data.address
    profileData.value.address = data.address
    isEditingAddress.value = false
    showToast('Endereço atualizado!')
  } catch {
    showToast('Erro ao salvar endereço', 'error')
  } finally {
    saving.value = false
  }
}

function cancelAddressEdit() {
  isEditingAddress.value = false
}
</script>

<template>
  <div class="profile-page" :class="{ refreshing }">
    <transition name="toast">
      <div v-if="toast" :class="['toast', toast.type]">
        <span
          class="mdi"
          :class="toast.type === 'error' ? 'mdi-alert-circle-outline' : 'mdi-check-circle-outline'"
        ></span>
        {{ toast.message }}
      </div>
    </transition>

    <div
      class="pull-indicator"
      :style="{ height: pullDistance + 'px', opacity: pullDistance / 80 }"
    >
      <span
        class="mdi"
        :class="pullDistance >= 60 ? 'mdi-loading mdi-spin' : 'mdi-arrow-down'"
      ></span>
    </div>

    <div class="cover">
      <div class="cover-avatar">
        <AvatarUploader
          v-if="profileData"
          :model-value="profileData.avatar"
          @file-select="handlePhoto"
        />
        <div v-if="uploadState.uploading" class="upload-overlay">
          <span class="mdi mdi-loading mdi-spin"></span>
        </div>
      </div>
    </div>

    <div class="profile-body">
      <template v-if="loading">
        <div class="skeleton-ring"></div>
        <div class="skeleton-head"></div>
        <div class="skeleton-bar"></div>
        <div class="skeleton-stats">
          <div class="skeleton stat"></div>
          <div class="skeleton stat"></div>
          <div class="skeleton stat"></div>
        </div>
        <div class="skeleton section"></div>
        <div class="skeleton section short"></div>
      </template>

      <template v-else-if="error && !profileData">
        <div class="error-state">
          <span class="mdi mdi-cloud-alert"></span>
          <p>{{ error }}</p>
          <BaseButton variant="primary" @click="fetchProfile">Tentar novamente</BaseButton>
        </div>
      </template>

      <template v-else>
        <div class="profile-head">
          <h1 class="profile-name">{{ state.user.name }}</h1>
          <p class="profile-tag">{{ state.user.email }}</p>
          <p v-if="state.user.bio" class="profile-bio">{{ state.user.bio }}</p>
          <div class="profile-badge">
            <span class="mdi mdi-domain"></span>
            Empresa
          </div>
        </div>

        <div class="completion-bar">
          <div class="completion-track">
            <div class="completion-fill" :style="{ width: completionPercent + '%' }"></div>
          </div>
          <span class="completion-pct">{{ completionPercent }}%</span>
        </div>

        <div class="stats-row">
          <div class="stat">
            <span class="stat-value">{{ memberSince || '—' }}</span>
            <span class="stat-label">Membro desde</span>
          </div>
          <div class="stat">
            <span class="stat-value">{{ veiculosTotal }}</span>
            <span class="stat-label">Veículos</span>
          </div>
          <div class="stat">
            <span class="stat-value">{{ motoristasTotal }}</span>
            <span class="stat-label">Motoristas</span>
          </div>
        </div>

        <div class="action-bar">
          <BaseButton
            :variant="isEditingProfile ? 'outline' : 'primary'"
            :icon="isEditingProfile ? 'mdi-close' : 'mdi-account-edit-outline'"
            @click="toggleEditProfile"
          >
            {{ isEditingProfile ? 'Cancelar' : 'Editar Perfil' }}
          </BaseButton>
        </div>

        <transition name="slide" mode="out-in">
          <div v-if="!isEditingProfile" class="section">
            <div class="section-header">
              <span class="mdi mdi-information-outline"></span>
              <h2>Informações da Empresa</h2>
            </div>
            <div class="info-grid">
              <div
                v-for="item in [
                  { label: 'Nome Fantasia', value: state.user.trade_name || state.user.name },
                  { label: 'Razão Social', value: state.user.company_name || '—' },
                  { label: 'Email', value: state.user.email },
                  { label: 'Telefone', value: state.user.phone || '—' },
                  { label: 'Senha', value: '••••••••••', cls: 'password-mask' },
                  { label: 'CNPJ', value: formatCNPJDisplay(state.user.cnpj) },
                ]"
                :key="item.label"
                class="info-item"
              >
                <span class="info-label">{{ item.label }}</span>
                <span class="info-value" :class="item.cls">{{ item.value }}</span>
              </div>
            </div>
          </div>

          <div v-else class="section">
            <div class="section-header">
              <span class="mdi mdi-pencil-circle-outline"></span>
              <h2>Editar Informações</h2>
            </div>
            <form class="edit-form" @submit.prevent="saveChanges">
              <FormField v-model="editForm.name" label="Nome" required />
              <FormField v-model="editForm.email" label="Email" type="email" required />
              <FormattedField
                v-model="editForm.phone"
                label="Telefone"
                placeholder="(99) 99999-9999"
                :format="formatPhone"
              />
              <FormField
                v-model="editForm.password"
                label="Nova Senha"
                type="password"
                placeholder="Deixe em branco para manter"
              />
              <FormField
                v-model="editForm.bio"
                label="Bio"
                placeholder="Fale um pouco sobre a empresa"
              />
              <div class="field-row">
                <div class="field-group readonly">
                  <label>CNPJ</label>
                  <input :value="formatCNPJDisplay(state.user.cnpj)" disabled />
                </div>
                <div class="field-group readonly">
                  <label>Razão Social</label>
                  <input :value="state.user.company_name || state.user.trade_name || '—'" disabled />
                </div>
              </div>
              <BaseButton variant="primary" block :loading="saving" @click="saveChanges"
                >Salvar Alterações</BaseButton
              >
            </form>
          </div>
        </transition>

        <div class="section">
          <div class="section-header">
            <span class="mdi mdi-truck-outline"></span>
            <h2>Frota</h2>
          </div>
          <div class="fleet-grid">
            <div class="fleet-item">
              <span class="fleet-value">{{ veiculosTotal }}</span>
              <span class="fleet-label">Total</span>
            </div>
            <div class="fleet-item">
              <span class="fleet-value active">{{ veiculosAtivos }}</span>
              <span class="fleet-label">Ativos</span>
            </div>
            <div class="fleet-item">
              <span class="fleet-value maintenance">{{ veiculosManutencao }}</span>
              <span class="fleet-label">Manutenção</span>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-header">
            <span class="mdi mdi-map-marker-outline"></span>
            <h2>Endereço</h2>
          </div>
          <div class="address-card">
            <div v-if="!isEditingAddress" class="address-display">
              <div class="address-icon-wrap">
                <span class="mdi mdi-home-outline"></span>
              </div>
              <div class="address-text">
                <p>{{ formatAddress(state.user.address) }}</p>
                <span v-if="state.user.address" class="address-hint"
                  >Clique no lápis para editar</span
                >
              </div>
              <button class="btn-icon" @click="toggleEditAddress">
                <span class="mdi mdi-pencil-outline"></span>
              </button>
            </div>
            <div v-else class="address-edit">
              <div class="cep-row">
                <FormField
                  v-model="addressForm.cep"
                  label="CEP"
                  placeholder="00000-000"
                  maxlength="9"
                />
                <BaseButton variant="outline" size="sm" icon="mdi-magnify" @click="lookupCep" />
              </div>
              <div class="field-row">
                <FormField v-model="addressForm.street" label="Rua" placeholder="Nome da rua" />
                <FormField v-model="addressForm.number" label="Número" placeholder="nº" />
              </div>
              <div class="field-row">
                <FormField v-model="addressForm.neighborhood" label="Bairro" placeholder="Bairro" />
                <FormField v-model="addressForm.city" label="Cidade" placeholder="Cidade" />
              </div>
              <FormField
                v-model="addressForm.state"
                label="Estado"
                placeholder="UF"
                maxlength="2"
              />
              <div class="address-actions">
                <BaseButton variant="primary" size="sm" :loading="saving" @click="saveAddress"
                  >Salvar</BaseButton
                >
                <BaseButton variant="outline" size="sm" @click="cancelAddressEdit"
                  >Cancelar</BaseButton
                >
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
  position: relative;
  transition: filter 0.3s;
}
.profile-page.refreshing {
  filter: blur(0.5px);
}

.pull-indicator {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg);
  color: var(--primary);
  font-size: 1.2rem;
  overflow: hidden;
  pointer-events: none;
}

.toast {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 999;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 24px;
  border-radius: 12px;
  font-size: 0.88rem;
  font-weight: 600;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
  pointer-events: none;
  backdrop-filter: blur(12px);
}
.toast.success {
  background: rgba(5, 150, 105, 0.95);
  color: #fff;
}
.toast.error {
  background: rgba(220, 38, 38, 0.95);
  color: #fff;
}
.toast .mdi {
  font-size: 1.2rem;
}
.toast-enter-active {
  transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.toast-leave-active {
  transition: all 0.2s ease;
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(-50%) translateY(-24px) scale(0.9);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-16px);
}

.cover {
  position: relative;
  width: 100%;
  height: 160px;
  background: #df801a;
  margin-bottom: 66px;
}
.cover-avatar {
  position: absolute;
  bottom: -48px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2;
}
.cover-avatar :deep(.avatar-circle) {
  width: 106px;
  height: 106px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}
.upload-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 106px;
  height: 106px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.45);
  color: #fff;
  font-size: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.skeleton {
  background: linear-gradient(
    90deg,
    var(--superfice) 25%,
    rgba(223, 128, 26, 0.06) 50%,
    var(--superfice) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  border-radius: 12px;
}
@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
.skeleton-ring {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  margin: -10px auto 16px;
  background: var(--superfice);
}
.skeleton-head {
  width: 160px;
  height: 22px;
  margin: 0 auto 12px;
  border-radius: 6px;
  background: var(--superfice);
}
.skeleton-bar {
  width: 200px;
  height: 6px;
  margin: 0 auto 16px;
  border-radius: 99px;
  background: var(--superfice);
}
.skeleton-stats {
  display: flex;
  justify-content: center;
  gap: 24px;
  margin-bottom: 24px;
}
.skeleton.stat {
  width: 80px;
  height: 44px;
}
.skeleton.section {
  height: 200px;
  margin-bottom: 16px;
}
.skeleton.short {
  height: 80px;
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
  margin-bottom: 20px;
}

.profile-body {
  max-width: 600px;
  margin: 0 auto;
  padding: 0 20px;
}
.profile-head {
  text-align: center;
  margin-bottom: 16px;
}
.profile-name {
  font-size: 1.45rem;
  font-weight: 800;
  color: var(--text);
  margin: 0 0 3px;
  line-height: 1.2;
}
.profile-tag {
  font-size: 0.82rem;
  color: var(--text-muted);
  margin: 0 0 6px;
}
.profile-bio {
  font-size: 0.88rem;
  color: var(--text-muted);
  margin: 0 auto 8px;
  max-width: 400px;
  line-height: 1.5;
  font-style: italic;
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

.completion-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding: 0 4px;
}
.completion-track {
  flex: 1;
  height: 6px;
  background: rgba(223, 128, 26, 0.12);
  border-radius: 99px;
  overflow: hidden;
}
.completion-fill {
  height: 100%;
  border-radius: 99px;
  background: var(--gradient-primary);
  transition: width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.completion-pct {
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--primary);
  flex-shrink: 0;
}

.stats-row {
  display: flex;
  justify-content: center;
  gap: 32px;
  padding: 14px 0;
  margin-bottom: 20px;
  border-top: 1px solid rgba(223, 128, 26, 0.1);
  border-bottom: 1px solid rgba(223, 128, 26, 0.1);
}
.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}
.stat-value {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text);
  text-align: center;
  line-height: 1.3;
}
.stat-label {
  font-size: 0.6rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-muted);
  font-weight: 600;
}

.action-bar {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}

.section {
  background: var(--superfice);
  border: 1px solid rgba(223, 128, 26, 0.12);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}
.dark .section {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.12);
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
.password-mask {
  letter-spacing: 3px;
}

.edit-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.field-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.cep-row {
  display: flex;
  gap: 8px;
  align-items: flex-end;
}
.cep-row > :first-child {
  flex: 1;
}
.cep-row :deep(.form-field) {
  margin-bottom: 0;
}

.address-card {
  border-radius: 12px;
  background: var(--bg);
  border: 1px solid rgba(223, 128, 26, 0.08);
  overflow: hidden;
}
.address-display {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
}
.address-icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: rgba(223, 128, 26, 0.08);
  flex-shrink: 0;
}
.address-icon-wrap .mdi {
  font-size: 1.3rem;
  color: var(--primary);
}
.address-text {
  flex: 1;
  min-width: 0;
}
.address-text p {
  margin: 0;
  font-size: 0.88rem;
  color: var(--text);
  line-height: 1.4;
}
.address-hint {
  font-size: 0.65rem;
  color: var(--text-muted);
  margin-top: 3px;
  display: block;
}
.address-edit {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
}
.address-actions {
  display: flex;
  gap: 8px;
  margin-top: 4px;
}

.fleet-grid {
  display: flex;
  gap: 12px;
}
.fleet-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 16px 12px;
  background: var(--bg);
  border-radius: 12px;
  border: 1px solid rgba(223, 128, 26, 0.08);
}
.fleet-value {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--text);
}
.fleet-value.active {
  color: var(--success);
}
.fleet-value.maintenance {
  color: var(--danger);
}
.fleet-label {
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-muted);
  font-weight: 600;
}

.btn-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: var(--primary);
  font-size: 1.15rem;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}
.btn-icon:hover {
  background: rgba(223, 128, 26, 0.1);
}

.slide-enter-active,
.slide-leave-active {
  transition:
    opacity 0.22s ease,
    transform 0.22s ease;
}
.slide-enter-from {
  opacity: 0;
  transform: translateY(10px);
}
.slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

@media (min-width: 640px) {
  .cover {
    height: 200px;
    margin-bottom: 76px;
  }
  .cover-avatar :deep(.avatar-circle) {
    width: 120px;
    height: 120px;
  }
  .cover-avatar {
    bottom: -55px;
  }
  .upload-overlay {
    width: 120px;
    height: 120px;
  }
  .profile-name {
    font-size: 1.65rem;
  }
  .profile-body {
    padding: 0 24px;
  }
  .info-grid {
    grid-template-columns: 1fr 1fr;
  }
  .section {
    padding: 24px;
  }
  .stats-row {
    gap: 48px;
  }
  .stat-value {
    font-size: 1rem;
  }
}
@media (min-width: 1024px) {
  .profile-body {
    max-width: 680px;
    padding: 0 32px;
  }
  .cover {
    height: 240px;
  }
}
</style>
