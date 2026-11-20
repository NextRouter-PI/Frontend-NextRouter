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

const chartData = computed(() => ({
  labels: props.serviceSlots.map((slot) => {
    const dir = slot.service__direction === 'outbound' ? 'Ida' : 'Volta'
    const hr = String(slot.service__target_time || '').slice(0, 5)
    return `${dir} ${hr || `#${slot.service}`}`
  }),
  datasets: [
    {
      data: props.serviceSlots.map(
        (slot) => (slot.allocated || 0) + (slot.on_board || 0) + (slot.dropped_off || 0),
      ),
      backgroundColor: readCssVar('--primary', '#ec8314'),
      borderRadius: 6,
      barThickness: 36,
    },
  ],
}))

const chartMax = computed(() => {
  const max = Math.max(
    2,
    ...props.serviceSlots.map(
      (slot) => (slot.allocated || 0) + (slot.on_board || 0) + (slot.dropped_off || 0),
    ),
  )
  return Math.ceil(max / 2) * 2
})

const chartOptions = computed(() => {
  const tickColor = readCssVar('--text-muted', '#71717a')
  const gridColor = readCssVar('--border', '#e4e4e7')
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: tickColor, font: { size: 16, weight: '600' } },
        border: { color: tickColor },
      },
      y: {
        min: 0,
        max: chartMax.value,
        ticks: { stepSize: Math.max(1, Math.round(chartMax.value / 10)), color: tickColor },
        grid: { color: gridColor, lineWidth: 1 },
        border: { display: false },
      },
    },
  }
})
</script>

<template>
  <BaseCard :title="`Atendimento por Serviço ${dateLabel}`">
    <div class="chart-container">
      <Transition name="fade-slide" mode="out-in">
        <LoadingSpinner v-if="loading" key="loading" text="Carregando estatísticas..." />
        <p v-else-if="!serviceSlots.length" key="empty" class="chart-empty">
          Nenhuma viagem datada registrada para a data consultada.
        </p>
        <Bar v-else key="chart" :data="chartData" :options="chartOptions" />
      </Transition>
    </div>

    <template #footer>
      <RouterLink :to="ROUTE_PATHS.LIST" class="btn-detalhes">VER DETALHES</RouterLink>
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
  font-size: $text-md;
  color: var(--text-muted);
  text-align: center;
}

.btn-detalhes {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: $space-3 $space-4;
  border-radius: $radius-md;
  background: var(--primary);
  color: var(--color-on-primary);
  font-size: $text-sm;
  font-weight: $font-bold;
  letter-spacing: 0.04em;
  transition: background-color $duration-normal $ease-fluid;

  &:hover {
    background: var(--primary-hover);
  }
}
</style>
