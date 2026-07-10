<script setup>
import { ref, onMounted } from 'vue'
import { useTransporteStore } from '@/stores/useTransporteStore'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()
const stores = useTransporteStore()

const id = route.params.id

const veiculo = ref({
    placa: '',
    modelo: '',
    ano: '',
    capacidade: ''
})

onMounted(() => {
    const encontrado = stores.veiculos.find(v => v.id == id)
    if (encontrado) {
        veiculo.value = {
            placa: encontrado.placa,
            modelo: encontrado.modelo,
            ano: encontrado.ano,
            capacidade: encontrado.capacidade
        }
    }
})

const salvar = () => {
    stores.atualizarVeiculo(Number(id), { ...veiculo.value })
    router.push('/transporte')
}
</script>

<template>
    <div class="content">
        <div class="top-bar">
            <button class="back-button" @click="$router.back()">
                <span class="mdi mdi-arrow-left"></span>
            </button>
            <h1>Editar Veículo</h1>
        </div>

        <form @submit.prevent="salvar" class="editar-form">
            <div class="form-group">
                <label>Placa<span>*</span></label>
                <input v-model="veiculo.placa" required />
            </div>
            <div class="form-group">
                <label>Modelo<span>*</span></label>
                <input v-model="veiculo.modelo" required />
            </div>
            <div class="form-group">
                <label>Ano<span>*</span></label>
                <input v-model="veiculo.ano" required />
            </div>
            <div class="form-group">
                <label>Capacidade<span>*</span></label>
                <input v-model="veiculo.capacidade" required />
            </div>

            <button class="btn-salvar" type="submit">SALVAR ALTERAÇÕES</button>
            <button class="btn-cancelar" type="button" @click="$router.back()">CANCELAR</button>
        </form>
    </div>
</template>

<style scoped>
.content {
    padding: 18px 18px 120px;
    max-width: 600px;
    margin: 0 auto;
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
