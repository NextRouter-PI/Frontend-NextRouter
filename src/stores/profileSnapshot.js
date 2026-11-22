import { useAuthStore } from './useAuthStore.js'

export function invalidateProfileSnapshot(ownerId) {
  return useAuthStore().invalidateProfileSnapshot(ownerId)
}

export function publishAccountSnapshot(ownerId, user) {
  return useAuthStore().publishAccountSnapshot(ownerId, user)
}

export function publishProfileSnapshot(ownerId, role, profile, revision) {
  return useAuthStore().publishProfileSnapshot(ownerId, role, profile, revision)
}
