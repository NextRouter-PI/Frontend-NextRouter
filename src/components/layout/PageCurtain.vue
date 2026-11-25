<script setup>
import { nextTick, onMounted, onUnmounted, shallowRef, useTemplateRef, watch } from 'vue'
import { useRouter } from 'vue-router'
import BrandLogo from '@/components/ui/BrandLogo.vue'
import { CURTAIN_RESUME_KEY, curtainMode, curtainRequest } from '@/composables/pageCurtain'

// Cortina laranja entre páginas: a onda sobe cobrindo a tela, mostra a logo
// e desce de volta revelando a página nova (receita R11, cortina de página).
const COVER_MS = 1000
// Pausa com a logo e o carregamento girando antes de a onda descer.
const HOLD_MS = 1500
const REVEAL_MS = 1050

const router = useRouter()
const phase = shallowRef('idle') // idle | covering | covered | revealing
// up: sobe e desce (entrar na conta); side: entra pela esquerda e sai pela direita;
// side-back: entra pela direita e sai pela esquerda. A regra fica em composables/pageCurtain.
const direction = shallowRef('up')
const curtainEl = useTemplateRef('curtain')
const WORD = [...'NextRouter']
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
let revealTimer = 0

const removeBefore = router.beforeEach(async (to, from) => {
  if (phase.value === 'covered' || phase.value === 'covering') return true
  const mode = curtainMode(to, from)
  if (!mode) return true
  clearTimeout(revealTimer)
  direction.value = mode
  // Aplica a posição inicial da direção escolhida antes de animar (força o recálculo do estilo).
  await nextTick()
  void curtainEl.value?.offsetWidth
  phase.value = 'covering'
  await wait(COVER_MS)
  phase.value = 'covered'
  return true
})

async function reveal() {
  if (phase.value === 'idle' || phase.value === 'revealing') return
  await nextTick()
  await wait(HOLD_MS)
  phase.value = 'revealing'
  revealTimer = setTimeout(() => (phase.value = 'idle'), REVEAL_MS)
}

// Pedido manual (login): cobre a tela e marca para revelar depois do recarregamento.
watch(curtainRequest, async (request) => {
  if (!request) return
  direction.value = request.mode
  await nextTick()
  void curtainEl.value?.offsetWidth
  phase.value = 'covering'
  await wait(COVER_MS)
  phase.value = 'covered'
  try {
    window.sessionStorage.setItem(CURTAIN_RESUME_KEY, request.mode)
  } catch {
    /* Sem storage, a página nova só abre sem a cortina. */
  }
  curtainRequest.value = null
  request.resolve()
})

// Página recarregada no meio da cortina: começa coberta e desce quando o roteador terminar.
onMounted(async () => {
  let mode
  try {
    mode = window.sessionStorage.getItem(CURTAIN_RESUME_KEY)
    window.sessionStorage.removeItem(CURTAIN_RESUME_KEY)
  } catch {
    return
  }
  if (!mode) return
  direction.value = mode
  phase.value = 'covered'
  await router.isReady()
  reveal()
})

// afterEach também roda em navegação cancelada ou redirecionada: a tela nunca fica presa.
const removeAfter = router.afterEach(reveal)
const removeError = router.onError(reveal)

onUnmounted(() => {
  removeBefore()
  removeAfter()
  removeError()
  clearTimeout(revealTimer)
})
</script>

