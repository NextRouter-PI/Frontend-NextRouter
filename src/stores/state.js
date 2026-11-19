import { reactive } from 'vue'

export const state = reactive({
  logged: false,
  initialized: false,
  user: null,
  role: null,
  profiles: {},
  profileRevision: 0,
  profileStale: false,
  loading: false,
  error: null,
  checkingAuth: false,
})
