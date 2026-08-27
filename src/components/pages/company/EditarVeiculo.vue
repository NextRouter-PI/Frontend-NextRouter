<script setup>
import { ref, onMounted } from 'vue'
import { useTransporteStore } from '@/stores/useTransporteStore'
import { useRouter, useRoute } from 'vue-router'
import api from '@/api/client'

const router = useRouter()
const route = useRoute()
const stores = useTransporteStore()

const id = route.params.id
const erro = ref('')
const carregando = ref(true)
const salvando = ref(false)

const veiculo = ref({
    placa: '',
    modelo: '',
    ano: '',
    capacidade: '',
    routeGroup: '',
    driver: '',
    cor: '',
    garageCep: '',
    status: 'Ativo',
})

const featureInput = ref('')
const caracteristicas = ref([])

const routeGroups = ref([])
const drivers = ref([])

function adicionarFeature() {
    const value = featureInput.value.trim()
    if (value && !caracteristicas.value.includes(value)) {
        caracteristicas.value.push(value)
    }
    featureInput.value = ''
}

function removerFeature(feature) {
    caracteristicas.value = caracteristicas.value.filter((f) => f !== feature)
}

onMounted(async () => {
    let encontrado = stores.veiculos.find(v => v.id == id)

    if (!encontrado) {
        await stores.fetchVeiculos()
        encontrado = stores.veiculos.find(v => v.id == id)
    }

    try {
        const { data: company } = await api.get('/companies/me/')
        const [routeGroupsRes, driversRes] = await Promise.all([
            api.get('/company-route-groups/', { params: { company: company.id } }),
            api.get('/drivers/').catch(() => ({ data: [] })),
        ])
        routeGroups.value = Array.isArray(routeGroupsRes.data) ? routeGroupsRes.data : routeGroupsRes.data.results || []
        drivers.value = Array.isArray(driversRes.data) ? driversRes.data : driversRes.data.results || []
    } catch {
        // grupos de rota / motoristas não puderam ser carregados, mantém os campos já existentes
    }

    if (encontrado) {
        veiculo.value = {
            placa: encontrado.placa,
            modelo: encontrado.modelo,
            ano: encontrado.ano,
            capacidade: encontrado.capacidade,
            routeGroup: encontrado.routeGroup,
            driver: encontrado.driver || '',
            cor: encontrado.cor || '',
            garageCep: encontrado.garageCep || '',
            status: encontrado.status,
        }
        caracteristicas.value = [...(encontrado.caracteristicas || [])]
    } else {
        erro.value = 'Veículo não encontrado.'
    }

    carregando.value = false
})

const salvar = async () => {
    erro.value = ''
    salvando.value = true
    const sucesso = await stores.atualizarVeiculo(Number(id), {
        ...veiculo.value,
        driver: veiculo.value.driver || null,
        caracteristicas: caracteristicas.value,
    })
    salvando.value = false

    if (sucesso) {
        router.push('/transporte')
    } else {
        erro.value = typeof stores.error === 'string' ? stores.error : 'Erro ao salvar alterações.'
    }
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
            <div class="form-group">
                <label>Cor</label>
                <input v-model="veiculo.cor" placeholder="Branco" />
            </div>
            <div class="form-group">
                <label>CEP da Garagem</label>
                <input v-model="veiculo.garageCep" placeholder="00000-000" maxlength="9" />
            </div>
            <div class="form-group">
                <label>Status</label>
                <select v-model="veiculo.status">
                    <option value="Ativo">Ativo</option>
                    <option value="Manutenção">Manutenção</option>
                </select>
            </div>
            <div class="form-group">
                <label>Motorista</label>
                <select v-model="veiculo.driver">
                    <option value="">Nenhum</option>
                    <option v-for="motorista in drivers" :key="motorista.id" :value="motorista.id">
                        {{ motorista.user_data?.name || `Motorista #${motorista.id}` }}
                    </option>
                </select>
            </div>
            <div class="form-group">
                <label>Grupo de Rota<span>*</span></label>
                <select v-model="veiculo.routeGroup" required>
                    <option value="" disabled>Selecione um grupo de rota</option>
                    <option v-for="grupo in routeGroups" :key="grupo.id" :value="grupo.id">{{ grupo.name }}</option>
                </select>
            </div>
            <div class="form-group">
                <label>Características</label>
                <div class="feature-input-row">
                    <input
                        v-model="featureInput"
                        placeholder="Ex.: Ar-condicionado"
                        @keydown.enter.prevent="adicionarFeature"
                    />
                    <button type="button" class="btn-add-feature" @click="adicionarFeature">Adicionar</button>
                </div>
                <div v-if="caracteristicas.length" class="feature-chips">
                    <span v-for="feature in caracteristicas" :key="feature" class="feature-chip">
                        {{ feature }}
                        <button type="button" @click="removerFeature(feature)">
                            <span class="mdi mdi-close"></span>
                        </button>
                    </span>
                </div>
            </div>

            <p v-if="erro" class="erro">{{ erro }}</p>

            <button class="btn-salvar" type="submit" :disabled="salvando || carregando">{{ salvando ? 'Salvando...' : 'SALVAR ALTERAÇÕES' }}</button>
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

.form-group select {
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

.form-group select:focus {
    border-color: var(--primary);
}

.feature-input-row {
    display: flex;
    gap: 10px;
}

.feature-input-row input {
    flex: 1;
    height: 48px;
    padding: 0 12px;
    border: 2px solid var(--border);
    border-radius: 12px;
    font-size: 15px;
    color: var(--text);
    outline: none;
    box-sizing: border-box;
    background: var(--bg);
}

.btn-add-feature {
    height: 48px;
    padding: 0 16px;
    border: none;
    border-radius: 12px;
    background: var(--gradient-primary);
    color: white;
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;
}

.feature-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 12px;
}

.feature-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border-radius: 999px;
    background: rgba(223, 128, 26, 0.1);
    color: var(--primary);
    font-size: 0.85rem;
    font-weight: 600;
}

.feature-chip button {
    display: flex;
    align-items: center;
    background: none;
    border: none;
    color: var(--primary);
    cursor: pointer;
    padding: 0;
    font-size: 14px;
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
</style>
