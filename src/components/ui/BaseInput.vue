<script setup>
import { computed, shallowRef, useId } from 'vue'

const model = defineModel({ type: [String, Number], default: '' })
const externalShowPassword = defineModel('showPassword', { type: Boolean, default: undefined })

const props = defineProps({
  label: { type: String, default: '' },
  ariaLabel: { type: String, default: '' },
  type: { type: String, default: 'text' },
  variant: {
    type: String,
    default: 'outlined',
    validator: (v) => ['outlined', 'underline'].includes(v),
  },
  required: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  placeholder: { type: String, default: '' },
  autocomplete: { type: String, default: undefined },
  error: { type: String, default: '' },
  maxlength: { type: [String, Number], default: undefined },
  format: { type: Function, default: null },
  onlyNumbers: { type: Boolean, default: false },
})

const emit = defineEmits(['blur', 'input'])

const fieldId = useId()
const localShowPassword = shallowRef(false)

const isPassword = computed(() => props.type === 'password')
const isPasswordVisible = computed(() =>
  externalShowPassword.value !== undefined ? externalShowPassword.value : localShowPassword.value,
)
const resolvedType = computed(() =>
  isPassword.value ? (isPasswordVisible.value ? 'text' : 'password') : props.type,
)
const resolvedInputMode = computed(() =>
  props.onlyNumbers || props.format ? 'numeric' : undefined,
)

function togglePassword() {
  const next = !isPasswordVisible.value
  if (externalShowPassword.value !== undefined) {
    externalShowPassword.value = next
  } else {
    localShowPassword.value = next
  }
}

function handleInput(event) {
  if (props.format) {
    props.format(event, (formatted) => {
      model.value = formatted
    })
    emit('input', event)
    return
  }

  let value = event.target.value
  if (props.onlyNumbers) {
    value = String(value || '').replace(/\D/g, '')
    if (props.maxlength) value = value.slice(0, Number(props.maxlength))
    event.target.value = value
  }
  model.value = value
  emit('input', event)
}
</script>

<template>
  <div class="base-field" :class="[`variant-${variant}`, { 'has-error': Boolean(error) }]">
    <label v-if="label" :for="fieldId" class="base-field-label">
      {{ label }}<span v-if="required" class="base-field-required" aria-hidden="true">*</span>
    </label>

    <div class="base-field-control">
      <span v-if="$slots.prefix" class="base-field-affix is-prefix">
        <slot name="prefix" />
      </span>

      <input
        :id="fieldId"
        :value="model"
        :type="resolvedType"
        :inputmode="resolvedInputMode"
        :required="required"
        :disabled="disabled"
        :placeholder="placeholder"
        :autocomplete="autocomplete"
        :maxlength="maxlength"
        :aria-label="!label && ariaLabel ? ariaLabel : undefined"
        :aria-invalid="error ? true : undefined"
        :aria-describedby="error ? `${fieldId}-error` : undefined"
        class="base-field-input"
        :class="{ 'has-trailing': isPassword || Boolean($slots.suffix) }"
        @input="handleInput"
        @blur="emit('blur', $event)"
      />

      <button
        v-if="isPassword"
        type="button"
        class="base-field-toggle"
        :disabled="disabled"
        :aria-label="isPasswordVisible ? 'Ocultar senha' : 'Mostrar senha'"
        :aria-pressed="isPasswordVisible"
        @click="togglePassword"
      >
        <span
          class="mdi"
          :class="isPasswordVisible ? 'mdi-eye-off-outline' : 'mdi-eye-outline'"
          aria-hidden="true"
        ></span>
      </button>

      <span v-if="$slots.suffix" class="base-field-affix is-suffix">
        <slot name="suffix" />
      </span>
    </div>

    <p v-if="$slots.hint && !error" class="base-field-hint">
      <slot name="hint" />
    </p>

    <Transition name="fade-slide">
      <p v-if="error" :id="`${fieldId}-error`" class="base-field-error" role="alert">{{ error }}</p>
    </Transition>
  </div>
</template>

<style lang="scss" scoped>
.base-field {
  display: flex;
  flex-direction: column;
  width: 100%;
  margin-bottom: $space-4;

  &-label {
    display: block;
    color: var(--primary);
    font-weight: $font-semibold;
    font-size: $text-sm;
    margin-bottom: 6px;
  }

  &-required {
    color: var(--primary);
    margin-left: 2px;
  }

  &-control {
    position: relative;
    display: flex;
    align-items: center;
    width: 100%;
  }

  &-input {
    width: 100%;
    color: var(--text);
    font-size: 0.92rem;
    transition:
      outline-color $duration-normal $ease-fluid,
      border-color $duration-normal $ease-fluid,
      background-color $duration-normal $ease-fluid;

    &::placeholder {
      color: var(--text-muted);
    }

    &:disabled {
      cursor: not-allowed;
      opacity: 0.65;
    }

    &.has-trailing {
      padding-right: 42px;
    }
  }

  &-toggle {
    position: absolute;
    right: $space-2;
    top: 50%;
    transform: translateY(-50%);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: $space-1;
    border-radius: $radius-xs;
    color: var(--text-muted);
    font-size: 1.2rem;
    transition: color $duration-fast $ease-fluid;

    &:hover:not(:disabled) {
      color: var(--primary);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  &-affix {
    display: inline-flex;
    align-items: center;
    color: var(--text-muted);

    &.is-prefix {
      margin-right: $space-2;
    }

    &.is-suffix {
      margin-left: $space-2;
    }
  }

  &-hint {
    color: var(--text-muted);
    font-size: $text-xs;
    margin-top: $space-1;
  }

  &-error {
    color: var(--danger);
    font-size: 0.78rem;
    margin-top: $space-1;
  }

  &.variant-outlined {
    .base-field-input {
      padding: 11px 14px;
      border-radius: $radius-md;
      background: var(--color-surface);
      outline: 1.5px solid var(--border);
      outline-offset: -1.5px;

      &:focus {
        outline: 2px solid var(--primary);
        outline-offset: -2px;
      }

      &:disabled {
        background: var(--input-surface);
        color: var(--text-muted);
      }
    }

    &.has-error .base-field-input {
      outline-color: var(--danger);
    }
  }

  &.variant-underline {
    .base-field-input {
      padding: 10px $space-1;
      background: transparent;
      border-bottom: 1.5px solid var(--border);
      border-radius: 0;
      font-size: 1rem;

      &:focus {
        border-bottom-color: var(--primary);
      }
    }

    &.has-error .base-field-input {
      border-bottom-color: var(--danger);
    }
  }
}
</style>
