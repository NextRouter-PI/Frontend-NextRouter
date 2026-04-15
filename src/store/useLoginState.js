import { reactive } from "vue";

const state = reactive({
  logado: false,
  user: null,
  tipoUsuario: null, // "passageiro" ou "motorista"

  _credentials: {
    email: "admin@email.com",
    senha: "123456",
    tipoUsuario: "passageiro" // para testes
  }
});

function login(email, senha) {
  if (
    email === state._credentials.email &&
    senha === state._credentials.senha
  ) {
    state.logado = true;
    state.user = { email };
    state.tipoUsuario = state._credentials.tipoUsuario;
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
  // Verifica se o email está registrado
  if (email === state._credentials.email) {
    state._credentials.senha = novaSenha;
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
