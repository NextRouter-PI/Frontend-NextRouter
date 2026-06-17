<script setup>
import { ref } from 'vue'

const props = defineProps({
  addresses: { type: Array, required: true },
  selectedIndex: { type: Number, default: 0 }
})

const emit = defineEmits(['update:selectedIndex', 'edit', 'add'])

const mostrarDropdown = ref(false)

function toggleDropdown() {
  mostrarDropdown.value = !mostrarDropdown.value
}

function select(index) {
  emit('update:selectedIndex', index)
  mostrarDropdown.value = false
}

function edit() { emit('edit') }
function add() { emit('add') }
</script>

<template>
  <div class="address-section">
    <div class="address-label">
      <span>Meus Endereços</span>
      <div class="action-buttons">
        <span class="icon-btn mdi mdi-pencil" @click="edit" title="Editar endereço"></span>
        <span class="icon-btn mdi mdi-plus" @click="add" title="Adicionar novo endereço"></span>
      </div>
    </div>

    <div
      class="address-selected"
      @click="toggleDropdown"
    >
      <div class="address-content">
        <p class="address-text">{{ addresses[selectedIndex] }}</p>
      </div>
      <span class="dropdown-icon mdi mdi-chevron-down" :class="{ active: mostrarDropdown }"></span>
    </div>

    <transition name="slide">
      <div v-if="mostrarDropdown" class="address-dropdown">
        <div
          v-for="(address, index) in addresses"
          :key="index"
          class="address-option"
          :class="{ selected: selectedIndex === index }"
          @click="select(index)"
        >
          <p class="address-text">{{ address }}</p>
          <span v-if="selectedIndex === index" class="check-icon mdi mdi-check"></span>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.address-section {
  margin-top: 30px;
  border-top: 2px solid #f48a1d;
  padding-top: 20px;
  position: relative;
}

.address-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #f48a1d;
  font-weight: bold;
  font-size: 1.1rem;
  margin-bottom: 15px;
}

.action-buttons {
  display: flex;
  gap: 15px;
}

.icon-btn {
  color: #f48a1d;
  font-size: 24px;
  cursor: pointer;
  transition: transform 0.2s, color 0.2s;
}

.icon-btn:hover {
  transform: scale(1.2);
  color: #d3730e;
}

.address-selected {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px;
  border: 2px solid #f48a1d;
  border-radius: 8px;
  background-color: #fff8f0;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 10px;
}

.address-selected:hover {
  box-shadow: 0 4px 12px rgba(244, 138, 29, 0.2);
}

.address-content { flex: 1; }

.address-text {
  margin: 0;
  color: #333;
  font-size: 0.95rem;
  line-height: 1.4;
}

.dropdown-icon {
  color: #f48a1d;
  font-size: 24px;
  transition: transform 0.3s ease;
  margin-left: 10px;
}

.dropdown-icon.active {
  transform: rotate(180deg);
}

.address-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 2px solid #f48a1d;
  border-top: none;
  border-radius: 0 0 8px 8px;
  z-index: 10;
  margin-top: -10px;
  padding: 10px 0;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.address-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 15px;
  cursor: pointer;
  transition: background-color 0.2s;
  border-left: 4px solid transparent;
}

.address-option:hover {
  background-color: #fff8f0;
}

.address-option.selected {
  background-color: #fff8f0;
  border-left-color: #f48a1d;
}

.check-icon {
  color: #4caf50;
  font-size: 20px;
  margin-left: 12px;
}

.slide-enter-active, .slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from, .slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
