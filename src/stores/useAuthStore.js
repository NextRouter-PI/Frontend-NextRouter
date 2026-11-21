import { computed, reactive, toRefs } from 'vue'
import { defineStore } from 'pinia'
import { http } from '@/api/client'
import { createAuthSession } from './session.js'

export const useAuthStore = defineStore('auth', () => {
  const authState = reactive({
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

  const session = createAuthSession({ state: authState, http })
  if (import.meta.hot) {
    import.meta.hot.dispose(() => session.dispose())
  }

  const identityKey = computed(() => `${authState.logged}:${authState.user?.id || ''}`)
  const roleIdentityKey = computed(
    () => `${authState.logged}:${authState.user?.id || ''}:${authState.role || ''}`,
  )

  // São snapshots de apresentação, nunca autorização nem um cache que dispense /me/.
  function invalidateProfileSnapshot(ownerId) {
    if (!authState.logged || authState.user?.id !== ownerId) return
    authState.profileRevision += 1
    authState.profileStale = true
  }

  function publishAccountSnapshot(ownerId, user) {
    if (!authState.logged || authState.user?.id !== ownerId || user.id !== ownerId) return false
    authState.user = { ...user }
    authState.profiles = Object.fromEntries(
      Object.entries(authState.profiles).map(([role, profile]) => [
        role,
        { ...profile, user_data: authState.user },
      ]),
    )
    authState.profileRevision += 1
    return true
  }

  function publishProfileSnapshot(ownerId, role, profile, revision) {
    if (
      !authState.logged ||
      authState.user?.id !== ownerId ||
      authState.role !== role ||
      profile.user_data?.id !== ownerId ||
      authState.profileRevision !== revision
    ) {
      return false
    }
    const user = { ...profile.user_data }
    authState.user = user
    authState.profiles = Object.fromEntries(
      Object.entries(authState.profiles).map(([key, value]) => [
        key,
        key === role ? { ...profile, user_data: user } : { ...value, user_data: user },
      ]),
    )
    authState.profileRevision += 1
    authState.profileStale = false
    return true
  }

  return {
    ...toRefs(authState),
    identityKey,
    roleIdentityKey,
    login: session.login,
    logout: session.logout,
    checkAuth: session.checkAuth,
    dispose: session.dispose,
    invalidateProfileSnapshot,
    publishAccountSnapshot,
    publishProfileSnapshot,
  }
})
