<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRotasStore } from '@/stores/useRotasStore';
import { useRouter } from 'vue-router';

const store = useRotasStore();
const router = useRouter();

const busca = ref('');
const menuAberto = ref(null);
const toast = ref(null);
const excluindoId = ref(null);
const selecaoVeiculo = ref({});
const selecaoMotorista = ref({});
const selecaoPassageiro = ref({});

onMounted(() => {
  store.fetchRotas();
});

function showToast(message, type = 'success') {
  toast.value = { message, type };
  setTimeout(() => { toast.value = null; }, 4000);
}

const gruposFiltrados = computed(() => {
  const lista = store.grupos || [];
  const termo = busca.value.toLowerCase();
  if (!termo) return lista;
  return lista.filter((g) => g.name.toLowerCase().includes(termo));
});

const toggleMenu = (id) => {
  menuAberto.value = menuAberto.value === id ? null : id;
};

const editarRota = (id) => {
  menuAberto.value = null;
  router.push(`/rotas/editar/${id}`);
};

const excluirRota = async (grupo) => {
  menuAberto.value = null;
  excluindoId.value = grupo.id;
  const resultado = await store.removerRota(grupo.id);
  excluindoId.value = null;

  if (resultado.success) {
    showToast('Rota excluída com sucesso.');
  } else if (resultado.status === 400 || resultado.status === 409) {
    showToast(resultado.detail, 'error');
  } else {
    showToast('Erro ao excluir a rota.', 'error');
  }
};

function veiculosDisponiveis(grupo) {
  return (store.todosVeiculos || []).filter((v) => v.route_group !== grupo.id);
}

function motoristasDisponiveis(grupo) {
  return (store.todosMotoristas || []).filter((d) => d.route_group !== grupo.id);
}

function passageirosDisponiveis(grupo) {
  return (store.todosPassageiros || []).filter((p) => p.route_group !== grupo.id);
}

async function atribuirVeiculo(grupo) {
  const vehicleId = selecaoVeiculo.value[grupo.id];
  if (!vehicleId) return;

  const resultado = await store.atribuirVeiculo(vehicleId, grupo.id);
  if (resultado) {
    showToast('Veículo atribuído à rota.');
    selecaoVeiculo.value[grupo.id] = '';
    await store.fetchRotas();
  } else {
    showToast(typeof store.error === 'string' ? store.error : 'Erro ao atribuir veículo.', 'error');
  }
}

async function atribuirMotorista(grupo) {
  const driverId = selecaoMotorista.value[grupo.id];
  if (!driverId) return;

  const resultado = await store.atribuirMotorista(driverId, grupo.id);
  if (resultado) {
    showToast('Motorista atribuído à rota.');
    selecaoMotorista.value[grupo.id] = '';
    await store.fetchRotas();
  } else {
    showToast(typeof store.error === 'string' ? store.error : 'Erro ao atribuir motorista.', 'error');
  }
}

async function desvincularMotorista(driverId) {
  const resultado = await store.desvincularMotorista(driverId);
  if (resultado) {
    showToast('Motorista desvinculado da rota.');
    await store.fetchRotas();
  } else {
    showToast(typeof store.error === 'string' ? store.error : 'Erro ao desvincular motorista.', 'error');
  }
}

async function atribuirPassageiro(grupo) {
  const passengerId = selecaoPassageiro.value[grupo.id];
  if (!passengerId) return;

  const resultado = await store.atribuirPassageiro(passengerId, grupo.id);
  if (resultado) {
    showToast('Passageiro atribuído à rota.');
    selecaoPassageiro.value[grupo.id] = '';
    await store.fetchRotas();
  } else {
    showToast(typeof store.error === 'string' ? store.error : 'Erro ao atribuir passageiro.', 'error');
  }
}

async function desvincularPassageiro(passengerId) {
  const resultado = await store.desvincularPassageiro(passengerId);
  if (resultado) {
    showToast('Passageiro desvinculado da rota.');
    await store.fetchRotas();
  } else {
    showToast(typeof store.error === 'string' ? store.error : 'Erro ao desvincular passageiro.', 'error');
  }
}

const cadastrar = () => {
  router.push('/cadastro-rota');
};
</script>

