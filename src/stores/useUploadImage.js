import { onScopeDispose, reactive } from 'vue'
import uploadImageApi from '@/api/upload'

export function useUploadImage() {
  const state = reactive({
    uploading: false,
    error: null,
  })
  const controller = new AbortController()
  const { signal } = controller
  let pendingUploads = 0

  async function upload(file, description = '') {
    signal.throwIfAborted()
    pendingUploads += 1
    state.uploading = true
    state.error = null

    try {
      const response = await uploadImageApi(file, description, { signal })
      signal.throwIfAborted()
      return response.data
    } catch (error) {
      if (!signal.aborted) {
        state.error = error.response?.data || error.message || 'Erro ao fazer upload'
      }
      throw error
    } finally {
      pendingUploads -= 1
      if (!signal.aborted) state.uploading = pendingUploads > 0
    }
  }

  onScopeDispose(() => controller.abort())

  return { state, upload }
}
