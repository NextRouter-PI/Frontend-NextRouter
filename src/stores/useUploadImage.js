import { reactive } from 'vue'
import uploadImageApi from '@/api/upload'

const state = reactive({
  uploading: false,
  error: null,
})

async function upload(file, description = '') {
  state.uploading = true
  state.error = null

  try {
    const response = await uploadImageApi(file, description)
    return response.data
  } catch (error) {
    state.error = error.response?.data || error.message || 'Erro ao fazer upload'
    throw error
  } finally {
    state.uploading = false
  }
}

export function useUploadImage() {
  return { state, upload }
}
