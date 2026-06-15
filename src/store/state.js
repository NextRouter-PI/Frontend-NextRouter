// @/store/state.js
import { reactive } from 'vue'

export const state = reactive({
  logged: false,
  user: null,
  access: null,
  loading: false,
  error: null,
  checkingAuth: false,
})