<template>
  <div ref="curtain" class="page-curtain" :class="[`is-${phase}`, `dir-${direction}`]" aria-hidden="true">
    <!-- Transição lateral: duas camadas (grafite e laranja claro) passam na frente da cortina principal. -->
    <div v-for="layer in ['dark', 'light']" :key="layer" class="curtain-panel curtain-layer" :class="`curtain-layer--${layer}`">
      <svg class="curtain-side curtain-side--right" viewBox="0 0 120 2400" preserveAspectRatio="none">
        <path d="M60 0 Q 0 300 60 600 T 60 1200 T 60 1800 T 60 2400 H0 V0 Z" />
      </svg>
      <svg class="curtain-side curtain-side--left" viewBox="0 0 120 2400" preserveAspectRatio="none">
        <path d="M60 0 Q 120 300 60 600 T 60 1200 T 60 1800 T 60 2400 H120 V0 Z" />
      </svg>
    </div>

    <div class="curtain-panel curtain-body">
      <!-- Duas ondas periódicas (Q + T) que se repetem sem emenda; a de trás é mais clara e lenta. -->
      <svg class="curtain-wave curtain-wave--back" viewBox="0 0 2400 120" preserveAspectRatio="none">
        <path d="M0 70 Q 300 10 600 70 T 1200 70 T 1800 70 T 2400 70 V120 H0 Z" />
      </svg>
      <svg class="curtain-wave curtain-wave--front" viewBox="0 0 2400 120" preserveAspectRatio="none">
        <path d="M0 60 Q 300 120 600 60 T 1200 60 T 1800 60 T 2400 60 V120 H0 Z" />
      </svg>
      <!-- Bordas em onda; a linha branca acompanha a borda que vai na frente. -->
      <svg class="curtain-side curtain-side--right" viewBox="0 0 120 2400" preserveAspectRatio="none">
        <path d="M60 0 Q 0 300 60 600 T 60 1200 T 60 1800 T 60 2400 H0 V0 Z" />
        <path class="curtain-edge" d="M60 0 Q 0 300 60 600 T 60 1200 T 60 1800 T 60 2400" />
      </svg>
      <svg class="curtain-side curtain-side--left" viewBox="0 0 120 2400" preserveAspectRatio="none">
        <path d="M60 0 Q 120 300 60 600 T 60 1200 T 60 1800 T 60 2400 H120 V0 Z" />
        <path class="curtain-edge" d="M60 0 Q 120 300 60 600 T 60 1200 T 60 1800 T 60 2400" />
      </svg>

      <div class="curtain-fx">
        <!-- Rastros de velocidade no sentido da transição. -->
        <span v-for="n in 8" :key="n" class="curtain-streak" :style="{ '--n': n }"></span>

        <!-- Rota pontilhada ao fundo, ligando paradas. -->
        <svg class="curtain-route" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
          <path
            class="curtain-route-line"
            d="M-40 760 C 220 760, 260 560, 470 600 S 760 820, 960 640 S 1220 300, 1480 340"
          />
          <path class="curtain-route-line curtain-route-line--top" d="M-40 140 C 240 60, 420 260, 700 170 S 1180 40, 1480 120" />
          <circle class="curtain-route-stop" cx="470" cy="600" r="9" />
          <circle class="curtain-route-stop" cx="960" cy="640" r="9" />
          <circle class="curtain-route-stop" cx="700" cy="170" r="7" />
        </svg>
      </div>

      <div class="curtain-center">
        <BrandLogo class="curtain-logo" spin="always" white />

        <p class="curtain-word">
          <span
            v-for="(letter, i) in WORD"
            :key="i"
            :class="{ 'is-accent': i >= 4 }"
            :style="{ '--i': i }"
          >{{ letter }}</span>
        </p>
        <p class="curtain-tagline">Sua rota está a caminho</p>

        <!-- Carregamento: estrada grafite, faixa laranja enchendo e a van na ponta. -->
        <div class="curtain-road">
          <span class="curtain-road-lane"></span>
          <span class="curtain-road-fill">
            <span class="curtain-road-van"><BaseIcon name="mdi-bus-side" /></span>
          </span>
        </div>
        <p class="curtain-progress">Carregando <span class="curtain-pct"></span></p>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
$wave-h: 110px;
$ease-curtain: cubic-bezier(0.76, 0, 0.24, 1);
$ease-back: cubic-bezier(0.34, 1.56, 0.64, 1);
// Laranja mais forte da cortina (a borda em onda usa a mesma cor, sem emenda).
$orange: #e86d05;
$orange-top: #f2801a;
$orange-deep: #c45700;
$graphite: #1c1c1f;

