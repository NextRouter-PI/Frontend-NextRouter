<script setup>
import { computed } from 'vue'
import { Doughnut } from 'vue-chartjs'
import { ArcElement, Chart as ChartJS, Tooltip } from 'chart.js'
import BaseCard from '@/components/ui/BaseCard.vue'

ChartJS.register(ArcElement, Tooltip)

// Gráfico de rosca com o total no centro e legenda com valores e porcentagens.
const props = defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  segments: { type: Array, required: true }, // [{ label, value, color }]
  centerLabel: { type: String, default: 'Total' },
  emptyText: { type: String, default: 'Ainda não há dados para mostrar.' },
  loading: { type: Boolean, default: false },
})

const total = computed(() => props.segments.reduce((acc, s) => acc + (Number(s.value) || 0), 0))

const chartData = computed(() => ({
  labels: props.segments.map((s) => s.label),
  datasets: [
    {
      data: props.segments.map((s) => s.value),
      backgroundColor: props.segments.map((s) => s.color),
      borderWidth: 0,
      hoverOffset: 8,
      borderRadius: 6,
      spacing: 3,
    },
  ],
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '72%',
  animation: { animateRotate: true, duration: 1100, easing: 'easeOutQuart' },
  plugins: { legend: { display: false } },
}

const pct = (value) => (total.value ? Math.round((value / total.value) * 100) : 0)
</script>

<template>
  <BaseCard :title="title" :subtitle="subtitle">
    <div v-if="loading" class="donut-loading" aria-hidden="true"></div>
    <p v-else-if="!total" class="donut-empty">{{ emptyText }}</p>
    <div v-else class="donut-wrap">
      <div class="donut-canvas">
        <Doughnut :data="chartData" :options="chartOptions" />
        <div class="donut-center">
          <strong>{{ total }}</strong>
          <span>{{ centerLabel }}</span>
        </div>
      </div>
      <ul class="donut-legend">
        <li v-for="s in segments" :key="s.label">
          <span class="dot" :style="{ background: s.color }"></span>
          <span class="label">{{ s.label }}</span>
          <span class="value">{{ s.value }}</span>
          <span class="pct">{{ pct(s.value) }}%</span>
        </li>
      </ul>
    </div>
  </BaseCard>
</template>

<style lang="scss" scoped>
.donut-wrap {
  display: flex;
  align-items: center;
  gap: $space-5;
  flex-wrap: wrap;
}

.donut-canvas {
  position: relative;
  width: 160px;
  height: 160px;
  flex-shrink: 0;
  margin: 0 auto;
}

.donut-center {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  pointer-events: none;

  strong {
    font-size: 1.9rem;
    font-weight: $font-extrabold;
    line-height: 1;
    letter-spacing: -0.02em;
  }

  span {
    margin-top: 2px;
    font-size: $text-xs;
    color: var(--text-muted);
  }
}

.donut-legend {
  flex: 1;
  min-width: 180px;
  display: flex;
  flex-direction: column;
  gap: $space-2;

  li {
    display: grid;
    grid-template-columns: 12px 1fr auto 44px;
    align-items: center;
    gap: $space-2;
    padding: 8px 10px;
    border-radius: $radius-md;
    transition: background-color $duration-normal $ease-fluid;

    &:hover {
      background: var(--altbg);
    }
  }

  .dot {
    width: 10px;
    height: 10px;
    border-radius: $radius-round;
  }

  .label {
    font-size: $text-sm;
    font-weight: $font-semibold;
  }

  .value {
    font-weight: $font-bold;
    font-variant-numeric: tabular-nums;
  }

  .pct {
    text-align: right;
    font-size: $text-xs;
    color: var(--text-muted);
    font-variant-numeric: tabular-nums;
  }
}

.donut-empty {
  padding: $space-6 $space-3;
  text-align: center;
  color: var(--text-muted);
  font-size: $text-sm;
  border: 1.5px dashed var(--border);
  border-radius: $radius-lg;
}

.donut-loading {
  width: 160px;
  height: 160px;
  margin: 0 auto;
  border-radius: $radius-round;
  border: 18px solid var(--altbg);
  border-top-color: var(--color-primary-tint);
  animation: donut-spin 1s linear infinite;
}

@keyframes donut-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
