import { reactive } from "vue";

const state = reactive({
  logado: false,
  user: null,
  tipoUsuario: null, // "passageiro" ou "motorista"

  _credentials: {
    passageiro: {
      email: "admin@email.com",
      senha: "123456",
      tipoUsuario: "passageiro"
    },
    motorista: {
      email: "motorista@gmail.com",
      senha: "123456",
      tipoUsuario: "motorista"
    }
  }
});

function login(email, senha) {
  // Verifica se é o passageiro
  if (
    email === state._credentials.passageiro.email &&
    senha === state._credentials.passageiro.senha
  ) {
    state.logado = true;
    state.user = { email };
    state.tipoUsuario = state._credentials.passageiro.tipoUsuario;
    return true;
  }

  // Verifica se é o motorista
  if (
    email === state._credentials.motorista.email &&
    senha === state._credentials.motorista.senha
  ) {
    state.logado = true;
    state.user = { email };
    state.tipoUsuario = state._credentials.motorista.tipoUsuario;
    return true;
  }

  state.logado = false;
  state.user = null;
  state.tipoUsuario = null;
  return false;
}

function logout() {
  state.logado = false;
  state.user = null;
  state.tipoUsuario = null;
}

function updatePassword(email, novaSenha) {
  // Verifica se o email é do passageiro
  if (email === state._credentials.passageiro.email) {
    state._credentials.passageiro.senha = novaSenha;
    return true;
  }

  // Verifica se o email é do motorista
  if (email === state._credentials.motorista.email) {
    state._credentials.motorista.senha = novaSenha;
    return true;
  }

  return false;
}

export function useLoginState() {
  return {
    state,
    login,
    logout,
    updatePassword
  };
}
