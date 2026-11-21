import { patchOwnProfile, attachProfileDocument } from '@/api/profile'
import uploadImage, { uploadDocument } from '@/api/upload'

export async function uploadAndAttachProfileAsset({ role, field, file, uploadedCache, signal }) {
  const isPhoto = field === 'photo'
  let item = uploadedCache.get(field)
  if (item?.file !== file) {
    const response = isPhoto
      ? await uploadImage(file, '', { signal })
      : await uploadDocument(file, 'Documento cadastral', { signal })
    signal.throwIfAborted()
    item = { file, key: response.data.attachment_key }
    uploadedCache.set(field, item)
  }
  if (!item.key) throw new Error('O upload não retornou uma chave de associação.')
  if (isPhoto) await patchOwnProfile(role, 'photo', { profile_picture: item.key }, { signal })
  else await attachProfileDocument(role, field, item.key, { signal })
  signal.throwIfAborted()
  uploadedCache.delete(field)
}
