import { reactive } from "vue";
import api from "@/api/api";

const state = reactive({
  logado: false,
  user: null,
  tipo: null,
  loading: false,
  error: null,
});

async function login(email, password, tipo) {
  state.loading = true;
  state.error = null;

  try {
    const response = await fetch(
      `${api.defaults.baseURL}/auth/login/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          tipo,
        }),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.detail ||
        data.error ||
        "Email ou senha inválidos"
      );
    }

    localStorage.setItem(
      "access_token",
      data.access
    );

    localStorage.setItem(
      "refresh_token",
      data.refresh
    );

    state.logado = true;
    state.user = data.user;
    state.tipo = data.tipo;
    console.log("Login bem-sucedido:", state.tipo);

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

async function checkAuth() {
  const token =
    localStorage.getItem("access_token");

  if (!token) {
    state.logado = false;
    return false;
  }

  try {
    const response = await fetch(
      `${api.defaults.baseURL}/user/me/`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok)
      throw new Error();

    const user = await response.json();

    state.logado = true;
    state.user = user;

    return true;
  } catch {
    logout();
    return false;
  }
}

function logout() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");

  state.logado = false;
  state.user = null;
}

export function useLoginState() {
  return {
    state,
    login,
    logout,
    checkAuth,
  };
}