<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const form = ref({
  nomeCompleto: '',
  cpf: '',
  email: ''
});

const arquivoCNH = ref('Nenhum arquivo selecionado');

const handleFileChange = (event) => {
  const file = event.target.files && event.target.files[0];
  arquivoCNH.value = file ? file.name : 'Nenhum arquivo selecionado';
};

const handleSubmit = () => {
  const cadastro = {
    nomeCompleto: form.value.nomeCompleto.trim(),
    cpf: form.value.cpf.trim(),
    email: form.value.email.trim(),
    arquivoCNH: arquivoCNH.value
  };

  console.log('Cadastro de motorista:', cadastro);

  // Redirecionar para a página de confirmação com o email
  router.push({
    path: '/signup/confirmacao',
    query: { email: cadastro.email }
  });
};
</script>

<template>
  <section class="form-container">
    <h2 class="title">Insira as seguintes informações para prosseguir</h2>
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

      <div class="field-group file-group">
        <label>Arquivo CNH</label>
        <div class="file-upload">
          <label class="file-button" for="cnhFile">Escolher arquivo</label>
          <span class="file-name">{{ arquivoCNH }}</span>
          <input
            id="cnhFile"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            @change="handleFileChange"
          />
        </div>
      </div>

      <button type="submit" class="btn-submit">Enviar cadastro</button>
    </form>
  </section>
</template>

<style scoped>
.form-container {
  width: 100%;
  max-width: 520px;
  margin: 5rem auto;
  padding: 1.5rem;
  background: var(--bg-white, #ffffff);
  border-radius: 16px;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.08);
}

.title {
  margin-bottom: 0.75rem;
  font-size: 1.75rem;
  font-weight: 800;
  text-align: center;
  color: var(--text-black, #000000);
}

.signup-form {
  display: grid;
  gap: 1rem;
}

.field-group {
  display: flex;
  flex-direction: column;
}

.field-group label {
  display: block;
  color: white;
  font-weight: bold;
  font-size: 0.95rem;
  margin-bottom: 0.5rem;
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

.file-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.file-upload {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 12px;
  border: 1px solid var(--input-border, #f48a1d);
  border-radius: var(--border-radius, 8px);
  background: #fff;
}

.file-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 12px 16px;
  background: var(--primary-orange, #f48a1d);
  color: #fff;
  border-radius: 8px;
  font-weight: 700;
  cursor: pointer;
  text-align: center;
}

.file-name {
  color: #333;
  font-size: 0.95rem;
  width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
}

.file-upload input[type="file"] {
  display: none;
}

.field-group input:focus,
.field-group select:focus {
  outline: none;
  border-color: var(--primary-orange, #f48a1d);
  box-shadow: 0 0 0 3px rgba(244, 138, 29, 0.12);
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

@media (min-width: 640px) {
  .form-container {
    margin: 3rem auto;
    padding: 2rem;
  }

  .title {
    font-size: 2rem;
  }

  .file-upload {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }

  .file-button {
    width: auto;
    padding: 10px 16px;
  }

  .file-name {
    flex: 1;
  }
}
</style>
