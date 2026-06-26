// @/store/state.js
import { reactive } from 'vue'

const savedAccess = localStorage.getItem('access')
const savedUser = localStorage.getItem('user')

export const state = reactive({
  logged: false,
  user: savedUser ? JSON.parse(savedUser) : null,
  access: savedAccess || null,
  loading: false,
  error: null,
  checkingAuth: false,
})
