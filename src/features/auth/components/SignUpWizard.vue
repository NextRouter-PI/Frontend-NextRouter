<script setup>
import { watch } from 'vue'
import { useRouter } from 'vue-router'
import { REDIRECT_DELAY_MS, ROUTE_NAMES } from '@/constants'
import PublicShell from '@/components/layout/PublicShell.vue'
import AuthPhotoPanel from '@/components/layout/AuthPhotoPanel.vue'
import ThemeButton from '@/components/ui/ThemeButton.vue'
import photoSmall from '@/assets/images/cadastro-campus-640.webp'
import photoLarge from '@/assets/images/cadastro-campus-1120.webp'
import { useDeviceLayout } from '@/composables/useDeviceLayout'
import ErrorMessage from '@/components/ui/ErrorMessage.vue'

const props = defineProps({
  titlePrefix: { type: String, default: '' },
  titleHighlight: { type: String, default: '' },
  showDivider: { type: Boolean, default: false },
  stepperSteps: { type: Number, default: 0 },
  stepperCurrent: { type: Number, default: 1 },
  stepperLabels: { type: Array, default: () => [] },
  success: { type: Boolean, default: false },
  successTitle: { type: String, default: 'Conta criada com sucesso!' },
  successMessage: { type: String, default: '' },
  errors: { type: Array, default: () => [] },
})

const emit = defineEmits(['back', 'submit'])
const router = useRouter()
const { isMobile } = useDeviceLayout()

watch(
  () => props.success,
  (isSuccess, _prev, onCleanup) => {
    if (!isSuccess) return
    const timer = setTimeout(() => router.push({ name: ROUTE_NAMES.LOGIN }), REDIRECT_DELAY_MS)
    onCleanup(() => clearTimeout(timer))
  },
)
</script>

<template>
  <PublicShell full-bleed>
    <div class="wizard-split">
      <!-- Foto do lado oposto ao da escolha de perfil (que fica à direita). -->
      <AuthPhotoPanel
        class="wizard-photo"
        :small="photoSmall"
        :large="photoLarge"
        position="center 60%"
        :slides="[
          { quote: 'Falta pouco para embarcar.', highlight: 'embarcar', caption: 'Preencha seus dados e acompanhe suas viagens de onde estiver.' },
          { quote: 'Seus dados ficam protegidos.', highlight: 'protegidos', caption: 'Só a empresa do seu grupo vê o necessário para a viagem.' },
        ]"
        :features="[
          { icon: 'mdi-map-marker-path', text: 'Rotas em tempo real' },
          { icon: 'mdi-check-circle-outline', text: 'Confirmação de embarque' },
          { icon: 'mdi-bell-ring-outline', text: 'Avisos no celular' },
        ]"
      />

      <section class="wizard-panel">
        <div v-if="!isMobile" class="wizard-theme"><ThemeButton /></div>

        <div class="wizard-content">
          <header class="wizard-header">
            <button type="button" class="wizard-back" aria-label="Voltar" @click="emit('back')">
              <BaseIcon name="mdi-chevron-left" />
            </button>
            <h1 class="wizard-title">
              {{ titlePrefix }}<span v-if="titleHighlight">{{ titleHighlight }}</span>
            </h1>
          </header>

          <ol
            v-if="stepperSteps > 0 && !success"
            class="wizard-stepper"
            aria-label="Etapas do cadastro"
          >
            <li
              v-for="step in stepperSteps"
              :key="step"
              class="stepper-step"
              :class="{ active: stepperCurrent === step, done: stepperCurrent > step }"
              :aria-current="stepperCurrent === step ? 'step' : undefined"
            >
              <span class="step-circle">
                <Transition name="step-swap" mode="out-in">
                  <BaseIcon v-if="stepperCurrent > step" key="done" name="mdi-check" />
                  <span v-else key="num">{{ step }}</span>
                </Transition>
              </span>
              <span v-if="stepperLabels[step - 1]" class="step-label">{{ stepperLabels[step - 1] }}</span>
              <!-- Risco até a próxima bolinha: enche de laranja quando a etapa termina. -->
              <span v-if="step < stepperSteps" class="step-line" aria-hidden="true"></span>
            </li>
          </ol>

          <section class="wizard-card">
            <div v-if="success" class="wizard-success" role="status">
              <BaseIcon name="mdi-check-circle" class="wizard-success-icon" />
              <p class="wizard-success-title">{{ successTitle }}</p>
              <p v-if="successMessage" class="wizard-success-desc">{{ successMessage }}</p>
              <div class="wizard-redirect">
                <BaseIcon name="mdi-loading" spin />
                Redirecionando...
              </div>
            </div>

            <form v-else class="wizard-form" @submit.prevent="emit('submit')">
              <Transition name="fade-slide" mode="out-in">
                <slot />
              </Transition>

              <template v-for="(msg, idx) in errors" :key="idx">
                <ErrorMessage v-if="msg" :message="msg" />
              </template>

              <div v-if="$slots.actions" class="wizard-actions">
                <slot name="actions" />
              </div>
            </form>
          </section>
        </div>
      </section>
    </div>
  </PublicShell>
