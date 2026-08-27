<script setup>
import { ref } from 'vue';
import { useRotasStore } from '@/stores/useRotasStore';
import { useRouter } from 'vue-router';

const router = useRouter();
const store = useRotasStore();

const rota = ref({
    name: '',
    commonCep: '',
    goHour: '',
    returnHour: '',
});

const erro = ref('');
const salvando = ref(false);

const salvar = async () => {
    erro.value = '';

    if (!rota.value.name || !rota.value.commonCep) {
        erro.value = 'Preencha o nome da rota e o CEP em comum.';
        return;
    }

    salvando.value = true;

    const grupo = await store.criarRota({ name: rota.value.name, commonCep: rota.value.commonCep });

    if (!grupo) {
        salvando.value = false;
        erro.value = typeof store.error === 'string' ? store.error : (store.error?.detail || 'Erro ao cadastrar rota.');
        return;
    }

    if (rota.value.goHour && rota.value.returnHour) {
        const horario = await store.criarHorario(grupo.id, {
            goHour: rota.value.goHour,
            returnHour: rota.value.returnHour,
        });

        if (!horario) {
            salvando.value = false;
            erro.value = typeof store.error === 'string' ? store.error : (store.error?.detail || 'Rota criada, mas houve um erro ao cadastrar o horário. Edite a rota para adicioná-lo.');
            return;
        }
    }

    salvando.value = false;
    router.push('/lista');
}
</script>

<template>
    <div class="content">
        <div class="top-bar">
            <button class="back-button" @click="$router.back()">
                <span class="mdi mdi-arrow-left"></span>
            </button>
            <h1>Cadastrar Rota</h1>
        </div>

        <form @submit.prevent="salvar" class="cadastro">
            <div class="form-group">
                <label>Nome da Rota<span>*</span></label>
                <input v-model="rota.name" placeholder="Rota Centro" required />
            </div>
            <div class="form-group">
                <label>CEP em comum<span>*</span></label>
                <input v-model="rota.commonCep" placeholder="00000-000" required />
            </div>
            <div class="form-group">
                <label>Horário de ida</label>
                <input v-model="rota.goHour" type="time" placeholder="07:00" />
            </div>
            <div class="form-group">
                <label>Horário de volta</label>
                <input v-model="rota.returnHour" type="time" placeholder="17:00" />
            </div>
            <p class="hint">Você pode adicionar mais horários depois, na edição da rota.</p>

            <p v-if="erro" class="erro">{{ erro }}</p>

            <button class="btn-salvar" type="submit" :disabled="salvando">{{ salvando ? 'Salvando...' : 'SALVAR' }}</button>
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

.hint {
    font-size: 13px;
    color: var(--text-muted);
    margin-top: -12px;
    margin-bottom: 16px;
}

.erro {
    color: #d32f2f;
    font-size: 13px;
    margin-top: -12px;
    margin-bottom: 16px;
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
