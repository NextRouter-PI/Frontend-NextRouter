import { reactive } from 'vue';
import api from '@/api/api';

export const useRegisterState = () => {
  const state = reactive({
    loading: false,
    error: null,
    success: false,
    user: null,
    accessToken: null,
    refreshToken: null,
  });

  const resetState = () => {
    state.loading = false;
    state.error = null;
    state.success = false;
    state.user = null;
    state.accessToken = null;
    state.refreshToken = null;
  };

  const clearError = () => {
    state.error = null;
  };

  const registerPassenger = async (userData) => {
    state.loading = true;
    state.error = null;
    state.success = false;

    try {
      const response = await api.post('/auth/register/passageiro/', userData);

      if (response.data && response.data.access) {
        state.accessToken = response.data.access;
        state.refreshToken = response.data.refresh;
        state.user = response.data.user;
        state.success = true;

        localStorage.setItem('access_token', response.data.access);
        localStorage.setItem('refresh_token', response.data.refresh);
        localStorage.setItem('user', JSON.stringify(response.data.user));

        return true;
      }
      return false;
    } catch (error) {
      console.error('Erro no registro:', error);
      
      if (error.response?.data) {
        const errorData = error.response.data;
        if (typeof errorData === 'object') {
          const firstKey = Object.keys(errorData)[0];
          if (firstKey && errorData[firstKey]) {
            state.error = Array.isArray(errorData[firstKey]) 
              ? errorData[firstKey][0] 
              : errorData[firstKey];
          } else {
            state.error = 'Erro ao criar conta. Verifique os dados.';
          }
        } else {
          state.error = errorData;
        }
      } else if (error.request) {
        state.error = 'Erro de conexão. Verifique sua internet.';
      } else {
        state.error = 'Erro inesperado. Tente novamente.';
      }
      
      return false;
    } finally {
      state.loading = false;
    }
  };

  const registerDriver = async (userData) => {
    state.loading = true;
    state.error = null;
    state.success = false;

    try {
      const response = await api.post('/auth/register/motorista/', userData);

      if (response.data && response.data.access) {
        state.accessToken = response.data.access;
        state.refreshToken = response.data.refresh;
        state.user = response.data.user;
        state.success = true;

        localStorage.setItem('access_token', response.data.access);
        localStorage.setItem('refresh_token', response.data.refresh);
        localStorage.setItem('user', JSON.stringify(response.data.user));

        return true;
      }
      return false;
    } catch (error) {
      console.error('Erro no registro:', error);
      
      if (error.response?.data) {
        const errorData = error.response.data;
        if (typeof errorData === 'object') {
          const firstKey = Object.keys(errorData)[0];
          if (firstKey && errorData[firstKey]) {
            state.error = Array.isArray(errorData[firstKey]) 
              ? errorData[firstKey][0] 
              : errorData[firstKey];
          } else {
            state.error = 'Erro ao criar conta de motorista.';
          }
        } else {
          state.error = errorData;
        }
      } else if (error.request) {
        state.error = 'Erro de conexão. Verifique sua internet.';
      } else {
        state.error = 'Erro inesperado. Tente novamente.';
      }
      
      return false;
    } finally {
      state.loading = false;
    }
  };

  const isMotorista = () => {
    return state.user?.tipo === 'motorista';
  };

  const isPassageiro = () => {
    return state.user?.tipo === 'passageiro';
  };

  const isAprovado = () => {
    if (isMotorista() && state.user?.aprovado !== undefined) {
      return state.user.aprovado;
    }
    return true;
  };

  const getStatusMessage = () => {
    if (isMotorista() && !isAprovado()) {
      return 'Sua conta de motorista está aguardando aprovação. Você será notificado quando for aprovado.';
    }
    return null;
  };

  return {
    state,
    resetState,
    clearError,
    registerPassenger,
    registerDriver,
    isMotorista,
    isPassageiro,
    isAprovado,
    getStatusMessage,
  };
};