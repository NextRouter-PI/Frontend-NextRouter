import { state } from './state'

// São snapshots de apresentação, nunca autorização nem um cache que dispense /me/.
export function invalidateProfileSnapshot(ownerId) {
  if (!state.logged || state.user?.id !== ownerId) return
  state.profileRevision += 1
  state.profileStale = true
}

export function publishAccountSnapshot(ownerId, user) {
  if (!state.logged || state.user?.id !== ownerId || user.id !== ownerId) return false
  state.user = { ...user }
  state.profiles = Object.fromEntries(Object.entries(state.profiles).map(([role, profile]) => [
    role, { ...profile, user_data: state.user },
  ]))
  state.profileRevision += 1
  return true
}

export function publishProfileSnapshot(ownerId, role, profile, revision) {
  if (!state.logged || state.user?.id !== ownerId || state.role !== role ||
      profile.user_data?.id !== ownerId || state.profileRevision !== revision) return false
  const user = { ...profile.user_data }
  state.user = user
  state.profiles = Object.fromEntries(Object.entries(state.profiles).map(([key, value]) => [
    key, key === role ? { ...profile, user_data: user } : { ...value, user_data: user },
  ]))
  state.profileRevision += 1
  state.profileStale = false
  return true
}