</template>

<style lang="scss" scoped>
.wizard-split {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--bg);
  color: var(--text);
  padding: 28px 18px 36px;

  @include from($bp-desktop + 1px) {
    flex-direction: row;
    min-height: 100vh;
    min-height: 100dvh;
    padding: 0;
  }
}

.wizard-photo {
  margin: -28px -18px $space-6;

  @include from($bp-desktop + 1px) {
    flex-basis: 55%;
    margin: 0;
    // Foto parada enquanto o formulário rola.
    position: sticky;
    top: 0;
    height: 100vh;
  }
}

.wizard-panel {
  position: relative;
  display: flex;
  justify-content: center;
  width: 100%;

  @include from($bp-desktop + 1px) {
    flex: 1;
    padding: $space-10 $space-10 $space-12;
  }
}

.wizard-theme {
  position: absolute;
  top: $space-5;
  right: $space-6;
}

.wizard-content {
  width: 100%;
  max-width: 560px;
  animation: rise-in $duration-reveal $ease-fluid 0.1s backwards;
}

.wizard-header {
  display: flex;
  align-items: center;
  gap: $space-3;
  margin-bottom: $space-6;
}

.wizard-back {
  @include flex-center;
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: $radius-round;
  background: var(--color-primary-soft);
  color: var(--primary);
  font-size: 1.6rem;
  transition:
    background-color $duration-normal $ease-fluid,
    color $duration-normal $ease-fluid,
    transform $duration-normal $ease-fluid;

  &:hover {
    background: var(--primary);
    color: var(--color-on-primary);
    transform: translateX(-3px);
  }
}

.wizard-title {
  font-size: clamp(1.5rem, 1.1rem + 1.2vw, 2.1rem);
  font-weight: $font-extrabold;
  letter-spacing: -0.025em;
  color: var(--text);

  span {
    color: var(--primary);
  }
}

// Etapas: bolinhas numeradas ligadas por um risco que se preenche.
.wizard-stepper {
  display: flex;
  margin: 0 0 $space-6;
  padding: 0;
  list-style: none;
}

.stepper-step {
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $space-2;
  text-align: center;
}

.step-circle {
  @include flex-center;
  position: relative;
  z-index: 1;
  width: 40px;
  height: 40px;
  border-radius: $radius-round;
  background: var(--color-surface);
  color: var(--text-muted);
  border: 2px solid var(--border);
  font-weight: $font-bold;
  transition:
    background-color 0.35s $ease-fluid,
    border-color 0.35s $ease-fluid,
    color 0.35s $ease-fluid,
    transform 0.45s $ease-spring;

  .active & {
    border-color: var(--primary);
    color: var(--primary);
    transform: scale(1.08);
    animation: step-pulse 2s ease-out infinite;
  }

  .done & {
    background: var(--gradient-brand);
    border-color: var(--primary);
    color: var(--color-on-primary);
  }
}

@keyframes step-pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(236, 131, 20, 0.45);
  }
  100% {
    box-shadow: 0 0 0 12px rgba(236, 131, 20, 0);
  }
}

.step-label {
  font-size: $text-xs;
  font-weight: $font-semibold;
  color: var(--text-muted);
  transition: color 0.35s $ease-fluid;

  .active &,
  .done & {
    color: var(--text);
  }
}

// Vai do centro desta bolinha ao centro da próxima, descontando os raios.
.step-line {
  position: absolute;
  top: 19px;
  left: calc(50% + 26px);
  width: calc(100% - 52px);
  height: 3px;
  border-radius: $radius-pill;
  background: var(--border);
  overflow: hidden;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: var(--gradient-brand);
    transform: scaleX(0);
    transform-origin: left;
    transition: transform 0.6s $ease-fluid;
  }

  .done &::after {
    transform: scaleX(1);
  }
}

.step-swap-enter-active,
.step-swap-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.3s $ease-spring;
}

.step-swap-enter-from,
.step-swap-leave-to {
  opacity: 0;
  transform: scale(0.4);
}

.wizard-card {
  position: relative;
  overflow: hidden;
  width: 100%;
  @include surface-card($space-6 18px $space-5, $radius-xl);
  box-shadow: 0 24px 48px -28px rgba(28, 28, 31, 0.35);

  // Faixa laranja no topo do cartão.
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: var(--gradient-brand);
  }

  @include from($bp-md) {
    padding: $space-8 $space-8 $space-6;
  }
}

.wizard-success {
  text-align: center;
  padding: $space-6 $space-3;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $space-3;

  &-icon {
    font-size: 3.4rem;
    color: var(--success);
  }

  &-title {
    font-size: 1.25rem;
    font-weight: $font-bold;
    color: var(--text);
  }

  &-desc {
    color: var(--text-muted);
    font-size: $text-md;
    max-width: 420px;
  }
}

.wizard-redirect {
  @include flex-center($space-2);
  margin-top: $space-2;
  color: var(--primary);
  font-weight: $font-semibold;
  font-size: $text-md;
}

.wizard-actions {
  display: flex;
  flex-direction: column;
  gap: $space-3;
  margin-top: $space-5;
}
</style>
