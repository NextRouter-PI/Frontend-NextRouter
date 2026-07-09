import { reactive } from 'vue'

const passengerData = {
  veiculo: {
    modelo: 'Toyota Corolla',
    placa: 'ABC-1D23',
    capacidade: 4,
    cor: 'Prata',
    ano: 2022,
  },
  motorista: {
    nome: 'Carlos Oliveira',
    email: 'carlos.oliveira@nextrouter.com',
    telefone: '(47) 99999-8888',
    avaliacao: 4.8,
  },
  rota: {
    ponto_origem: 'Centro - Joinville',
    ponto_destino: 'IFC - Araquari',
    horario_saida: '07:00',
    horario_chegada: '07:45',
  },
  passageirosAtuais: 3,
}

const driverData = {
  veiculo: {
    modelo: 'Toyota Corolla',
    placa: 'ABC-1D23',
    capacidade: 8,
    cor: 'Prata',
    ano: 2022,
    ativo: true,
    caracteristicas: ['Ar-condicionado', 'Vidro elétrico', 'Travas elétricas', 'Som Bluetooth'],
  },
  rota: {
    ponto_origem: 'Centro - Joinville',
    ponto_destino: 'IFC - Araquari',
    horario_saida: '07:00',
    horario_chegada: '07:45',
  },
  passageiros: [
    { nome: 'Ana Beatriz', embarque: 'Centro', desembarque: 'IFC' },
    { nome: 'João Pedro', embarque: 'América', desembarque: 'IFC' },
    { nome: 'Mariana Costa', embarque: 'Bucarein', desembarque: 'IFC' },
    { nome: 'Lucas Mendes', embarque: 'Glória', desembarque: 'IFC' },
    { nome: 'Fernanda Lima', embarque: 'Centro', desembarque: 'IFC' },
    { nome: 'Rafael Souza', embarque: 'Bom Retiro', desembarque: 'IFC' },
    { nome: 'Juliana Rocha', embarque: 'América', desembarque: 'IFC' },
    { nome: 'Thiago Martins', embarque: 'Bucarein', desembarque: 'IFC' },
  ],
  passageirosAtuais: 8,
}

const state = reactive({
  passenger: null,
  driver: null,
  loading: false,
})

function loadPassengerData() {
  state.loading = true
  setTimeout(() => {
    state.passenger = { ...passengerData }
    state.loading = false
  }, 600)
}

function loadDriverData() {
  state.loading = true
  setTimeout(() => {
    state.driver = { ...driverData }
    state.loading = false
  }, 600)
}

export function useTransportState() {
  return {
    state,
    loadPassengerData,
    loadDriverData,
  }
}
