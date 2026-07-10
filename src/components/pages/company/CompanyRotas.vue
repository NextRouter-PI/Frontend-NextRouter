<script setup>
import { ref, computed } from 'vue';
import { useRotasStore } from '@/stores/useRotasStore';

const store = useRotasStore();
const busca = ref('');
const filtroAtivo = ref('Todas');

const rotasFiltradas = computed(() => {
  const lista = store.rotas || [];
  return lista.filter(r => {
    const correspondeBusca =
      r.origem.toLowerCase().includes(busca.value.toLowerCase()) ||
      r.destino.toLowerCase().includes(busca.value.toLowerCase()) ||
      r.horario.toLowerCase().includes(busca.value.toLowerCase());

    const correspondeFiltro =
        filtroAtivo.value === 'Todas' ||
        r.horario.startsWith('12') && filtroAtivo.value === '12h' ||
        r.horario.startsWith('17') && filtroAtivo.value === '17h';

    return correspondeBusca && correspondeFiltro;
  });
});
</script>

<template>
  <div class="content">
    <div class="search-container">
      <span class="mdi mdi-magnify search-icon"></span>
      <input v-model="busca" type="text" placeholder="Busque por rotas..." />
    </div>

    <div class="filter">
      <button @click="filtroAtivo = 'Todas'" :class="{ 'ativo': filtroAtivo === 'Todas' }" class="btn-filtro">Todas</button>
      <button @click="filtroAtivo = '12h'" :class="{ 'ativo': filtroAtivo === '12h' }" class="btn-filtro">12h</button>
      <button @click="filtroAtivo = '17h'" :class="{ 'ativo': filtroAtivo === '17h' }" class="btn-filtro">17h</button>
    </div>

    <div class="list-rotas">
      <div v-for="rota in rotasFiltradas" :key="rota.id" class="card-rota">
        <div class="conteudo-card">
          <div class="linha-destino">
            <div class="marcador">
              <span class="mdi mdi-map-marker"></span>
              <h4 class="texto-destino">{{ rota.origem }}</h4>
            </div>
            <span class="badge-horario">{{ rota.horario }}</span>
          </div>

          <div class="linha-ponto">
            <span class="mdi mdi-circle-medium"></span>
            <p class="texto-ponto">{{ rota.destino }}</p>
          </div>

          <div class="info-logistica">
            <div class="dots">
              <span class="mdi mdi-dots-vertical"></span>
            </div>
            <div>
              <p>Van: <span class="destaque-info">{{ rota.van }}</span></p>
              <p>Motorista: <span class="destaque-info">{{ rota.motorista }}</span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
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
  margin-bottom: 5px;
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

.filter {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  margin-top: 16px;
}

.btn-filtro {
  padding: 6px 16px;
  border-radius: 20px;
  border: 1px solid var(--border);
  background: var(--superfice);
  font-size: 0.85rem;
  color: var(--text-muted);
}

.btn-filtro.ativo {
  background: rgba(223, 128, 26, 0.08);
  border-color: var(--primary);
  color: var(--primary);
}

.card-rota {
  background: var(--superfice);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 14px;
  border: 1px solid var(--border);
  box-shadow: var(--shadow);
}

.linha-destino {
  display: flex;
  justify-content: space-between;
}

.marcador {
  display: flex;
  gap: 10px;
}

.mdi-map-marker {
  color: var(--primary);
}

.badge-horario {
  font-size: 12px;
  padding: 3px 5px;
  border: 1px solid var(--border);
  border-radius: 5px;
  color: var(--text-muted);
}

.linha-ponto {
  display: flex;
  margin: 10px 0;
  gap: 10px;
}

.mdi-circle-medium {
  color: var(--primary);
}

.texto-destino,
.texto-ponto {
  color: var(--text);
}

.info-logistica {
  display: flex;
  justify-content: space-between;
  color: var(--text-muted);
  font-size: 0.9rem;
}

.destaque-info {
  color: var(--text);
  font-weight: 600;
}

.dots {
  margin-top: 10px;
}

.mdi-dots-vertical {
  font-size: 25px;
  color: var(--text-muted);
}
</style>
