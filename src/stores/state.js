import { reactive } from 'vue'

export const state = reactive({
  logged: false,
  initialized: false,
  user: null,
  role: null,
  profiles: {},
  loading: false,
  error: null,
  checkingAuth: false,
})
