<script setup>
const props = defineProps({
  email: { type: String, default: 'seuemail@gmail.com' }
})

const emit = defineEmits(['goToLogin'])
</script>

<template>
  <div class="success-container">
    <div class="icon-success">
      <span class="check-mark">✓</span>
    </div>

    <div class="success-message">
      Seus dados foram para a análise da empresa
    </div>

    <div class="sub-message">
      Enviaremos um e-mail para <span class="highlight-email">{{ email }}</span> para você realizar o cadastro
    </div>

    <button class="btn-ok" @click="emit('goToLogin')">
      OK
    </button>
  </div>
</template>

<style scoped>
.success-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 100px 30px;
  min-height: 400px;
  max-width: 600px;
  margin: 0 auto;
}

.icon-success {
  background-color: #f48a1d;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 40px;
  color: white;
  font-size: 30px;
  box-shadow: 0 4px 10px rgba(244, 138, 29, 0.3);
}

.check-mark {
  font-weight: bold;
}

.success-message {
  font-size: 1.2rem;
  font-weight: 800;
  color: #000;
  line-height: 1.3;
  margin-bottom: 20px;
}

.sub-message {
  font-size: 1.1rem;
  font-weight: 700;
  color: #000;
  line-height: 1.4;
  margin-bottom: 50px;
}

.highlight-email {
  color: #f48a1d;
}

.btn-ok {
  background-color: #f48a1d;
  color: white;
  border: none;
  width: 100%;
  max-width: 280px;
  padding: 15px;
  border-radius: 10px;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  transition: opacity 0.2s;
}

.btn-ok:hover {
  opacity: 0.9;
}
</style>
