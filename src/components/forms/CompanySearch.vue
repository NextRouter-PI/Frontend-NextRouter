<script setup>
import { ref, computed, onMounted } from 'vue';
import { RouterLink } from 'vue-router';
import api from '@/api/client';

const companySearch = ref('');
const selectedCompanyId = ref(null);
const companies = ref([]);
const loading = ref(false);

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

const companySearchNormalized = computed(() => companySearch.value.trim().toLowerCase());
const availableCompanies = computed(() =>
  companies.value.filter((company) =>
    company.name.toLowerCase().includes(companySearchNormalized.value) ||
    company.description.toLowerCase().includes(companySearchNormalized.value)
  )
);

const toggleCompany = (id) => {
  selectedCompanyId.value = selectedCompanyId.value === id ? null : id;
};

onMounted(() => {
  fetchCompanies();
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

          <div class="card-content" v-if="selectedCompanyId === company.id">
            <p>{{ company.description }}</p>
            <div class="contact-info">Contato: {{ company.contact }}</div>
            <RouterLink
              to="/signup/motorista"
              class="btn-register"
              @click.stop
            >
              Cadastrar nesta empresa
            </RouterLink>
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
}

.contact-info {
  margin-top: 10px;
  font-weight: bold;
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

.no-results {
  color: #333;
  font-size: 0.95rem;
  padding: 1rem;
  background: #ffedd5;
  border-radius: 10px;
}
</style>
