import { reactive } from "vue";
import { login as apiLogin } from "@/api/auth";

const state = reactive({
  logado: false,
  user: null,
  loading: false,
  error: null,
});

async function login(email, password) {
  state.loading = true;
  state.error = null;

  try {
    const userData = await apiLogin(email, password);
    state.logado = true;
    state.user = userData;
    return true;
  } catch (error) {
    state.logado = false;
    state.user = null;
    state.error = error.message;
    return false;
  } finally {
    state.loading = false;
  }
}

function logout() {
  state.logado = false;
  state.user = null;
  state.error = null;
}

export function useLoginState() {
  return {
    state,
    login,
    logout,
  };
}
