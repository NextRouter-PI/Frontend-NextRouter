<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import api from '@/api/client';

const router = useRouter();

const abaAtiva = ref('motoristas');
const busca = ref('');
const carregando = ref(true);
const erro = ref('');

const motoristas = ref([]);
const passageiros = ref([]);
const rotasPorId = ref({});

function asList(data) {
  return Array.isArray(data) ? data : data?.results || [];
}

async function carregar() {
  carregando.value = true;
  erro.value = '';
  try {
    const { data: company } = await api.get('/companies/me/');

    const [{ data: gruposData }, { data: driversData }, { data: passengersData }] = await Promise.all([
      api.get('/company-route-groups/', { params: { company: company.id } }),
      api.get('/drivers/'),
      api.get('/passengers/'),
    ]);

    const grupos = asList(gruposData);
    const mapa = {};
    for (const g of grupos) mapa[g.id] = g.name;
    rotasPorId.value = mapa;

    motoristas.value = asList(driversData);
    passageiros.value = asList(passengersData);
  } catch (error) {
    erro.value = 'Não foi possível carregar os usuários da empresa.';
  } finally {
    carregando.value = false;
  }
}

onMounted(carregar);

function nomeRota(routeGroupId) {
  return rotasPorId.value[routeGroupId] || 'Sem rota atribuída';
}

const motoristasFiltrados = computed(() => {
  const termo = busca.value.toLowerCase();
  return motoristas.value.filter((m) => (m.user_data?.name || '').toLowerCase().includes(termo));
});

const passageirosFiltrados = computed(() => {
  const termo = busca.value.toLowerCase();
  return passageiros.value.filter((p) => (p.user_data?.name || '').toLowerCase().includes(termo));
});

function abrirMotorista(id) {
  router.push(`/usuarios/motorista/${id}`);
}

function abrirPassageiro(id) {
  router.push(`/usuarios/passageiro/${id}`);
}
</script>

<template>
  <div class="content">
    <h1 class="titulo">Usuários</h1>

    <div class="search-container">
      <span class="mdi mdi-magnify search-icon"></span>
      <input v-model="busca" type="text" placeholder="Busque por nome..." />
    </div>

    <div class="tabs">
      <button :class="['tab', { ativo: abaAtiva === 'motoristas' }]" @click="abaAtiva = 'motoristas'">
        Motoristas
      </button>
      <button :class="['tab', { ativo: abaAtiva === 'passageiros' }]" @click="abaAtiva = 'passageiros'">
        Passageiros
      </button>
    </div>

    <p v-if="carregando" class="status-message">Carregando usuários...</p>
    <p v-else-if="erro" class="status-message error">{{ erro }}</p>

    <div v-else-if="abaAtiva === 'motoristas'" class="lista">
      <p v-if="!motoristasFiltrados.length" class="status-message">Nenhum motorista encontrado.</p>
      <button v-for="m in motoristasFiltrados" :key="m.id" class="item-card" @click="abrirMotorista(m.id)">
        <div class="item-icon">
          <span class="mdi mdi-steering"></span>
        </div>
        <div class="item-info">
          <p class="item-nome">{{ m.user_data?.name || 'Nao add no Banco' }}</p>
          <p class="item-rota">{{ nomeRota(m.route_group) }}</p>
        </div>
        <span class="mdi mdi-chevron-right"></span>
      </button>
    </div>

    <div v-else class="lista">
      <p v-if="!passageirosFiltrados.length" class="status-message">Nenhum passageiro encontrado.</p>
      <button v-for="p in passageirosFiltrados" :key="p.id" class="item-card" @click="abrirPassageiro(p.id)">
        <div class="item-icon">
          <span class="mdi mdi-account"></span>
        </div>
        <div class="item-info">
          <p class="item-nome">{{ p.user_data?.name || 'Nao add no Banco' }}</p>
          <p class="item-rota">{{ nomeRota(p.route_group) }}</p>
        </div>
        <span class="mdi mdi-chevron-right"></span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.content {
  margin: 0 auto;
  max-width: 600px;
  padding: 18px 18px 140px;
}

.titulo {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--text);
  margin: 0 0 16px;
}

.search-container {
  position: relative;
  margin-bottom: 16px;
}

.search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
}

.search-container input {
  width: 100%;
  padding: 10px 10px 10px 44px;
  border-radius: 10px;
  border: 1px solid var(--border-primary);
  background: var(--superfice);
  outline: none;
  color: var(--text);
}

.tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
}

.tab {
  flex: 1;
  padding: 10px 16px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: var(--superfice);
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-muted);
  cursor: pointer;
}

.tab.ativo {
  background: rgba(223, 128, 26, 0.08);
  border-color: var(--primary);
  color: var(--primary);
}

.lista {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.item-card {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  padding: 14px 16px;
  border-radius: 14px;
  background: var(--superfice);
  border: 1px solid var(--border);
  box-shadow: var(--shadow);
  cursor: pointer;
  text-align: left;
}

.item-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: rgba(223, 128, 26, 0.1);
  color: var(--primary);
  font-size: 20px;
  flex-shrink: 0;
}

.item-info {
  flex: 1;
  min-width: 0;
}

.item-nome {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text);
}

.item-rota {
  margin: 2px 0 0;
  font-size: 0.8rem;
  color: var(--text-muted);
}

.item-card > .mdi-chevron-right {
  color: var(--text-muted);
  font-size: 22px;
  flex-shrink: 0;
}

.status-message {
  text-align: center;
  color: var(--text-muted);
  padding: 24px 0;
}

.status-message.error {
  color: var(--danger);
}
</style>
