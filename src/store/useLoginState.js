// src/store/useLoginState.js
import { reactive } from "vue";
import { useRouter } from "vue-router";

const API_URL = "http://127.0.0.1:8000/api";

const state = reactive({
  logado: false,
  user: null,
  loading: false,
  error: null,
});

/* =========================
   LOGIN BACKEND
========================= */
async function login(email, password) {
  state.loading = true;
  state.error = null;

  try {
    const response = await fetch(
      `${API_URL}/auth/login/`,
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      }
    );

    const data =
      await response.json();

    if (!response.ok) {
      throw new Error(
        data.detail ||
          data.error ||
          "Email ou senha inválidos."
      );
    }

    // salva token
    localStorage.setItem(
      "access_token",
      data.access
    );

    localStorage.setItem(
      "refresh_token",
      data.refresh
    );

    // salva usuário
    state.logado = true;
    state.user =
      data.user || null;

    return true;
  } catch (error) {
    state.logado = false;
    state.user = null;
    state.error =
      error.message;

    return false;
  } finally {
    state.loading = false;
  }
}

/* =========================
   VERIFICAR LOGIN
========================= */
async function checkAuth() {
  const token =
    localStorage.getItem(
      "access_token"
    );

  if (!token) {
    state.logado = false;
    return false;
  }

  try {
    const response = await fetch(
      `${API_URL}/user/me/`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok)
      throw new Error();

    const user =
      await response.json();

    state.logado = true;
    state.user = user;

    return true;
  } catch {
    state.logado = false;
    state.user = null;

    localStorage.removeItem(
      "access_token"
    );

    localStorage.removeItem(
      "refresh_token"
    );

    return false;
  }
}

/* =========================
   LOGOUT
========================= */
function logout() {
  localStorage.removeItem(
    "access_token"
  );

  localStorage.removeItem(
    "refresh_token"
  );

  state.logado = false;
  state.user = null;
}

/* =========================
   EXPORT
========================= */
export function useLoginState() {
  return {
    state,
    login,
    logout,
    checkAuth,
  };
}