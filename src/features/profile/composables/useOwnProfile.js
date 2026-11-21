import { computed, inject, onScopeDispose, provide, readonly, ref, shallowRef, watch } from 'vue'
import { useAuthStore } from '@/stores/useAuthStore'
import { readOwnProfile, patchOwnProfile, profileDocumentFields } from '@/api/profile'
import { sessionError } from '@/stores/session'
import { formatApiError } from '@/utils/apiErrors'
import { uploadAndAttachProfileAsset } from '@/features/profile/services/profileAssetService'

const PROFILE_KEY = Symbol('own-profile')

export function provideOwnProfile() {
  const auth = useAuthStore()
  const profile = ref(null)
  const role = computed(() => auth.role)
  const user = computed(() => (profile.value ? readonly(profile.value.user_data) : null))
  const ready = shallowRef(false)
  const loading = shallowRef(false)
  const busy = shallowRef(false)
  const error = shallowRef('')
  const notice = shallowRef('')
  const editing = shallowRef('')
  const supported = computed(() => auth.logged && ['passenger', 'driver', 'company'].includes(role.value))
  let lifetime = new AbortController()
  let reader = null
  let disposed = false
  const uploaded = new Map()

  async function read(signal) {
    reader?.abort()
    reader = new AbortController()
    const readSignal = AbortSignal.any([signal, reader.signal])
    const ownerId = auth.user?.id
    const currentRole = role.value
    const revision = auth.profileRevision
    loading.value = true
    ready.value = false
    error.value = ''
    try {
      const data = await readOwnProfile(currentRole, { signal: readSignal })
      if (readSignal.aborted) return false
      if (!auth.publishProfileSnapshot(ownerId, currentRole, data, revision)) {
        throw new Error('Outra consulta alterou o perfil. Atualize antes de editar.')
      }
      profile.value = data
      ready.value = true
      return true
    } catch (cause) {
      if (!readSignal.aborted) {
        auth.invalidateProfileSnapshot(ownerId)
        error.value = sessionError(cause, cause.response || cause.isAxiosError
          ? formatApiError(cause, 'Não foi possível consultar o perfil.') : cause.message)
        error.value += ' Atualize a consulta antes de salvar.'
      }
      return false
    } finally {
      if (!readSignal.aborted) loading.value = false
    }
  }

  function refresh() {
    if (disposed || !supported.value || busy.value || (editing.value && ready.value)) return false
    return read(lifetime.signal)
  }

  function startEdit(part) {
    if (!ready.value || busy.value || loading.value || editing.value) return false
    editing.value = part
    notice.value = ''
    return true
  }

  function cancelEdit(part) {
    if (!busy.value && editing.value === part) editing.value = ''
  }

  async function perform(part, operation) {
    if (disposed || !supported.value || !ready.value || busy.value || loading.value ||
        (editing.value && editing.value !== part)) return false
    const signal = lifetime.signal
    const ownerId = auth.user.id
    reader?.abort()
    auth.invalidateProfileSnapshot(ownerId)
    ready.value = false
    busy.value = true
    error.value = ''
    notice.value = ''
    try {
      await operation(signal)
      if (signal.aborted) return false
      notice.value = 'Alteração confirmada pelo servidor.'
      await read(signal)
      if (signal.aborted) return false
      editing.value = ''
      return true
    } catch (cause) {
      if (!signal.aborted) {
        error.value = sessionError(cause, formatApiError(cause, 'Não foi possível salvar a alteração.'))
        if (!cause.response || cause.response.status >= 500) error.value += ' O resultado pode ser incerto.'
        error.value += ' A operação não foi repetida. Atualize o perfil antes de tentar novamente; seu rascunho não será substituído.'
      }
      return false
    } finally {
      if (!signal.aborted) busy.value = false
    }
  }

  function save(part, values) {
    return perform(part, (signal) => patchOwnProfile(role.value, part, values, { signal }))
  }

  function replaceAsset(field, file) {
    const photo = field === 'photo'
    if (!file || (!photo && !profileDocumentFields(role.value).includes(field))) return false
    return perform(`asset:${field}`, (signal) =>
      uploadAndAttachProfileAsset({ role: role.value, field, file, uploadedCache: uploaded, signal }),
    )
  }

  watch(() => auth.roleIdentityKey, () => {
    lifetime.abort()
    reader?.abort()
    lifetime = new AbortController()
    uploaded.clear()
    profile.value = null
    ready.value = loading.value = busy.value = false
    editing.value = error.value = notice.value = ''
    if (supported.value) read(lifetime.signal)
  }, { immediate: true, flush: 'sync' })

  onScopeDispose(() => {
    disposed = true
    lifetime.abort()
    reader?.abort()
    uploaded.clear()
  })

  const context = {
    profile: readonly(profile), user, role, ready: readonly(ready), loading: readonly(loading),
    busy: readonly(busy), error: readonly(error), notice: readonly(notice), editing: readonly(editing),
    supported, refresh, startEdit, cancelEdit, save, replaceAsset,
  }
  provide(PROFILE_KEY, context)
  return context
}

export function useOwnProfile() {
  const context = inject(PROFILE_KEY)
  if (!context) throw new Error('O perfil deve ser usado dentro de UserView.')
  return context
}
