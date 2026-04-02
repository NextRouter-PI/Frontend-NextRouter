<script setup>
import { ref, computed } from 'vue';

const form = ref({
  nomeCompleto: '',
  dia: '',
  mes: '',
  ano: '',
  cpf: '',
  email: '',
  telefone: ''
});

const dias = computed(() => Array.from({ length: 31 }, (_, i) => i + 1));
const meses = [
  { value: '01', label: 'Janeiro' },
  { value: '02', label: 'Fevereiro' },
  { value: '03', label: 'Março' },
  { value: '04', label: 'Abril' },
  { value: '05', label: 'Maio' },
  { value: '06', label: 'Junho' },
  { value: '07', label: 'Julho' },
  { value: '08', label: 'Agosto' },
  { value: '09', label: 'Setembro' },
  { value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' },
  { value: '12', label: 'Dezembro' }
];

const currentYear = new Date().getFullYear();
const anos = computed(() =>
  Array.from({ length: currentYear - 1899 }, (_, i) => currentYear - i)
);

const handleSubmit = () => {
  const cadastro = {
    nomeCompleto: form.value.nomeCompleto.trim(),
    dataNascimento: `${form.value.dia}/${form.value.mes}/${form.value.ano}`,
    cpf: form.value.cpf.trim(),
    email: form.value.email.trim(),
    telefone: form.value.telefone.trim()
  };

  console.log('Cadastro de usuário:', cadastro);
  alert('Cadastro enviado! Verifique o console para os dados.');
};
</script>

<template>
  <section class="form-container">
    <h2 class="title">Bem vindo <span class="subtitle">Passageiro</span></h2>
    <form class="signup-form" @submit.prevent="handleSubmit">
      <div class="field-group">
        <label for="nomeCompleto">Nome completo</label>
        <input
          id="nomeCompleto"
          type="text"
          v-model="form.nomeCompleto"
          placeholder="Digite seu nome completo"
          required
        />
      </div>

      <div class="field-group">
        <label>Data de nascimento</label>
        <div class="date-row">
          <div>
            <label for="dia"></label>
            <input
              id="dia"
              type="text"
              list="dias"
              v-model="form.dia"
              placeholder="Dia"
              maxlength="2"
              required
            />
            <datalist id="dias">
              <option v-for="dia in dias" :key="dia" :value="String(dia).padStart(2, '0')" />
            </datalist>
          </div>

          <div>
            <label for="mes"></label>
            <input
              id="mes"
              type="text"
              list="meses"
              v-model="form.mes"
              placeholder="Mês"
              required
            />
            <datalist id="meses">
              <option v-for="mes in meses" :key="mes.value" :value="mes.label" />
            </datalist>
          </div>

          <div>
            <label for="ano"></label>
            <input
              id="ano"
              type="text"
              list="anos"
              v-model="form.ano"
              placeholder="Ano"
              maxlength="4"
              required
            />
            <datalist id="anos">
              <option v-for="ano in anos" :key="ano" :value="ano" />
            </datalist>
          </div>
        </div>
      </div>

      <div class="field-group">
        <label for="cpf">CPF</label>
        <input
          id="cpf"
          type="text"
          v-model="form.cpf"
          placeholder="000.000.000-00"
          maxlength="14"
          required
        />
      </div>

      <div class="field-group">
        <label for="email">Email</label>
        <input
          id="email"
          type="email"
          v-model="form.email"
          placeholder="seu@email.com"
          required
        />
      </div>

      <div class="field-group">
        <label for="telefone">Telefone</label>
        <input
          id="telefone"
          type="tel"
          v-model="form.telefone"
          placeholder="(00) 90000-0000"
          required
        />
      </div>

      <button type="submit" class="btn-submit">Enviar cadastro</button>
    </form>
  </section>
</template>

<style scoped>
.form-container {
  max-width: 520px;
  margin: 5rem auto 2rem;
  padding: 2rem;
  background: var(--bg-white, #ffffff);
  border-radius: 16px;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.08);
}

.title {
  margin-bottom: 0.5rem;
  font-size: 2rem;
  font-weight: 800;
  text-align: center;
  color: var(--text-black, #000000);
}

.subtitle {
  display: block;
  color: var(--primary-orange, #f48a1d);
  font-size: 2.2rem;
}

.signup-form {
  display: grid;
  gap: 1.25rem;
}

.field-group {
  display: flex;
  flex-direction: column;
}

.field-group label {
  display: block;
  color: var(--primary-orange, #f48a1d);
  font-weight: bold;
  font-size: 0.95rem;
  margin-bottom: 0.6rem;
}

.field-group input,
.field-group select {
  width: 100%;
  padding: 12px;
  border: 1px solid var(--input-border, #f48a1d);
  border-radius: var(--border-radius, 8px);
  box-sizing: border-box;
  font-size: 1rem;
}

.field-group input:focus,
.field-group select:focus {
  outline: none;
  border-color: var(--primary-orange, #f48a1d);
  box-shadow: 0 0 0 3px rgba(244, 138, 29, 0.12);
}

.date-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  align-items: flex-start;
}

.date-row > div {
  min-width: 0;
}

.date-row input {
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="%23f48a1d" viewBox="0 0 16 16"><path d="M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z"/></svg>');
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 40px;
  appearance: none;
}

.btn-submit {
  width: 100%;
  background-color: var(--primary-orange, #f48a1d);
  color: #fff;
  border: none;
  padding: 15px;
  border-radius: var(--border-radius, 8px);
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  margin-top: 1rem;
  transition: opacity 0.2s;
}

.btn-submit:hover {
  opacity: 0.9;
}

</style>
