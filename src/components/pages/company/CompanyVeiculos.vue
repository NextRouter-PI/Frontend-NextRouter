<script setup>
import { ref, computed } from 'vue';
import { useTransporteStore } from '@/stores/useTransporteStore';
import { useRouter } from 'vue-router';

const store = useTransporteStore();
const busca = ref('');
const filtroAtivo = ref('Todas');

const alterarStatus = (id) => {
  store.alterarStatus(id);
  menuAberto.value = null;
};

const veiculosFiltrados = computed(() => {
  const lista = store.veiculos || [];
  return lista.filter(v => {
    const correspondeBusca = v.placa.toLowerCase().includes(busca.value.toLowerCase()) ||
      v.modelo.toLowerCase().includes(busca.value.toLowerCase());

    const statusParaFiltro = filtroAtivo.value === 'Ativas' ? 'Ativo' : filtroAtivo.value;
    const correspondeFiltro = filtroAtivo.value === 'Todas' || v.status === statusParaFiltro;

    return correspondeBusca && correspondeFiltro;
  });
});

const router = useRouter();
const cadastrar = () => {
  router.push('/cadastro-veiculo');
};

const menuAberto = ref(null);

const toggleMenu = (id) => {
  menuAberto.value = menuAberto.value === id ? null : id;
};
</script>

<template>
  <div class="content">
    <div class="search-container">
      <span class="mdi mdi-magnify search-icon"></span>
      <input v-model="busca" type="text" placeholder="Busque por placa, modelo..." />
    </div>

    <div class="filter-chips">
      <button v-for="f in ['Todas', 'Ativas', 'Manutenção']" :key="f" :class="['chip', { active: filtroAtivo === f }]"
        @click="filtroAtivo = f">
        {{ f }}
      </button>
    </div>

    <div class="list-container">
      <div v-for="veiculo in veiculosFiltrados" :key="veiculo.id" class="transport-card">
        <div class="card-header">
          <div class="header-main">
            <h3>{{ veiculo.placa }}</h3>
            <p class="card-subtitle">{{ veiculo.modelo }}</p>
          </div>

          <div class="menu-container">
            <button class="menu-dots" @click="toggleMenu(veiculo.id)">
              <span class="mdi mdi-dots-vertical"></span>
            </button>

            <div v-if="menuAberto === veiculo.id" class="menu-dropdown">
              <button @click="router.push(`/veiculos/editar/${veiculo.id}`)">
                Editar informações do veículo
              </button>
              <button @click="alterarStatus(veiculo.id)">
                {{ veiculo.status === 'Ativo' ? 'Enviar para a manutenção' : 'Retirar de manutenção' }}
              </button>
            </div>
          </div>
        </div>

        <div class="card-details">
          <div class="detail-item">
            <span class="mdi mdi-seat-passenger"></span>
            <span>{{ veiculo.capacidade }} Lugares</span>
          </div>
          <div class="detail-item">
            <span class="mdi mdi-account-outline"></span>
            <span>{{ veiculo.motorista }}</span>
          </div>
        </div>

        <span :class="['status-tag', veiculo.status.toLowerCase()]">
          {{ veiculo.status }}
        </span>
      </div>
    </div>

    <button class="fab-add" @click="cadastrar">
      <span class="mdi mdi-plus"></span>
    </button>
  </div>
</template>

<style scoped>
.content {
  margin: 0 auto;
  max-width: 600px;
  padding: 18px 18px 140px;
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

.filter-chips {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
}

.chip {
  padding: 6px 16px;
  border-radius: 20px;
  border: 1px solid var(--border);
  background: var(--superfice);
  font-size: 0.85rem;
  color: var(--text-muted);
}

.chip.active {
  background: rgba(223, 128, 26, 0.08);
  border-color: var(--primary);
  color: var(--primary);
}

.transport-card {
  background: var(--superfice);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 14px;
  border: 1px solid var(--border);
  box-shadow: var(--shadow);
}

.card-header h3 {
  font-size: 1.3rem;
  font-weight: 800;
  margin: 0;
  color: var(--text);
}

.card-subtitle {
  color: var(--text-muted);
  font-size: 0.95rem;
  margin-top: 4px;
}

.card-details {
  display: flex;
  gap: 16px;
  margin: 12px 0;
  color: var(--text-muted);
  font-size: 0.8rem;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.menu-container {
  position: relative;
}

.menu-dots {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 24px;
  color: var(--text-muted);
}

.menu-dropdown {
  position: absolute;
  bottom: 34px;
  right: 0;
  width: 220px;
  background: var(--primary);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: var(--shadow-primary);
  z-index: 100;
}

@media (min-width: 640px) {
  .menu-dropdown {
    bottom: auto;
    top: 34px;
  }
}

.menu-dropdown button {
  width: 100%;
  padding: 14px 12px;
  background: transparent;
  border: none;
  color: white;
  font-size: 14px;
  text-align: left;
  cursor: pointer;
}

.menu-dropdown button:not(:last-child) {
  border-bottom: 1px solid rgba(255, 255, 255, .35);
}

.menu-dropdown button:hover {
  background: rgba(255, 255, 255, .1);
}

.status-tag {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 8px;
  font-size: 0.80rem;
  font-weight: 700;
}

.status-tag.ativo {
  background-color: rgba(34, 197, 94, 0.15);
  color: var(--success);
}

.status-tag.manutenção {
  background-color: rgba(239, 68, 68, 0.1);
  color: var(--danger);
}

.fab-add {
  position: fixed;
  bottom: 90px;
  right: 24px;
  width: 60px;
  height: 60px;
  border-radius: 30px;
  background: var(--gradient-primary);
  color: white;
  border: none;
  font-size: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-primary);
  transition: transform 0.2s ease;
}

.fab-add:hover {
  transform: scale(1.05);
}

.fab-add:active {
  transform: scale(0.95);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}
</style>