// Porcentagem do carregamento animada só com CSS.
@property --curtain-pct {
  syntax: '<integer>';
  initial-value: 0;
  inherits: false;
}

.page-curtain {
  position: fixed;
  inset: 0;
  z-index: $z-toast + 10;
  pointer-events: none;
  visibility: hidden;
  overflow: hidden;

  &:not(.is-idle) {
    visibility: visible;
    pointer-events: auto;
  }
}

// Cada painel (camadas + cortina principal) desliza sozinho, com atraso próprio:
// na entrada o grafite vai na frente; na saída a cortina principal sai primeiro.
.curtain-panel {
  position: absolute;
  inset: 0;
  will-change: transform;
  --in: 0s;
  --out: 0s;
}

.curtain-layer {
  display: none;
  color: var(--layer);
  background: var(--layer);

  .dir-side &,
  .dir-side-back & {
    display: block;
  }

  &--dark {
    --layer: #{$graphite};
    --out: 0.18s;
  }

  &--light {
    --layer: #ff9a33;
    --in: 0.09s;
    --out: 0.09s;
  }
}

.curtain-body {
  display: flex;
  align-items: center;
  justify-content: center;
  color: $orange;
  // Luz suave no centro sobre o laranja forte; as bordas ficam na cor exata da onda.
  background:
    radial-gradient(circle at 50% 46%, rgba(255, 176, 92, 0.55) 0%, rgba(255, 176, 92, 0) 46%),
    linear-gradient(180deg, $orange-top 0%, $orange 45%, $orange-deep 100%);
  --in: 0.18s;
  // Fica abaixo da tela (com a onda escondida) até começar a subir.
  transform: translateY(calc(100% + #{$wave-h} + 24px));

  .is-covering &,
  .is-covered & {
    transform: translateY(0);
    transition: transform 0.9s $ease-curtain;
  }

  .is-revealing & {
    transform: translateY(calc(100% + #{$wave-h} + 24px));
    transition: transform 0.9s $ease-curtain;
  }

  .dir-side &,
  .dir-side-back & {
    background:
      radial-gradient(circle at 50% 46%, rgba(255, 176, 92, 0.55) 0%, rgba(255, 176, 92, 0) 46%),
      $orange;
  }
}

// Modo lateral: começa escondida à esquerda, cobre a tela e sai pela direita.
.dir-side .curtain-panel {
  transform: translateX(calc(-100% - #{$wave-h}));
}

// Volta: entra pela direita e sai pela esquerda.
.dir-side-back .curtain-panel {
  transform: translateX(calc(100% + #{$wave-h}));
}

.dir-side.is-covering .curtain-panel,
.dir-side.is-covered .curtain-panel,
.dir-side-back.is-covering .curtain-panel,
.dir-side-back.is-covered .curtain-panel {
  transform: translateX(0);
  transition: transform 0.82s $ease-curtain var(--in);
}

.dir-side.is-revealing .curtain-panel {
  transform: translateX(calc(100% + #{$wave-h}));
  transition: transform 0.82s $ease-curtain var(--out);
}

.dir-side-back.is-revealing .curtain-panel {
  transform: translateX(calc(-100% - #{$wave-h}));
  transition: transform 0.82s $ease-curtain var(--out);
}

.curtain-side {
  display: none;
  position: absolute;
  top: 0;
  width: $wave-h;
  height: 200%;
  max-height: none;
  max-width: none;
  overflow: visible;
  fill: currentColor;
  animation: curtain-side 1.6s linear infinite;

  .dir-side &,
  .dir-side-back & {
    display: block;
  }

  &--right {
    left: calc(100% - 1px);
  }

  &--left {
    right: calc(100% - 1px);
    animation-direction: reverse;
  }
}

// Linha branca fina na borda da cortina principal.
.curtain-edge {
  fill: none;
  stroke: rgba(255, 255, 255, 0.85);
  stroke-width: 3px;
  vector-effect: non-scaling-stroke;
}

@keyframes curtain-side {
  to {
    transform: translateY(-50%);
  }
}

.dir-side .curtain-wave,
.dir-side-back .curtain-wave {
  display: none;
}

// Ondas no topo da cortina; correm para os lados enquanto a cortina se move.
.curtain-wave {
  position: absolute;
  left: 0;
  width: 200%;
  // O reset global limita svg a 100% de largura; sem isso a onda "quebra" ao deslizar.
  max-width: none;
  height: $wave-h;
  animation: curtain-wave 1.6s linear infinite;

  &--front {
    bottom: calc(100% - 1px);
    fill: $orange-top;
  }

  &--back {
    bottom: calc(100% - 1px + 18px);
    fill: rgba(242, 128, 26, 0.45);
    animation-duration: 2.6s;
    animation-direction: reverse;
  }
}

@keyframes curtain-wave {
  to {
    transform: translateX(-50%);
  }
}

// Efeitos de fundo (rastros e rota) presos dentro da cortina.
.curtain-fx {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

// Rastros de velocidade: atravessam a tela no sentido da transição.
.curtain-streak {
  position: absolute;
  left: 0;
  top: calc(var(--n) * 11% - 4%);
  width: calc(14vw + var(--n) * 2vw);
  height: 2px;
  border-radius: 999px;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0), rgba(255, 255, 255, 0.5));
  opacity: 0;
  transform: translateX(-40vw);

  .is-covering &,
  .is-covered & {
    opacity: 1;
    animation: streak 1.15s linear infinite;
    animation-delay: calc(var(--n) * -0.23s);
  }

  .dir-side-back & {
    background: linear-gradient(270deg, rgba(255, 255, 255, 0), rgba(255, 255, 255, 0.5));
    animation-direction: reverse;
  }

  // Ao entrar na conta, os rastros sobem.
  .dir-up & {
    display: none;
  }
}

@keyframes streak {
  from {
    transform: translateX(-40vw);
  }
  to {
    transform: translateX(130vw);
  }
}

// Rota pontilhada que "anda" ao fundo.
.curtain-route {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  max-width: none;
  opacity: 0;
  transition: opacity 0.6s ease 0.1s;

  .is-covered & {
    opacity: 1;
  }
}

.curtain-route-line {
  fill: none;
  stroke: rgba(255, 255, 255, 0.3);
  stroke-width: 4;
  stroke-linecap: round;
  stroke-dasharray: 0.1 18;
  animation: route-march 1.2s linear infinite;

  &--top {
    stroke: rgba(255, 255, 255, 0.18);
    animation-direction: reverse;
  }
}

.curtain-route-stop {
  fill: $orange;
  stroke: rgba(255, 255, 255, 0.6);
  stroke-width: 4;
}

@keyframes route-march {
  to {
    stroke-dashoffset: -18.1;
  }
}

.curtain-center {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  opacity: 0;
  transition: opacity 0.25s ease;

  .is-covered & {
    opacity: 1;
  }

  .is-revealing & {
    opacity: 0;
    transform: scale(0.95);
    transition:
      opacity 0.22s ease,
      transform 0.22s ease;
  }
}

// Logo branca grande, com a rodinha girando.
.curtain-logo {
  width: 150px;
  filter: drop-shadow(0 10px 22px rgba(90, 35, 0, 0.25));
  transform: scale(0.4) translateY(30px);
  opacity: 0;

  .is-covered & {
    opacity: 1;
    transform: none;
    transition:
      opacity 0.3s ease,
      transform 0.7s $ease-back 0.05s;
  }

  @include from($bp-desktop + 1px) {
    width: 190px;
  }
}

// "Next" em branco e "Router" em grafite, letra por letra virando para a frente.
.curtain-word {
  display: flex;
  margin-top: 10px;
  perspective: 600px;
  font-size: clamp(2rem, 1.55rem + 1.5vw, 2.7rem);
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1.1;
  color: #fff;

  span {
    display: inline-block;
    opacity: 0;
    transform: rotateX(-90deg) translateY(40%);
    transform-origin: 50% 100%;

    .is-covered & {
      opacity: 1;
      transform: none;
      transition:
        opacity 0.3s ease,
        transform 0.65s $ease-back;
      transition-delay: calc(var(--i) * 40ms + 260ms);
    }
  }

  .is-accent {
    color: $graphite;
  }
}

.curtain-tagline {
  margin-top: 6px;
  color: rgba(255, 255, 255, 0.85);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  opacity: 0;
  transform: translateY(6px);

  .is-covered & {
    opacity: 1;
    transform: none;
    transition: all 0.5s ease 0.75s;
  }
}

// Estrada grafite com faixa central andando; a parte percorrida fica laranja.
.curtain-road {
  position: relative;
  width: 230px;
  height: 14px;
  margin-top: 34px;
  border-radius: 999px;
  background: $graphite;
  box-shadow: 0 10px 24px -10px rgba(60, 20, 0, 0.6);
  opacity: 0;
  transform: scaleX(0.4);

  .is-covered & {
    opacity: 1;
    transform: none;
    transition:
      opacity 0.3s ease 0.45s,
      transform 0.5s $ease-back 0.45s;
  }

  @include from($bp-desktop + 1px) {
    width: 270px;
  }
}

.curtain-road-lane {
  position: absolute;
  left: 10px;
  right: 10px;
  top: 6px;
  height: 2px;
  background: repeating-linear-gradient(90deg, rgba(255, 255, 255, 0.55) 0 10px, transparent 10px 20px);
  animation: lane 0.45s linear infinite;
}

@keyframes lane {
  from {
    background-position: 20px 0;
  }
  to {
    background-position: 0 0;
  }
}

.curtain-road-fill {
  position: absolute;
  inset: 3px auto 3px 3px;
  width: 0;
  border-radius: 999px;
  background: linear-gradient(90deg, #ff7a00, #ffa33a);
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.15) inset;

  .is-covered & {
    animation: road-fill 1.1s cubic-bezier(0.65, 0, 0.35, 1) 0.4s forwards;
  }

  .is-revealing & {
    width: calc(100% - 6px);
  }
}

@keyframes road-fill {
  to {
    width: calc(100% - 6px);
  }
}

.curtain-road-van {
  position: absolute;
  right: -16px;
  bottom: 9px;
  display: grid;
  place-items: center;
  color: #fff;
  font-size: 1.7rem;
  filter: drop-shadow(0 3px 4px rgba(90, 35, 0, 0.35));
  animation: van-bump 0.3s ease-in-out infinite alternate;
}

@keyframes van-bump {
  to {
    translate: 0 -2px;
  }
}

.curtain-progress {
  margin-top: 12px;
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  font-variant-numeric: tabular-nums;
  opacity: 0;

  .is-covered & {
    opacity: 1;
    transition: opacity 0.3s ease 0.55s;
  }
}

.curtain-pct {
  display: inline-block;
  min-width: 3.2ch;
  text-align: left;
  counter-reset: pct var(--curtain-pct);

  &::after {
    content: counter(pct) '%';
  }

  .is-covered & {
    animation: pct-count 1.1s cubic-bezier(0.65, 0, 0.35, 1) 0.4s forwards;
  }

  .is-revealing & {
    --curtain-pct: 100;
  }
}

@keyframes pct-count {
  to {
    --curtain-pct: 100;
  }
}

@media (prefers-reduced-motion: reduce) {
  .curtain-route-line,
  .curtain-road-van,
  .curtain-road-lane,
  .curtain-side,
  .curtain-wave,
  .curtain-streak {
    animation: none;
  }
}
</style>
