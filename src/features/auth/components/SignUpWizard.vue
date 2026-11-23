<script setup>
import { watch } from 'vue'
import { useRouter } from 'vue-router'
import { REDIRECT_DELAY_MS, ROUTE_NAMES } from '@/constants'
import PublicShell from '@/components/layout/PublicShell.vue'
import ErrorMessage from '@/components/ui/ErrorMessage.vue'

const props = defineProps({
  titlePrefix: { type: String, default: '' },
  titleHighlight: { type: String, default: '' },
  showDivider: { type: Boolean, default: false },
  stepperSteps: { type: Number, default: 0 },
  stepperCurrent: { type: Number, default: 1 },
  success: { type: Boolean, default: false },
  successTitle: { type: String, default: 'Conta criada com sucesso!' },
  successMessage: { type: String, default: '' },
  errors: { type: Array, default: () => [] },
})

const emit = defineEmits(['back', 'submit'])
const router = useRouter()

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
  <PublicShell
    show-back
    :title-prefix="titlePrefix"
    :title-highlight="titleHighlight"
    :show-divider="showDivider"
    @back="emit('back')"
  >
    <div
      v-if="stepperSteps > 0 && !success"
      class="wizard-stepper"
      aria-label="Etapas do cadastro"
    >
      <template v-for="step in stepperSteps" :key="step">
        <div class="stepper-step">
          <span
            class="step-circle"
            :class="{ active: stepperCurrent === step, done: stepperCurrent > step }"
          >
            <span v-if="stepperCurrent > step" class="mdi mdi-check" aria-hidden="true"></span>
            <template v-else>{{ step }}</template>
          </span>
        </div>
        <div
          v-if="step < stepperSteps"
          class="step-line"
          :class="{ done: stepperCurrent > step }"
        ></div>
      </template>
    </div>

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
  </PublicShell>
</template>

<style lang="scss" scoped>
.wizard-stepper {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: $space-3 0 22px;
  padding: 0 $space-2;
}

.stepper-step {
  @include flex-center;
}

.step-circle {
  width: 34px;
  height: 34px;
  border-radius: $radius-round;
  @include flex-center;
  font-size: $text-base;
  font-weight: $font-bold;
  background: var(--altbg);
  color: var(--text);
  border: 2px solid var(--border);
  transition: all $duration-normal $ease-fluid;

  &.active {
    background: var(--color-surface);
    border-color: var(--primary);
  }

  &.done {
    background: var(--primary);
    border-color: var(--primary);
    color: var(--color-on-primary);
  }
}

.step-line {
  flex: 1;
  height: 2px;
  background: var(--border);
  margin: 0 $space-2;
  transition: background-color $duration-normal $ease-fluid;

  &.done {
    background: var(--primary);
  }
}

.wizard-card {
  width: 100%;
  @include surface-card($space-5 18px, 16px);

  @include from($bp-md) {
    padding: $space-8 28px;
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
