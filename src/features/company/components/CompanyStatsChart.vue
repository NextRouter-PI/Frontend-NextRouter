<script setup>
import { computed } from 'vue'
import { Bar } from 'vue-chartjs'
import { BarElement, CategoryScale, Chart as ChartJS, Legend, LinearScale, Tooltip } from 'chart.js'
import { ROUTE_PATHS } from '@/constants'
import BaseCard from '@/components/ui/BaseCard.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

const props = defineProps({
  serviceSlots: { type: Array, required: true },
  dateLabel: { type: String, required: true },
  loading: { type: Boolean, default: false },
})

function readCssVar(name, fallback) {
  if (typeof window === 'undefined') return fallback
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback
}

// Barras empilhadas por situação: alocados, a bordo e desembarcados em cada serviço do dia.
const SERIES = [
  { key: 'allocated', label: 'Alocados', color: '#f8b86a' },
  { key: 'on_board', label: 'A bordo', color: '#ec8314' },
  { key: 'dropped_off', label: 'Desembarcados', color: '#22c55e' },
]

const chartData = computed(() => ({
  labels: props.serviceSlots.map((slot) => {
    const dir = slot.service__direction === 'outbound' ? 'Ida' : 'Volta'
    const hr = String(slot.service__target_time || '').slice(0, 5)
    return `${dir} ${hr || `#${slot.service}`}`
  }),
  datasets: SERIES.map((serie) => ({
    label: serie.label,
    data: props.serviceSlots.map((slot) => slot[serie.key] || 0),
    backgroundColor: serie.color,
    borderRadius: 8,
    borderSkipped: false,
    maxBarThickness: 46,
  })),
}))

const totals = computed(() =>
  SERIES.map((serie) => ({
    ...serie,
    value: props.serviceSlots.reduce((acc, slot) => acc + (slot[serie.key] || 0), 0),
  })),
)

const chartOptions = computed(() => {
  const tickColor = readCssVar('--text-muted', '#71717a')
  const gridColor = readCssVar('--border', '#e4e4e7')
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 900, easing: 'easeOutQuart' },
    interaction: { mode: 'index', intersect: false },
    plugins: { legend: { display: false } },
    scales: {
      x: {
        stacked: true,
        grid: { display: false },
        ticks: { color: tickColor, font: { size: 12, weight: '600' } },
        border: { display: false },
      },
      y: {
        stacked: true,
        beginAtZero: true,
        ticks: { precision: 0, color: tickColor },
        grid: { color: gridColor, lineWidth: 1 },
        border: { display: false },
      },
    },
  }
})
</script>

<template>
  <BaseCard title="Passageiros por serviço" :subtitle="`Situação de cada saída em ${dateLabel}`">
    <ul v-if="serviceSlots.length && !loading" class="chart-legend">
      <li v-for="item in totals" :key="item.key">
        <span class="dot" :style="{ background: item.color }"></span>
        {{ item.label }} <strong>{{ item.value }}</strong>
      </li>
    </ul>
    <div class="chart-container">
      <Transition name="fade-slide" mode="out-in">
        <LoadingSpinner v-if="loading" key="loading" text="Carregando estatísticas..." />
        <div v-else-if="!serviceSlots.length" key="empty" class="chart-empty">
          <BaseIcon name="mdi-bus-clock" />
          <p>Nenhuma viagem datada registrada para hoje.</p>
        </div>
        <Bar v-else key="chart" :data="chartData" :options="chartOptions" />
      </Transition>
    </div>

    <template #footer>
      <RouterLink :to="ROUTE_PATHS.LIST_OPERATIONS" class="btn-detalhes">
        Ver operação do dia <BaseIcon name="mdi-arrow-right" />
      </RouterLink>
    </template>
  </BaseCard>
</template>

<style lang="scss" scoped>
.chart-container {
  position: relative;
  height: 220px;
  @include flex-center;
}

.chart-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $space-2;
  font-size: $text-md;
  color: var(--text-muted);
  text-align: center;

  .mdi {
    font-size: 2.4rem;
    color: var(--primary);
    opacity: 0.6;
  }
}

.chart-legend {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2 $space-4;
  font-size: $text-sm;
  color: var(--text-muted);

  li {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  strong {
    color: var(--text);
  }

  .dot {
    width: 10px;
    height: 10px;
    border-radius: 3px;
  }
}

.btn-detalhes {
  @include action-button;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: $space-3 $space-4;
  gap: $space-2;
  background: var(--gradient-brand);
  color: var(--color-on-primary);
  font-size: $text-sm;
  font-weight: $font-bold;

  .mdi {
    transition: transform $duration-normal $ease-fluid;
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-primary);

    .mdi {
      transform: translateX(4px);
    }
  }
}
</style>
