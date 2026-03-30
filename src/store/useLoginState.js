import { reactive } from "vue";

const state = reactive({
  logado: false,
  user: null,

  _credentials: {
    email: "admin@email.com",
    senha: "123456"
  }
});

function login(email, senha) {
  if (
    email === state._credentials.email &&
    senha === state._credentials.senha
  ) {
    state.logado = true;
    state.user = { email };
    return true;
  }

  state.logado = false;
  state.user = null;
  return false;
}

function logout() {
  state.logado = false;
  state.user = null;
}

export function useLoginState() {
  return {
    state,
    login,
    logout
  };
}