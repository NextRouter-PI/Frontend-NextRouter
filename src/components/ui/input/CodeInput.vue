<script setup>
const modelValue = defineModel({ type: Array, default: () => ['', '', '', '', '', ''] })

function handleInput(index, event) {
  const valor = event.target.value.replace(/\D/g, '')
  if (valor.length > 1) {
    modelValue.value[index] = valor[0]
  } else {
    modelValue.value[index] = valor
  }

  if (valor && index < 5) {
    document.getElementById(`codigo-${index + 1}`)?.focus()
  }
}

function handleKeydown(index, event) {
  if (event.key === 'Backspace' && !modelValue.value[index] && index > 0) {
    document.getElementById(`codigo-${index - 1}`)?.focus()
  }
}
</script>

<template>
  <div class="codigo-inputs">
    <input
      v-for="(digit, index) in modelValue"
      :id="`codigo-${index}`"
      :key="index"
      v-model="modelValue[index]"
      type="text"
      maxlength="1"
      class="codigo-input"
      @input="handleInput(index, $event)"
      @keydown="handleKeydown(index, $event)"
    />
  </div>
</template>

<style scoped>
.codigo-inputs {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 20px;
}

.codigo-input {
  width: 45px;
  height: 50px;
  border: 2px solid var(--primary);
  border-radius: 8px;
  text-align: center;
  font-size: 20px;
  font-weight: bold;
  color: var(--primary);
  outline: none;
  transition: 0.2s;
}

.codigo-input:focus {
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.1);
  border-color: var(--primary);
}
</style>
