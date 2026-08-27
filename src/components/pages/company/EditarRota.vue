<script setup>
import { ref, onMounted } from 'vue'
import { useRotasStore } from '@/stores/useRotasStore'
import { useRouter, useRoute } from 'vue-router'
import api from '@/api/client'

const router = useRouter()
const route = useRoute()
const store = useRotasStore()

const id = Number(route.params.id)
const erro = ref('')
const carregando = ref(true)
const salvando = ref(false)

const rota = ref({
    name: '',
    commonCep: '',
})

const horarios = ref([])
const novoHorario = ref({ goHour: '', returnHour: '' })
const salvandoHorario = ref(false)
const erroHorario = ref('')

async function carregarHorarios() {
    const { data } = await api.get('/route-schedules/', { params: { route_group: id } })
    const lista = Array.isArray(data) ? data : data.results || []
    horarios.value = lista.map((h) => ({ id: h.id, goHour: h.go_hour, returnHour: h.return_hour }))
}

onMounted(async () => {
    try {
        const { data: company } = await api.get('/companies/me/')
        const { data } = await api.get('/company-route-groups/', { params: { company: company.id } })
        const grupos = Array.isArray(data) ? data : data.results || []
        const encontrado = grupos.find((g) => g.id === id)

        if (encontrado) {
            rota.value = { name: encontrado.name, commonCep: encontrado.common_cep }
            await carregarHorarios()
        } else {
            erro.value = 'Rota não encontrada.'
        }
    } catch (error) {
        erro.value = 'Não foi possível carregar a rota.'
    } finally {
        carregando.value = false
    }
})

const salvar = async () => {
    erro.value = ''
    salvando.value = true
    const atualizado = await store.atualizarRota(id, { name: rota.value.name, commonCep: rota.value.commonCep })
    salvando.value = false

    if (atualizado) {
        router.push('/lista')
    } else {
        erro.value = typeof store.error === 'string' ? store.error : (store.error?.detail || 'Erro ao salvar alterações.')
    }
}

const adicionarHorario = async () => {
    erroHorario.value = ''
    if (!novoHorario.value.goHour || !novoHorario.value.returnHour) {
        erroHorario.value = 'Informe os dois horários.'
        return
    }

    salvandoHorario.value = true
    const criado = await store.criarHorario(id, novoHorario.value)
    salvandoHorario.value = false

    if (criado) {
        novoHorario.value = { goHour: '', returnHour: '' }
        await carregarHorarios()
    } else {
        erroHorario.value = typeof store.error === 'string' ? store.error : (store.error?.return_hour?.[0] || store.error?.detail || 'Erro ao cadastrar horário.')
    }
}

const removerHorario = async (horarioId) => {
    const sucesso = await store.removerHorario(horarioId)
    if (sucesso) {
        horarios.value = horarios.value.filter((h) => h.id !== horarioId)
    } else {
        erroHorario.value = 'Erro ao remover horário.'
    }
}
</script>

<template>
    <div class="content">
        <div class="top-bar">
            <button class="back-button" @click="$router.back()">
                <span class="mdi mdi-arrow-left"></span>
            </button>
            <h1>Editar Rota</h1>
        </div>

        <form @submit.prevent="salvar" class="editar-form">
            <div class="form-group">
                <label>Nome da Rota<span>*</span></label>
                <input v-model="rota.name" required />
            </div>
            <div class="form-group">
                <label>CEP em comum<span>*</span></label>
                <input v-model="rota.commonCep" required />
            </div>

            <p v-if="erro" class="erro">{{ erro }}</p>

            <button class="btn-salvar" type="submit" :disabled="salvando || carregando">{{ salvando ? 'Salvando...' : 'SALVAR ALTERAÇÕES' }}</button>
            <button class="btn-cancelar" type="button" @click="$router.back()">CANCELAR</button>
        </form>

        <div class="horarios-section" v-if="!carregando">
            <h2>Horários da Rota</h2>

            <p v-if="!horarios.length" class="status-message">Nenhum horário cadastrado.</p>

            <div v-for="horario in horarios" :key="horario.id" class="horario-item">
                <span class="mdi mdi-clock-outline"></span>
                <span>Ida {{ horario.goHour?.slice(0, 5) }} - Volta {{ horario.returnHour?.slice(0, 5) }}</span>
                <button class="btn-remover" type="button" @click="removerHorario(horario.id)">
                    <span class="mdi mdi-trash-can-outline"></span>
                </button>
            </div>

            <div class="novo-horario">
                <div class="form-group">
                    <label>Novo horário de ida</label>
                    <input v-model="novoHorario.goHour" type="time" />
                </div>
                <div class="form-group">
                    <label>Novo horário de volta</label>
                    <input v-model="novoHorario.returnHour" type="time" />
                </div>

                <p v-if="erroHorario" class="erro">{{ erroHorario }}</p>

                <button class="btn-adicionar" type="button" :disabled="salvandoHorario" @click="adicionarHorario">
                    {{ salvandoHorario ? 'Adicionando...' : '+ Adicionar Horário' }}
                </button>
            </div>
        </div>
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

.erro {
    color: #d32f2f;
    font-size: 13px;
    margin-top: -12px;
    margin-bottom: 16px;
}

.horarios-section {
    margin-top: 40px;
    padding-top: 24px;
    border-top: 1px solid var(--border);
}

.horarios-section h2 {
    font-size: 20px;
    font-weight: 700;
    color: var(--text);
    margin-bottom: 16px;
}

.status-message {
    text-align: center;
    color: var(--text-muted);
    padding: 12px 0;
}

.horario-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 14px;
    border: 1px solid var(--border);
    border-radius: 12px;
    background: var(--superfice);
    margin-bottom: 10px;
    color: var(--text);
}

.horario-item .mdi-clock-outline {
    color: var(--primary);
    font-size: 20px;
}

.horario-item span:nth-child(2) {
    flex: 1;
}

.btn-remover {
    background: none;
    border: none;
    color: var(--danger);
    font-size: 20px;
    cursor: pointer;
}

.novo-horario {
    margin-top: 20px;
    padding: 16px;
    border: 1px dashed var(--border);
    border-radius: 12px;
}

.btn-adicionar {
    width: 100%;
    height: 44px;
    background: transparent;
    color: var(--primary);
    border: 2px solid var(--primary);
    border-radius: 12px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
}

.btn-adicionar:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}
</style>
