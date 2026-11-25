<script setup>
import { useId } from 'vue'
import { useBaseInput } from './input/useBaseInput'

const model = defineModel({ type: [String, Number], default: '' })
const externalShowPassword = defineModel('showPassword', { type: Boolean, default: undefined })

const props = defineProps({
  label: { type: String, default: '' },
  ariaLabel: { type: String, default: '' },
  type: { type: String, default: 'text' },
  variant: {
    type: String,
    default: 'outlined',
    validator: (v) => ['outlined', 'underline', 'floating'].includes(v),
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

const emit = defineEmits(['blur', 'focus', 'input'])
const fieldId = useId()

const {
  isFocused,
  isPassword,
  isFloating,
  floatingLabel,
  isFloated,
  isPasswordVisible,
  resolvedType,
  resolvedInputMode,
  togglePassword,
  handleFocus,
  handleInput,
  handleBlur,
} = useBaseInput({ props, model, externalShowPassword, emit })
</script>

<template>
  <div
    class="base-field"
    :class="[
      `variant-${variant}`,
      {
        'has-error': Boolean(error),
        'is-focused': isFocused,
        'is-floated': isFloated,
      },
    ]"
  >
    <label v-if="label && !isFloating" :for="fieldId" class="base-field-label">
      {{ label }}<span v-if="required" class="base-field-required" aria-hidden="true">*</span>
    </label>

    <div class="base-field-control">
      <fieldset v-if="isFloating" class="base-field-notch" aria-hidden="true">
        <legend class="base-field-notch-legend">
          <span>{{ floatingLabel }}</span>
        </legend>
      </fieldset>

      <label v-if="isFloating && floatingLabel" :for="fieldId" class="base-field-floating-label">
        {{ floatingLabel }}
      </label>

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
        :placeholder="isFloating ? ' ' : placeholder"
        :autocomplete="autocomplete"
        :maxlength="maxlength"
        :aria-label="!label && !isFloating && ariaLabel ? ariaLabel : undefined"
        :aria-invalid="error ? true : undefined"
        :aria-describedby="error ? `${fieldId}-error` : undefined"
        class="base-field-input"
        :class="{ 'has-trailing': isPassword || Boolean($slots.suffix), 'has-prefix': Boolean($slots.prefix) }"
        @focus="handleFocus"
        @input="handleInput"
        @blur="handleBlur"
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
        <BaseIcon :name="isPasswordVisible ? 'mdi-eye-off-outline' : 'mdi-eye-outline'" />
      </button>

      <span v-if="$slots.suffix" class="base-field-affix is-suffix">
        <slot name="suffix" />
      </span>
    </div>

    <div class="base-field-feedback">
      <Transition name="fade-slide" mode="out-in">
        <p v-if="error" :id="`${fieldId}-error`" key="error" class="base-field-error" role="alert">
          {{ error }}
        </p>
        <p v-else-if="$slots.hint" key="hint" class="base-field-hint">
          <slot name="hint" />
        </p>
      </Transition>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.base-field {
  display: flex;
  flex-direction: column;
  width: 100%;
  margin-bottom: $space-2;

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

    &:focus-visible {
      outline: none;
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
    z-index: 2;
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

    // Ícone dentro do campo, à esquerda; acende quando o campo está em foco.
    &.is-prefix {
      position: absolute;
      left: 14px;
      z-index: 1;
      font-size: 1.15rem;
      pointer-events: none;
      transition: color $duration-normal $ease-fluid;

      .is-focused & {
        color: var(--primary);
      }
    }

    &.is-suffix {
      margin-left: $space-2;
    }
  }

  &-feedback {
    min-height: 20px;
    margin-top: $space-1;
    display: flex;
    align-items: flex-start;
  }

  &-hint {
    color: var(--text-muted);
    font-size: $text-xs;
    line-height: 1.35;
  }

  &-error {
    color: var(--danger);
    font-size: 0.78rem;
    line-height: 1.35;
  }

  .base-field-control .base-field-input.has-prefix {
    padding-left: 42px;
  }

  &.variant-outlined {
    .base-field-input {
      padding: 11px 14px;
      border-radius: $radius-md;
      background: var(--color-surface);
      outline: 1.5px solid var(--border);
      outline-offset: -1.5px;

      &:focus,
      &:focus-visible {
        outline: 2px solid var(--primary);
        outline-offset: -2px;
        box-shadow: 0 0 0 4px var(--color-primary-soft);
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

      &:focus,
      &:focus-visible {
        outline: none;
        border-bottom-color: var(--primary);
      }
    }

    &.has-error .base-field-input {
      border-bottom-color: var(--danger);
    }
  }

  &.variant-floating {
    margin-top: 2px;

    .base-field-control {
      min-height: 50px;
    }

    .base-field-notch {
      position: absolute;
      inset: -6px 0 0 0;
      margin: 0;
      padding: 0 10px;
      border: 1.5px solid var(--border);
      border-radius: $radius-md;
      pointer-events: none;
      transition:
        border-color $duration-normal $ease-fluid,
        border-width $duration-fast $ease-fluid,
        box-shadow $duration-normal $ease-fluid;
    }

    .base-field-notch-legend {
      display: block;
      width: auto;
      height: 11px;
      max-width: 0.01px;
      padding: 0;
      font-size: 0.78rem;
      font-weight: $font-semibold;
      visibility: hidden;
      white-space: nowrap;
      overflow: hidden;
      transition:
        max-width $duration-normal $ease-fluid,
        padding $duration-normal $ease-fluid;

      span {
        display: inline-block;
        padding: 0 4px;
      }
    }

    .base-field-floating-label {
      position: absolute;
      left: 14px;
      top: 50%;
      transform: translateY(-50%);
      transform-origin: left center;
      color: var(--text-muted);
      font-size: 0.96rem;
      font-weight: $font-medium;
      line-height: 1;
      pointer-events: none;
      z-index: 1;
      transition:
        top $duration-normal $ease-fluid,
        left $duration-normal $ease-fluid,
        font-size $duration-normal $ease-fluid,
        color $duration-normal $ease-fluid,
        transform $duration-normal $ease-fluid;
    }

    .base-field-input {
      padding: 14px 14px 12px;
      border-radius: $radius-md;
      background: transparent;
      font-size: 0.98rem;
      z-index: 1;

      &:focus,
      &:focus-visible {
        outline: none;
      }
    }

    &.is-floated {
      .base-field-notch-legend {
        max-width: 100%;
        padding: 0 2px;
      }

      .base-field-floating-label {
        top: 0;
        left: 12px;
        font-size: 0.78rem;
        font-weight: $font-semibold;
        transform: translateY(-50%);
      }
    }

    &.is-focused {
      .base-field-notch {
        border-color: var(--primary);
        border-width: 2px;
      }

      .base-field-floating-label {
        color: var(--primary);
      }
    }

    &.has-error {
      .base-field-notch {
        border-color: var(--danger);
      }

      .base-field-floating-label {
        color: var(--danger);
      }
    }
  }
}
</style>
