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
  state.tipoUsuario = null;
}

/* =========================
   EXPORT
export function useLoginState() {
  return {
    state,
    login,
    logout,
    checkAuth,
  };
}