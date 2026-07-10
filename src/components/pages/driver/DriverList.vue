<template>
  <div class="usuarios-list-container">
    <div class="questionario-header-block">
      <h2>Questionário ({{ formatarDataProxima() }})</h2>
    </div>

    <div class="schedule-selector">
      <button class="arrow-button" @click="previousTime" aria-label="Horário anterior">
        ‹
      </button>
      <div class="time-text">{{ selectedTime }}</div>
      <button class="arrow-button" @click="nextTime" aria-label="Próximo horário">
        ›
      </button>
    </div>

    <div class="list-container">
      <h3 class="list-title">Passageiros Designados</h3>

      <div v-if="filteredPassengers.length > 0">
        <div
          v-for="passenger in filteredPassengers"
          :key="passenger.id"
          class="passenger-card"
        >
          <div class="passenger-name">{{ passenger.name }}</div>
          <div class="passenger-address">{{ passenger.address }}</div>
        </div>
      </div>

      <div v-else class="no-passengers">
        Nenhum passageiro designado para este horário
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";

const timeOptions = ["08:00", "12:00", "17:00"];
const currentTimeIndex = ref(0);
const selectedTime = computed(() => timeOptions[currentTimeIndex.value]);

const allPassengers = ref([
  {
    id: 1,
    name: "João Silva",
    address: "Rua A, 123 - Centro",
    time: "08:00",
  },
  {
    id: 2,
    name: "Maria Santos",
    address: "Av. B, 456 - Vila Nova",
    time: "08:00",
  },
  {
    id: 3,
    name: "Pedro Costa",
    address: "Rua C, 789 - Jardim",
    time: "12:00",
  },
  {
    id: 4,
    name: "Ana Oliveira",
    address: "Av. D, 321 - Centro",
    time: "12:00",
  },
  {
    id: 5,
    name: "Carlos Mendes",
    address: "Rua E, 654 - Vila",
    time: "17:00",
  },
]);

const filteredPassengers = computed(() => {
  return allPassengers.value.filter((p) => p.time === selectedTime.value);
});

const nextTime = () => {
  currentTimeIndex.value = (currentTimeIndex.value + 1) % timeOptions.length;
};

const previousTime = () => {
  currentTimeIndex.value =
    (currentTimeIndex.value - 1 + timeOptions.length) % timeOptions.length;
};

const formatarDataProxima = () => {
  const amanha = new Date();
  amanha.setDate(amanha.getDate() + 1);

  const dia = String(amanha.getDate()).padStart(2, "0");
  const mes = String(amanha.getMonth() + 1).padStart(2, "0");
  const ano = amanha.getFullYear();

  return `${dia}/${mes}/${ano}`;
};
</script>

<style scoped>
.usuarios-list-container {
  padding: 0 20px;
  min-height: 100vh;
}

.questionario-header-block {
  background: var(--superfice);
  border: 1px solid rgba(223, 128, 26, 0.12);
  border-radius: 10px;
  padding: 12px;
  text-align: center;
  margin-bottom: 12px;
}

.questionario-header-block h2 {
  font-size: 1rem;
  font-weight: bold;
  color: var(--text);
  margin: 0;
}

.schedule-selector {
  background: var(--superfice);
  border: 1px solid rgba(223, 128, 26, 0.12);
  border-radius: 10px;
  padding: 10px 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.time-text {
  font-size: 1.1rem;
  font-weight: bold;
  color: var(--text);
}

.arrow-button {
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
  color: var(--primary);
  transition: transform 0.2s;
  width: 32px;
  height: 32px;
}

.arrow-button:hover {
  color: var(--primary-hover);
}

.arrow-button:active {
  transform: scale(0.85);
}

.list-container {
  background: var(--superfice);
  border: 1px solid rgba(223, 128, 26, 0.12);
  border-radius: 15px;
  padding: 12px 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.list-title {
  font-size: 0.95rem;
  font-weight: bold;
  color: var(--text);
  margin: 0 0 8px 0;
  padding: 0;
}

.passenger-card {
  border: 1px solid var(--border-primary);
  border-radius: 10px;
  padding: 10px 12px;
  text-align: left;
  background: var(--bg);
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 10px;
}

.passenger-name {
  font-size: 0.95rem;
  font-weight: bold;
  color: var(--text);
}

.passenger-address {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.no-passengers {
  text-align: center;
  padding: 20px;
  color: var(--text-muted);
  font-size: 0.9rem;
}

@media (min-width: 480px) {
  .usuarios-list-container {
    padding: 15px;
  }

  .questionario-header-block {
    padding: 15px;
    margin-bottom: 15px;
    border-radius: 12px;
  }

  .questionario-header-block h2 {
    font-size: 1.1rem;
  }

  .schedule-selector {
    padding: 12px 15px;
    margin-bottom: 15px;
    border-radius: 12px;
  }

  .time-text {
    font-size: 1.2rem;
  }

  .arrow-button {
    font-size: 1.5rem;
    width: 35px;
    height: 35px;
    padding: 3px;
  }

  .list-container {
    padding: 15px 10px;
    gap: 10px;
    border-radius: 18px;
  }

  .list-title {
    font-size: 1rem;
    margin-bottom: 10px;
  }

  .passenger-card {
    padding: 12px 15px;
    border-radius: 11px;
  }

  .passenger-name {
    font-size: 1rem;
  }

  .passenger-address {
    font-size: 0.85rem;
  }

  .no-passengers {
    padding: 25px;
    font-size: 0.92rem;
  }
}

@media (min-width: 768px) {
  .usuarios-list-container {
    padding: 20px;
    max-width: 600px;
    margin: 0 auto;
  }

  .questionario-header-block {
    padding: 20px;
    margin-bottom: 20px;
    border-radius: 15px;
  }

  .questionario-header-block h2 {
    font-size: 1.3rem;
  }

  .schedule-selector {
    padding: 15px 20px;
    margin-bottom: 20px;
    border-radius: 15px;
  }

  .time-text {
    font-size: 1.4rem;
  }

  .arrow-button {
    font-size: 1.8rem;
    width: 40px;
    height: 40px;
    padding: 5px;
  }

  .list-container {
    padding: 25px 15px;
    gap: 12px;
    border-radius: 20px;
  }

  .list-title {
    font-size: 1.1rem;
    margin-bottom: 15px;
  }

  .passenger-card {
    padding: 15px 20px;
    border-radius: 12px;
  }

  .passenger-name {
    font-size: 1.1rem;
  }

  .passenger-address {
    font-size: 0.9rem;
  }

  .no-passengers {
    padding: 30px;
    font-size: 0.95rem;
  }
}

@media (min-width: 1201px) {
  .usuarios-list-container {
    max-width: 700px;
  }
}
</style>
