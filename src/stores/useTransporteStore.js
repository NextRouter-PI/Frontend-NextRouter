import { defineStore } from 'pinia';

export const useTransporteStore = defineStore('transporte', {
    state: () => ({
        veiculos: [
            {id: 1, placa: 'QHN6712', modelo: 'Mercedes Sprinter', capacidade: 18, motorista: 'Roberto Carlos', status: 'Ativo'},
            {id: 2, placa: 'QHN6713', modelo: 'Mercedes Sprinter', capacidade: 18, motorista: 'Roberto Carlos', status: 'Manutenção'},
            {id: 3, placa: 'QHN6714', modelo: 'Mercedes Sprinter', capacidade: 18, motorista: 'Roberto Carlos', status: 'Ativo'},
            {id: 4, placa: 'QNH6715', modelo: 'Mercedes Sprinter', capacidade: 18, motorista: 'Roberto Carlos', status: 'Ativo'}
        ]
    }),
    actions: {
        adicionarVeiculo(novoVeiculo) {
            this.veiculos.unshift({
                id: Date.now(),
                status: 'Ativo',
                motorista: 'Não Atribuído',
                ...novoVeiculo
            });
        },
        alterarStatus(id) {
            const veiculo = this.veiculos.find(v => v.id === id);
            if (!veiculo) return;
            veiculo.status =
                veiculo.status === 'Ativo'
                    ? 'Manutenção'
                    : 'Ativo';
        },
        atualizarVeiculo(id, dados) {
            const index = this.veiculos.findIndex(v => v.id == id)
            if (index !== -1) {
                this.veiculos[index] = {
                    ...this.veiculos[index],
                    ...dados
                }
            }
        }
    }
});