<template>
  <div class="content">
    <transition name="toast">
      <div v-if="toast" :class="['toast', toast.type]">
        <span class="mdi" :class="toast.type === 'error' ? 'mdi-alert-circle-outline' : 'mdi-check-circle-outline'"></span>
        {{ toast.message }}
      </div>
    </transition>

    <div class="search-container">
      <span class="mdi mdi-magnify search-icon"></span>
      <input v-model="busca" type="text" placeholder="Busque por rotas..." />
    </div>

    <p v-if="store.loading" class="status-message">Carregando rotas...</p>
    <p v-else-if="store.error" class="status-message error">Erro ao carregar rotas.</p>
    <p v-else-if="!gruposFiltrados.length" class="status-message">Nenhuma rota cadastrada.</p>

    <div class="list-rotas">
      <div v-for="grupo in gruposFiltrados" :key="grupo.id" class="card-rota">
        <div class="card-header">
          <div class="header-main">
            <h3>{{ grupo.name }}</h3>
            <p class="card-subtitle">CEP {{ grupo.commonCep }}</p>
          </div>

          <div class="menu-container">
            <button class="menu-dots" @click="toggleMenu(grupo.id)">
              <span class="mdi mdi-dots-vertical"></span>
            </button>

            <div v-if="menuAberto === grupo.id" class="menu-dropdown">
              <button @click="editarRota(grupo.id)">Editar rota</button>
              <button :disabled="excluindoId === grupo.id" @click="excluirRota(grupo)">
                {{ excluindoId === grupo.id ? 'Excluindo...' : 'Excluir rota' }}
              </button>
            </div>
          </div>
        </div>

        <div class="horarios-linha" v-if="grupo.schedules.length">
          <span v-for="h in grupo.schedules" :key="h.id" class="badge-horario">
            Ida {{ h.goHourLabel }} - Volta {{ h.returnHourLabel }}
          </span>
        </div>
        <p v-else class="sem-horario">Sem horários cadastrados</p>

        <div class="secao-vinculos">
          <div class="vinculo-bloco">
            <p class="vinculo-titulo"><span class="mdi mdi-bus"></span> Veículos</p>
            <div class="chips">
              <span v-for="v in grupo.vehicles" :key="v.id" class="chip">{{ v.plate }}</span>
              <span v-if="!grupo.vehicles.length" class="chip-vazio">Nenhum veículo atribuído</span>
            </div>
            <div class="atribuir-linha" v-if="veiculosDisponiveis(grupo).length">
              <select v-model="selecaoVeiculo[grupo.id]">
                <option value="">Atribuir veículo...</option>
                <option v-for="v in veiculosDisponiveis(grupo)" :key="v.id" :value="v.id">{{ v.plate }}</option>
              </select>
              <button class="btn-atribuir" @click="atribuirVeiculo(grupo)">Atribuir</button>
            </div>
          </div>

          <div class="vinculo-bloco">
            <p class="vinculo-titulo"><span class="mdi mdi-steering"></span> Motoristas</p>
            <div class="chips">
              <span v-for="d in grupo.drivers" :key="d.id" class="chip">
                {{ d.name }}
                <button class="chip-remover" @click="desvincularMotorista(d.id)">
                  <span class="mdi mdi-close"></span>
                </button>
              </span>
              <span v-if="!grupo.drivers.length" class="chip-vazio">Nenhum motorista atribuído</span>
            </div>
            <div class="atribuir-linha" v-if="motoristasDisponiveis(grupo).length">
              <select v-model="selecaoMotorista[grupo.id]">
                <option value="">Atribuir motorista...</option>
                <option v-for="d in motoristasDisponiveis(grupo)" :key="d.id" :value="d.id">{{ d.user_data?.name }}</option>
              </select>
              <button class="btn-atribuir" @click="atribuirMotorista(grupo)">Atribuir</button>
            </div>
          </div>

          <div class="vinculo-bloco">
            <p class="vinculo-titulo"><span class="mdi mdi-account-multiple"></span> Passageiros</p>
            <div class="chips">
              <span v-for="p in grupo.passengers" :key="p.id" class="chip">
                {{ p.name }}
                <button class="chip-remover" @click="desvincularPassageiro(p.id)">
                  <span class="mdi mdi-close"></span>
                </button>
              </span>
              <span v-if="!grupo.passengers.length" class="chip-vazio">Nenhum passageiro atribuído</span>
            </div>
            <div class="atribuir-linha" v-if="passageirosDisponiveis(grupo).length">
              <select v-model="selecaoPassageiro[grupo.id]">
                <option value="">Atribuir passageiro...</option>
                <option v-for="p in passageirosDisponiveis(grupo)" :key="p.id" :value="p.id">{{ p.user_data?.name }}</option>
              </select>
              <button class="btn-atribuir" @click="atribuirPassageiro(grupo)">Atribuir</button>
            </div>
          </div>
        </div>
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
  margin-bottom: 24px;
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
  padding: 12px 12px 12px 44px;
  border-radius: 12px;
  border: 1px solid var(--border-primary);
  background: var(--superfice);
  outline: none;
  color: var(--text);
}

.card-rota {
  background: var(--superfice);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 14px;
  border: 1px solid var(--border);
  box-shadow: var(--shadow);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
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

.menu-dropdown button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.horarios-linha {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 12px 0;
}

.badge-horario {
  font-size: 12px;
  padding: 4px 8px;
  border: 1px solid var(--border);
  border-radius: 5px;
  color: var(--text-muted);
}

.sem-horario {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin: 12px 0;
}

.secao-vinculos {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.vinculo-titulo {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-muted);
  margin: 0 0 8px;
}

.vinculo-titulo .mdi {
  color: var(--primary);
  font-size: 16px;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  border-radius: 20px;
  background: rgba(223, 128, 26, 0.08);
  color: var(--text);
  font-size: 0.82rem;
}

.chip-remover {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  font-size: 14px;
}

.chip-remover:hover {
  color: var(--danger);
}

.chip-vazio {
  font-size: 0.82rem;
  color: var(--text-muted);
}

.atribuir-linha {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}

.atribuir-linha select {
  flex: 1;
  height: 38px;
  padding: 0 10px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--bg);
  color: var(--text);
  font-size: 0.82rem;
}

.btn-atribuir {
  height: 38px;
  padding: 0 14px;
  border-radius: 8px;
  border: none;
  background: var(--gradient-primary);
  color: white;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
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

.status-message {
  text-align: center;
  color: var(--text-muted);
  padding: 24px 0;
}

.status-message.error {
  color: var(--danger);
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
  max-width: 90vw;
  text-align: center;
}

.toast.success {
  background: rgba(5, 150, 105, 0.95);
  color: #fff;
}

.toast.error {
  background: rgba(220, 38, 38, 0.95);
  color: #fff;
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
</style>
