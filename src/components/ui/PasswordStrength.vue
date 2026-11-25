<script setup>
import { computed } from 'vue'

// Medidor visual da senha. As regras obrigatórias seguem isStrongPassword (8+ e não só números);
// maiúscula e símbolo só deixam a senha "forte".
const props = defineProps({
  password: { type: String, default: '' },
})

const rules = computed(() => {
  const v = props.password
  return [
    { label: '8 ou mais caracteres', ok: v.length >= 8 },
    { label: 'Letras e números', ok: /[a-zA-Z]/.test(v) && /\d/.test(v) },
    { label: 'Uma letra maiúscula', ok: /[A-Z]/.test(v) },
    { label: 'Um símbolo (!@#...)', ok: /[^a-zA-Z0-9]/.test(v) },
  ]
})

const score = computed(() => (props.password ? rules.value.filter((r) => r.ok).length : 0))
const LEVELS = ['', 'Fraca', 'Razoável', 'Boa', 'Forte']
</script>

<template>
  <div class="password-strength" :class="`level-${score}`" aria-live="polite">
    <div class="strength-bars" aria-hidden="true">
      <span v-for="n in 4" :key="n" :class="{ on: n <= score }"></span>
    </div>
    <p class="strength-label">
      Força da senha: <strong>{{ password ? LEVELS[score] || 'Fraca' : '—' }}</strong>
    </p>
    <ul class="strength-rules">
      <li v-for="rule in rules" :key="rule.label" :class="{ ok: rule.ok }">
        <BaseIcon :name="rule.ok ? 'mdi-check-bold' : 'mdi-circle-small'" />
        {{ rule.label }}
      </li>
    </ul>
  </div>
</template>

<style lang="scss" scoped>
.password-strength {
  --level: var(--border);
  margin-top: -$space-1;
  padding: $space-3;
  border-radius: $radius-md;
  background: var(--altbg);

  &.level-1 {
    --level: var(--danger);
  }

  &.level-2 {
    --level: #f59e0b;
  }

  &.level-3 {
    --level: var(--primary);
  }

  &.level-4 {
    --level: var(--success);
  }
}

.strength-bars {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;

  span {
    height: 5px;
    border-radius: 999px;
    background: var(--border);
    transition: background-color 0.35s ease;

    &.on {
      background: var(--level);
    }
  }
}

.strength-label {
  margin-top: $space-2;
  color: var(--text-muted);
  font-size: $text-xs;

  strong {
    color: var(--text);
  }
}

.strength-rules {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 4px $space-3;
  margin: $space-2 0 0;
  padding: 0;
  list-style: none;

  li {
    display: flex;
    align-items: center;
    gap: 4px;
    color: var(--text-muted);
    font-size: $text-xs;
    transition: color 0.25s ease;

    &.ok {
      color: var(--success);
    }
  }
}
</style>
