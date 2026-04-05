<script setup>
import { ref, computed } from 'vue';
import { RouterLink } from 'vue-router';

const city = ref('');
const selectedCompanyId = ref(null);

const companies = [
  {
    id: 1,
    city: 'São Paulo',
    name: 'TransLog',
    description: 'Serviço rápido e confiável para deslocamentos urbanos.',
    address: 'Av. Paulista, 1000',
    price: 'R$ 29,90 por corrida'
  },
  {
    id: 2,
    city: 'São Paulo',
    name: 'CityRide',
    description: 'Tecnologia para facilitar sua viagem na cidade.',
    address: 'Rua das Flores, 255',
    price: 'R$ 34,50 por corrida'
  },
  {
    id: 3,
    city: 'Rio de Janeiro',
    name: 'Carioca Transportes',
    description: 'Atendimento 24h na região do Rio de Janeiro.',
    address: 'Av. Atlântica, 500',
    price: 'R$ 31,00 por corrida'
  }
];

const cityNormalized = computed(() => city.value.trim().toLowerCase());
const availableCompanies = computed(() =>
  companies.filter((company) =>
    company.city.toLowerCase().includes(cityNormalized.value)
  )
);

const toggleCompany = (id) => {
  selectedCompanyId.value = selectedCompanyId.value === id ? null : id;
};
</script>

<template>
  <div class="city-selection-view">
    <div class="header-section">
      <span class="label-bold">Informe a cidade em que você reside:</span>
      <input
        v-model="city"
        class="input-city"
        type="text"
        placeholder="Digite sua cidade"
      />
    </div>

    <div class="results-section" v-if="city.trim()">
      <h2>Empresas disponíveis na região</h2>

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
            <div class="price-info">{{ company.price }}</div>
            <RouterLink
              to="/signup/usuario"
              class="btn-register"
              @click.stop
            >
              Selecionar esta empresa
            </RouterLink>
          </div>
        </div>
      </div>

      <div v-else class="no-results">
        Nenhuma empresa encontrada para esta cidade ainda.
      </div>
    </div>
  </div>
</template>

<style scoped>
.city-selection-view {
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

.input-city {
  width: 100%;
  padding: 12px;
  border: 2px solid #f48a1d;
  border-radius: 10px;
  color: #111;
  font-size: 14px;
}

.input-city::placeholder {
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

.price-info {
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
