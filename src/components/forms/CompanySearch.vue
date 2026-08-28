<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import api from '@/api/client';
import { state as authState } from '@/stores/state';

const router = useRouter();

const companySearch = ref('');
const selectedCompanyId = ref(null);
const companies = ref([]);
const loading = ref(false);

const routeGroupsByCompany = ref({});
const loadingRouteGroups = ref(false);
const selectedRouteGroupId = ref(null);

const ownPassengerId = ref(null);
const currentRouteGroupId = ref(null);
const loadingPassenger = ref(true);

const submitting = ref(false);
const submitError = ref('');
const submitSuccess = ref(false);

function toList(data) {
  return Array.isArray(data) ? data : data?.results || [];
}

function formatAddress(company) {
  return [company.street, company.number, company.city, company.state]
    .filter(Boolean)
    .join(', ') || 'Endereço não informado';
}

async function fetchCompanies() {
  loading.value = true;
  try {
    const { data } = await api.get('/companies/');
    companies.value = toList(data).map((company) => ({
      id: company.id,
      name: company.trade_name,
      description: formatAddress(company),
      address: formatAddress(company),
      contact: company.contact_email || company.contact_phone || 'Não informado',
    }));
  } catch {
    companies.value = [];
  } finally {
    loading.value = false;
  }
}

async function fetchOwnPassenger() {
  try {
    const { data } = await api.get('/passengers/');
    const list = toList(data);
    const passenger = list.find((p) => p.user_data?.id === authState.user?.id) || null;
    ownPassengerId.value = passenger?.id || null;
    currentRouteGroupId.value = passenger?.route_group || null;
  } catch {
    ownPassengerId.value = null;
  } finally {
    loadingPassenger.value = false;
  }
}

async function fetchRouteGroups(companyId) {
  if (routeGroupsByCompany.value[companyId]) return;
  loadingRouteGroups.value = true;
  try {
    const { data } = await api.get('/company-route-groups/', { params: { company: companyId } });
    routeGroupsByCompany.value = {
      ...routeGroupsByCompany.value,
      [companyId]: toList(data),
    };
  } catch {
    routeGroupsByCompany.value = { ...routeGroupsByCompany.value, [companyId]: [] };
  } finally {
    loadingRouteGroups.value = false;
  }
}

const companySearchNormalized = computed(() => companySearch.value.trim().toLowerCase());
const availableCompanies = computed(() =>
  companies.value.filter((company) =>
    company.name.toLowerCase().includes(companySearchNormalized.value) ||
    company.description.toLowerCase().includes(companySearchNormalized.value)
  )
);

const routeGroupsForSelectedCompany = computed(() => routeGroupsByCompany.value[selectedCompanyId.value] || []);

const toggleCompany = (id) => {
  submitError.value = '';
  submitSuccess.value = false;
  selectedRouteGroupId.value = null;

  if (selectedCompanyId.value === id) {
    selectedCompanyId.value = null;
    return;
  }

  selectedCompanyId.value = id;
  fetchRouteGroups(id);
};

async function requestJoinRouteGroup() {
  if (!ownPassengerId.value || !selectedRouteGroupId.value) return;

  submitting.value = true;
  submitError.value = '';
  submitSuccess.value = false;

  try {
    await api.patch(`/passengers/${ownPassengerId.value}/request-route-group/`, {
      route_group: selectedRouteGroupId.value,
    });
    submitSuccess.value = true;
    currentRouteGroupId.value = selectedRouteGroupId.value;
  } catch (error) {
    submitError.value =
      error.response?.data?.route_group?.[0] ||
      error.response?.data?.detail ||
      'Não foi possível enviar sua solicitação. Tente novamente.';
  } finally {
    submitting.value = false;
  }
}

function goToTransport() {
  router.push({ name: 'transporte' });
}

onMounted(() => {
  fetchCompanies();
  fetchOwnPassenger();
});
</script>

