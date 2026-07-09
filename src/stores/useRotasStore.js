import { defineStore } from 'pinia';

export const useRotasStore = defineStore('rotas', {
    state: () => ({
        rotas: [
            {id: 1, origem: 'IFC-Araquari', destino: 'Morro do Meio', horario: '12h', van: 'QHN1221', motorista: 'Roberto Carlos'},
            {id: 2, origem: 'IFC-Araquari', destino: 'Morro do Meio', horario: '17h', van: 'QHN1221', motorista: 'Roberto Carlos'},
            {id: 3, origem: 'IFC-Araquari', destino: 'Morro do Meio', horario: '12h', van: 'QHN1221', motorista: 'Roberto Carlos'},
            {id: 4, origem: 'IFC-Araquari', destino: 'Morro do Meio', horario: '17h', van: 'QHN1221', motorista: 'Roberto Carlos'}
        ]
    })
});
