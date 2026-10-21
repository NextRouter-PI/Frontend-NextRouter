<script setup>
defineProps({
  phrase: {
    type: String,
    default: 'Seu próximo passo começa aqui',
  },
})
</script>

<template>
  <div class="illustration">
    <svg class="art" viewBox="0 0 400 280" fill="none" xmlns="http://www.w3.org/2000/svg" role="img"
      aria-label="Ilustração de criação de perfil">
      <!-- círculo de fundo -->
      <circle cx="200" cy="140" r="118" class="halo" />
      <circle cx="200" cy="140" r="86" class="halo halo-inner" />

      <!-- cartão de trás -->
      <g class="float-slow">
        <rect x="92" y="62" width="196" height="150" rx="22" class="card-back" transform="rotate(-8 190 137)" />
      </g>

      <!-- cartão principal (perfil) -->
      <g class="float-main">
        <rect x="108" y="58" width="196" height="156" rx="22" class="card" />

        <!-- avatar -->
        <circle cx="206" cy="108" r="26" class="avatar-bg" />
        <circle cx="206" cy="101" r="9" class="avatar" />
        <path d="M189 124c3-9 10-13 17-13s14 4 17 13c-5 5-11 7-17 7s-12-2-17-7z" class="avatar" />

        <!-- linhas de texto -->
        <rect x="160" y="148" width="92" height="9" rx="4.5" class="line-strong" />
        <rect x="176" y="164" width="60" height="7" rx="3.5" class="line-soft" />

        <!-- botão -->
        <rect x="170" y="184" width="72" height="18" rx="9" class="btn" />
      </g>

      <!-- selo de "+" -->
      <g class="float-fast">
        <circle cx="290" cy="64" r="22" class="badge" />
        <path d="M290 54v20M280 64h20" class="badge-plus" />
      </g>

      <!-- mini cartão com check -->
      <g class="float-slow">
        <rect x="46" y="150" width="74" height="42" rx="14" class="mini-card" />
        <circle cx="68" cy="171" r="11" class="mini-dot" />
        <path d="M63 171l4 4 7-8" class="mini-check" />
        <rect x="86" y="166" width="26" height="6" rx="3" class="line-soft-dark" />
        <rect x="86" y="176" width="18" height="5" rx="2.5" class="line-soft-dark" />
      </g>

      <!-- escudo -->
      <g class="float-fast">
        <path d="M318 168c0 18-12 28-24 33-12-5-24-15-24-33v-17l24-9 24 9v17z" class="mini-card" />
        <path d="M285 170l6 6 12-13" class="mini-check" />
      </g>

      <!-- brilhos -->
      <path d="M70 80l4 10 10 4-10 4-4 10-4-10-10-4 10-4z" class="sparkle" />
      <path d="M338 112l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" class="sparkle" />
      <circle cx="52" cy="118" r="4" class="dot" />
      <circle cx="350" cy="214" r="5" class="dot" />
      <circle cx="136" cy="246" r="3.5" class="dot" />
      <circle cx="262" cy="248" r="3" class="dot" />
    </svg>

    <span class="phrase">{{ phrase }}</span>
  </div>
</template>

<style scoped>
.illustration {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  margin: 28px 0 8px;
}

.art {
  width: 100%;
  max-width: 520px;
  height: auto;
  overflow: visible;
}

.phrase {
  display: inline-block;
  padding: 8px 16px;
  border-radius: 999px;
  font-size: 0.85rem;
  font-weight: 600;
  letter-spacing: 0.01em;
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.28);
}

/* ---- cores (claras, para fundo em gradiente) ---- */
.halo {
  fill: rgba(255, 255, 255, 0.08);
  stroke: rgba(255, 255, 255, 0.22);
  stroke-width: 1.5;
  stroke-dasharray: 4 7;
}

.halo-inner {
  fill: rgba(255, 255, 255, 0.06);
  stroke: none;
}

.card-back {
  fill: rgba(255, 255, 255, 0.18);
  stroke: rgba(255, 255, 255, 0.35);
  stroke-width: 1.5;
}

.card {
  fill: #ffffff;
  filter: drop-shadow(0 18px 30px rgba(0, 0, 0, 0.22));
}

.avatar-bg {
  fill: var(--primary);
  opacity: 0.14;
}

.avatar {
  fill: var(--primary);
}

.line-strong {
  fill: #1f2937;
  opacity: 0.85;
}

.line-soft {
  fill: #9ca3af;
  opacity: 0.6;
}

.line-soft-dark {
  fill: #9ca3af;
  opacity: 0.7;
}

.btn {
  fill: var(--primary);
}

.badge {
  fill: #ffffff;
  filter: drop-shadow(0 10px 18px rgba(0, 0, 0, 0.2));
}

.badge-plus {
  stroke: var(--primary);
  stroke-width: 4;
  stroke-linecap: round;
  transform: scale(0.5);
  transform-origin: 290px 64px;
}

.mini-card {
  fill: #ffffff;
  filter: drop-shadow(0 10px 20px rgba(0, 0, 0, 0.2));
}

.mini-dot {
  fill: var(--primary);
  opacity: 0.15;
}

.mini-check {
  stroke: var(--primary);
  stroke-width: 3;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.sparkle {
  fill: #ffffff;
  opacity: 0.9;
  animation: twinkle 3s ease-in-out infinite;
  transform-box: fill-box;
  transform-origin: center;
}

.dot {
  fill: #ffffff;
  opacity: 0.45;
}

/* ---- animações ---- */
.float-main {
  animation: float 6s ease-in-out infinite;
}

.float-slow {
  animation: float 8s ease-in-out infinite reverse;
}

.float-fast {
  animation: float 5s ease-in-out infinite;
  animation-delay: -2s;
}

@keyframes float {

  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-8px);
  }
}

@keyframes twinkle {

  0%,
  100% {
    transform: scale(1);
    opacity: 0.9;
  }

  50% {
    transform: scale(0.6);
    opacity: 0.4;
  }
}

@media (prefers-reduced-motion: reduce) {

  .float-main,
  .float-slow,
  .float-fast,
  .sparkle {
    animation: none;
  }
}
</style>