<template>
  <div class="company-selection-view">
    <div class="header-section">
      <span class="label-bold">Informe a empresa que você trabalha:</span>
      <input
        v-model="companySearch"
        class="input-company"
        type="text"
        placeholder="Digite o nome da empresa"
      />
    </div>

    <div v-if="!loadingPassenger && !ownPassengerId" class="notice-banner">
      Este cadastro está disponível apenas para contas de passageiro.
    </div>

    <div v-else-if="currentRouteGroupId && !submitSuccess" class="notice-banner">
      Você já está vinculado a uma rota. Escolher outra empresa abaixo enviará um novo pedido de troca.
    </div>

    <div class="results-section" v-if="companySearch.trim()">
      <h2>Resultados Encontrados:</h2>

      <div v-if="availableCompanies.length">
        <div
          v-for="company in availableCompanies"
          :key="company.id"
          class="company-card"
          :class="{ 'is-expanded': selectedCompanyId === company.id }"
          @click="toggleCompany(company.id)"
        >
          <div class="card-header">
            <h3>{{ company.name }}</h3>
            <span class="arrow-icon">▶</span>
          </div>
          <p class="company-location">{{ company.address }}</p>

          <div class="card-content" v-if="selectedCompanyId === company.id" @click.stop>
            <p>{{ company.description }}</p>
            <div class="contact-info">Contato: {{ company.contact }}</div>

            <div v-if="loadingRouteGroups && !routeGroupsByCompany[company.id]" class="route-groups-loading">
              Carregando rotas...
            </div>

            <div v-else-if="!routeGroupsForSelectedCompany.length" class="route-groups-empty">
              Esta empresa ainda não cadastrou nenhuma rota.
            </div>

            <div v-else class="route-groups-list">
              <span class="route-groups-label">Escolha a rota:</span>
              <label
                v-for="group in routeGroupsForSelectedCompany"
                :key="group.id"
                class="route-group-option"
              >
                <input
                  type="radio"
                  :name="`route-group-${company.id}`"
                  :value="group.id"
                  v-model="selectedRouteGroupId"
                />
                {{ group.name }}
              </label>

              <p v-if="submitSuccess" class="submit-success">
                Solicitação enviada! Aguarde a aprovação da empresa.
              </p>
              <p v-if="submitError" class="submit-error">{{ submitError }}</p>

              <button
                v-if="!submitSuccess"
                type="button"
                class="btn-register"
                :disabled="!selectedRouteGroupId || submitting"
                @click="requestJoinRouteGroup"
              >
                {{ submitting ? 'Enviando...' : 'Cadastrar nesta empresa' }}
              </button>
              <button v-else type="button" class="btn-register" @click="goToTransport">
                Ir para Meu Transporte
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="no-results">
        Nenhuma empresa encontrada com este nome.
      </div>
    </div>
  </div>
</template>

<style scoped>
.company-selection-view {
  max-width: 700px;
  margin: 3rem auto;
  padding: 1.5rem;
}

.header-section {
  text-align: left;
  padding: 10px;
}

.label-bold {
  font-weight: 800;
  font-size: 1.1rem;
  margin-bottom: 15px;
  display: block;
}

.input-company {
  width: 100%;
  padding: 12px;
  border: 2px solid #f48a1d;
  border-radius: 10px;
  color: #111;
  font-size: 14px;
}

.input-company::placeholder {
  color: #f48a1d;
  opacity: 0.5;
}

.notice-banner {
  margin: 0 10px 1rem;
  padding: 12px 15px;
  background: #ffedd5;
  color: #7c3a00;
  border-radius: 10px;
  font-size: 0.9rem;
}

.results-section {
  margin-top: 1.5rem;
}

.results-section h2 {
  margin-bottom: 1rem;
  color: #111;
  font-size: 1.2rem;
}

.company-card {
  background-color: #f97316;
  border-radius: 12px;
  margin-bottom: 12px;
  padding: 15px;
  color: white;
  cursor: pointer;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.company-card:hover {
  transform: translateY(-2px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: bold;
}

.arrow-icon {
  transition: transform 0.3s ease;
}

.company-card.is-expanded .arrow-icon {
  transform: rotate(90deg);
}

.company-location {
  opacity: 0.9;
  margin-top: 8px;
  font-size: 0.95rem;
}

.card-content {
  margin-top: 15px;
  font-size: 0.95rem;
  line-height: 1.5;
  text-align: left;
  cursor: default;
}

.contact-info {
  margin-top: 10px;
  font-weight: bold;
}

.route-groups-loading,
.route-groups-empty {
  margin-top: 12px;
  font-size: 0.9rem;
  opacity: 0.9;
}

.route-groups-list {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.route-groups-label {
  font-weight: bold;
  margin-bottom: 4px;
}

.route-group-option {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  padding: 8px 12px;
  cursor: pointer;
}

.submit-success {
  margin-top: 8px;
  font-weight: bold;
  color: #dcfce7;
}

.submit-error {
  margin-top: 8px;
  font-weight: bold;
  color: #fee2e2;
}

.btn-register {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  background-color: white;
  color: #333;
  border: none;
  width: 100%;
  padding: 10px;
  border-radius: 6px;
  margin-top: 15px;
  font-weight: bold;
  cursor: pointer;
  text-transform: none;
  text-decoration: none;
}

.btn-register:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.no-results {
  color: #333;
  font-size: 0.95rem;
  padding: 1rem;
  background: #ffedd5;
  border-radius: 10px;
}
</style>
