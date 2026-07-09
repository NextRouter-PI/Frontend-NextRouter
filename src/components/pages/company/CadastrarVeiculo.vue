<script setup>
import { ref } from 'vue';
import { useTransporteStore } from '@/stores/useTransporteStore';
import { useRouter } from 'vue-router'

const router = useRouter();
const stores = useTransporteStore();

const veiculo = ref({
    placa: '',
    modelo: '',
    ano: '',
    capacidade: ''
});

const salvar = () => {
    stores.adicionarVeiculo({ ...veiculo.value });
    router.push('/transporte')
}
</script>

<template>
    <div class="content">
        <div class="top-bar">
            <button class="back-button" @click="$router.back()">
                <span class="mdi mdi-arrow-left"></span>
            </button>
            <h1>Cadastrar Veículo</h1>
        </div>

        <form @submit.prevent="salvar" class="cadastro">
            <div class="form-group">
                <label>Placa<span>*</span></label>
                <input v-model="veiculo.placa" placeholder="ABC 1234" required />
            </div>
            <div class="form-group">
                <label>Modelo<span>*</span></label>
                <input v-model="veiculo.modelo" placeholder="Mercedes Sprinter" required />
            </div>
            <div class="form-group">
                <label>Ano<span>*</span></label>
                <input v-model="veiculo.ano" placeholder="2015" required />
            </div>
            <div class="form-group">
                <label>Capacidade<span>*</span></label>
                <input v-model="veiculo.capacidade" placeholder="Número de lugares" required />
            </div>

            <button class="btn-salvar" type="submit">SALVAR</button>
            <button class="btn-cancelar" type="button" @click="$router.back()">CANCELAR</button>
        </form>
    </div>
</template>

<style scoped>
.content {
    margin: 0 auto;
    max-width: 600px;
    padding: 18px 18px 120px;
}

.top-bar {
    display: flex;
    align-items: center;
    margin-bottom: 30px;
}

.top-bar .mdi {
    font-size: 28px;
    color: var(--text);
}

.top-bar h1 {
    font-weight: 700;
    font-size: 28px;
    margin-left: 20px;
}

.form-group {
    margin-bottom: 26px;
}

.form-group label {
    display: block;
    font-size: 20px;
    font-weight: 500;
    color: var(--text);
    margin-bottom: 10px;
}

.form-group span {
    color: var(--primary);
    margin-left: 2px;
}

.form-group input {
    width: 100%;
    height: 48px;
    padding: 0 12px;
    border: 2px solid var(--border);
    border-radius: 12px;
    font-size: 15px;
    color: var(--text);
    outline: none;
    box-sizing: border-box;
    background: var(--bg);
    transition: border-color 0.2s;
}

.form-group input:focus {
    border-color: var(--primary);
}

.form-group input::placeholder {
    color: var(--text-muted);
}

.btn-salvar {
    width: 100%;
    height: 48px;
    margin-top: 30px;
    background: var(--gradient-primary);
    color: white;
    border: none;
    border-radius: 12px;
    font-size: 15px;
    font-weight: 700;
    cursor: pointer;
    transition: opacity 0.2s;
}

.btn-salvar:hover {
    opacity: 0.9;
}

.btn-cancelar {
    width: 100%;
    height: 48px;
    margin-top: 16px;
    background: transparent;
    color: var(--primary);
    border: 2px solid var(--primary);
    border-radius: 12px;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.2s;
}

.btn-cancelar:hover {
    opacity: 0.8;
}

.btn-salvar:active,
.btn-cancelar:active {
    transform: scale(.98);
}
</style>
