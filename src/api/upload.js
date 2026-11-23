import api from './client'

const uploadImage = (file, description = '', { signal } = {}) => {
  const formData = new FormData()
  formData.append('file', file)
  if (description) formData.append('description', description)
  return api.post('/uploads/images/', formData, {
    signal,
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export const uploadDocument = (file, description = '', { signal } = {}) => {
  const formData = new FormData()
  formData.append('file', file)
  if (description) formData.append('description', description)
  return api.post('/uploads/documents/', formData, {
    signal,
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export default uploadImage
